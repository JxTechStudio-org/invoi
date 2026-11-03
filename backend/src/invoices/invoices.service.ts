import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExtractionTrigger, Invoice, InvoiceStatus, JobState, Prisma } from '@prisma/client';
import { ExtractionAvailabilityService } from '../extraction/extraction-availability.service';
import { CANCELLED_BY_USER_ERROR } from '../extraction/extraction-jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PendingFileRemoval, STORAGE_SERVICE, StorageService, StoredFileContent,
} from '../storage/storage.service';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { evaluateInvoiceReview, parseReviewReasons, USER_FLAGGED_REASON } from './invoice-review';
import { invoicesToCsv } from './invoice-csv';

const editableTextFields = [
  'vendorName', 'invoiceNumber', 'customerName', 'taxNumber', 'crNumber',
] as const;

type EditableInvoice = Pick<Invoice,
  typeof editableTextFields[number] | 'currency' | 'paymentStatus' | 'paymentMethod'
  | 'invoiceDate' | 'dueDate' | 'totalAmount' | 'taxAmount' | 'amountPaid'
>;

/** Re-extractions a user may request per invoice; upload and backfill jobs do not count. */
export const MAX_REEXTRACTS = 3;

// Minimum data a human must have confirmed before an invoice can be completed.
const approvalRequiredFields = ['vendorName', 'totalAmount', 'invoiceDate'] as const;

type InvoiceResponse = Invoice & {
  sellerName: Invoice['vendorName'];
  amount: Invoice['totalAmount'];
};

const reviewAccountFields = { businessName: true, businessNameEn: true, reviewAmountThreshold: true } as const;

type LockedInvoice = Prisma.InvoiceGetPayload<{ include: { user: { select: typeof reviewAccountFields } } }>;

function sameValue(stored: unknown, next: unknown): boolean {
  if (stored instanceof Prisma.Decimal && next instanceof Prisma.Decimal) return stored.equals(next);
  if (stored instanceof Date && next instanceof Date) return stored.getTime() === next.getTime();
  return stored === next;
}

/** The extraction scores without the given fields; the same object if none of them had a score. */
function withoutScores(confidence: Prisma.JsonValue, fields: string[]): Prisma.JsonValue {
  if (!confidence || typeof confidence !== 'object' || Array.isArray(confidence)
    || !fields.some(field => field in confidence)) {
    return confidence;
  }
  return Object.fromEntries(Object.entries(confidence).filter(([field]) => !fields.includes(field)));
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly extractionAvailability: ExtractionAvailabilityService,
  ) { }

  async createFromUpload(file: Express.Multer.File, userId: string): Promise<Invoice> {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new BadRequestException('userId must be a non-empty string');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    const storedFile = await this.storageService.upload(file);

    try {
      return await this.prisma.invoice.create({
        data: {
          fileUrl: storedFile.fileUrl,
          status: InvoiceStatus.processing,
          user: { connect: { id: user.id } },
          // Queued in the same insert so no upload is missed (A5); the worker decides when it runs.
          extractionJobs: { create: {} },
        },
      });
    } catch (error) {
      try {
        await this.storageService.remove(storedFile);
      } catch {
        this.logger.error('Failed to clean up uploaded file after invoice creation failed');
      }
      throw error;
    }
  }

  async list(query: ListInvoicesQueryDto, userId: string): Promise<InvoiceResponse[]> {
    const where: Prisma.InvoiceWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.invoiceDate = { gte: start, lt: end };
    }

    if (query.search) {
      where.OR = [
        { vendorName: { contains: query.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async getById(id: string, userId: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id, userId } });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} was not found`);
    }

    return this.toResponse(invoice);
  }

  async export(query: ListInvoicesQueryDto, userId: string): Promise<string> {
    return invoicesToCsv(await this.list(query, userId));
  }

  /**
   * Polled by the frontend while an invoice is processing (D14). extractionState tells it
   * whether a job is waiting or running, so it can lock the page only while one runs (D15).
   */
  async getStatus(id: string, userId: string): Promise<{
    invoiceId: string; status: InvoiceStatus; extractionState: 'queued' | 'running' | null;
  }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, userId },
      select: {
        id: true, status: true,
        extractionJobs: { where: { state: { in: [JobState.queued, JobState.running] } }, select: { state: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);
    const states = invoice.extractionJobs.map(job => job.state);
    const extractionState = states.includes(JobState.running) ? 'running'
      : states.includes(JobState.queued) ? 'queued' : null;
    return { invoiceId: invoice.id, status: invoice.status, extractionState };
  }

  /**
   * Hand edit: re-runs the review rules, records the changed fields in editedFields so
   * extraction never overwrites them (C12), and drops their extraction scores, since a
   * value typed by a person is no longer a low-confidence guess.
   */
  async update(id: string, body: UpdateInvoiceDto, userId: string): Promise<InvoiceResponse> {
    const changes: Partial<EditableInvoice> = {};
    for (const field of editableTextFields) {
      if (body[field] !== undefined) changes[field] = body[field];
    }
    if (body.currency !== undefined) changes.currency = body.currency;
    if (body.paymentStatus !== undefined) changes.paymentStatus = body.paymentStatus;
    if (body.paymentMethod !== undefined) changes.paymentMethod = body.paymentMethod;
    for (const field of ['invoiceDate', 'dueDate'] as const) {
      const value = body[field];
      if (value !== undefined) changes[field] = value === null ? null : new Date(value);
    }
    for (const field of ['totalAmount', 'taxAmount', 'amountPaid'] as const) {
      const value = body[field];
      if (value !== undefined) changes[field] = value === null ? null : new Prisma.Decimal(value);
    }
    if (!Object.keys(changes).length) {
      throw new BadRequestException('At least one editable invoice field is required');
    }

    return this.changeByUser(id, userId, invoice => {
      const changed = (Object.keys(changes) as (keyof EditableInvoice)[])
        .filter(field => !sameValue(invoice[field], changes[field]));
      const extractionConfidence = withoutScores(invoice.extractionConfidence, changed);
      const review = evaluateInvoiceReview({ ...invoice, ...changes, extractionConfidence }, invoice.user);
      return {
        ...changes,
        ...review,
        editedFields: [...new Set([...invoice.editedFields, ...changed])],
        ...(extractionConfidence !== invoice.extractionConfidence
          && { extractionConfidence: extractionConfidence as Prisma.InputJsonObject }),
      };
    });
  }

  async getFile(id: string, userId: string): Promise<StoredFileContent> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, userId }, select: { fileUrl: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);

    const file = await this.storageService.download(invoice.fileUrl);
    if (!file) throw new NotFoundException(`File for invoice ${id} was not found`);
    return file;
  }

  /** Human sign-off: completes the invoice even if review rules fired. */
  async approve(id: string, userId: string): Promise<InvoiceResponse> {
    return this.changeByUser(id, userId, invoice => {
      const missing = approvalRequiredFields.filter(field => {
        const value = invoice[field];
        return value === null || (typeof value === 'string' && !value.trim());
      });
      if (missing.length) {
        throw new BadRequestException(`Invoice cannot be approved without: ${missing.join(', ')}`);
      }
      return { status: InvoiceStatus.completed, needsReviewReason: null };
    });
  }

  /**
   * Queues a fresh extraction and puts the invoice back in processing (C12). The worker
   * keeps every field in editedFields, and the result counts toward the budget like any
   * other job. Refused for approved invoices (flag first), while a job is queued or
   * running, when extraction cannot run for the account, and after MAX_REEXTRACTS.
   */
  async reExtract(id: string, userId: string): Promise<InvoiceResponse> {
    try {
      return await this.prisma.$transaction(async tx => {
        // Same row lock as changeByUser, so two clicks cannot queue two jobs.
        await tx.$queryRaw`SELECT 1 FROM "Invoice" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`;
        const invoice = await tx.invoice.findUnique({
          where: { id, userId }, select: { status: true, user: { select: { id: true, isDemo: true } } },
        });
        if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);

        if (invoice.status === InvoiceStatus.completed) {
          throw new ConflictException({
            code: 'INVOICE_COMPLETED', message: 'Approved invoices cannot be re-extracted; flag the invoice first',
          });
        }
        const unavailable = await this.extractionAvailability.unavailableReason(invoice.user);
        if (unavailable) {
          throw new ServiceUnavailableException({
            code: `EXTRACTION_${unavailable.toUpperCase()}`, message: `Extraction is not available: ${unavailable}`,
          });
        }
        const active = await tx.extractionJob.count({
          where: { invoiceId: id, state: { in: [JobState.queued, JobState.running] } },
        });
        if (active) {
          throw new ConflictException({ code: 'EXTRACTION_IN_PROGRESS', message: `Invoice ${id} is already queued for extraction` });
        }
        const used = await tx.extractionJob.count({ where: { invoiceId: id, trigger: ExtractionTrigger.reextract } });
        if (used >= MAX_REEXTRACTS) {
          throw new HttpException({
            code: 'REEXTRACT_LIMIT_REACHED', message: `Invoice ${id} was already re-extracted ${MAX_REEXTRACTS} times`,
          }, HttpStatus.TOO_MANY_REQUESTS);
        }

        await tx.extractionJob.create({ data: { invoiceId: id, trigger: ExtractionTrigger.reextract } });
        return this.toResponse(await tx.invoice.update({ where: { id }, data: { status: InvoiceStatus.processing } }));
      });
    } catch (error) {
      this.rethrowPersistenceError(error, id);
    }
  }

  /** User reports a problem: sends the invoice back to review until it is approved. */
  async flag(id: string, userId: string): Promise<InvoiceResponse> {
    return this.changeByUser(id, userId, invoice => {
      const reasons = parseReviewReasons(invoice.needsReviewReason);
      if (!reasons.includes(USER_FLAGGED_REASON)) reasons.push(USER_FLAGGED_REASON);
      return { status: InvoiceStatus.needs_review, needsReviewReason: reasons.join(',') };
    });
  }

  /**
   * Applies a person's change to one invoice while holding its row lock. A processing
   * invoice whose extraction job is running can only be viewed (D15): 409. Once the change
   * takes the invoice out of processing, its queued jobs are cancelled, since their result
   * would be ignored anyway. The cancel only touches jobs still queued, and the worker's
   * claim only touches jobs still queued, so exactly one of them wins; the running check
   * after the cancel catches a claim that won. An edit that leaves the invoice processing
   * keeps its job; a claim racing with it is safe, because the worker waits for this row
   * lock before storing a result and never overwrites editedFields.
   */
  private async changeByUser(
    id: string,
    userId: string,
    change: (invoice: LockedInvoice) => Prisma.InvoiceUpdateInput & { status: InvoiceStatus },
  ): Promise<InvoiceResponse> {
    try {
      return await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT 1 FROM "Invoice" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`;
        const invoice = await tx.invoice.findUnique({ where: { id, userId }, include: { user: { select: reviewAccountFields } } });
        if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);

        const processing = invoice.status === InvoiceStatus.processing;
        const assertNotExtracting = async () => {
          const running = await tx.extractionJob.count({ where: { invoiceId: id, state: JobState.running } });
          if (running) {
            throw new ConflictException({
              code: 'EXTRACTION_IN_PROGRESS', message: `Invoice ${id} is being extracted; try again when it finishes`,
            });
          }
        };

        if (processing) await assertNotExtracting();
        const data = change(invoice);
        if (data.status !== InvoiceStatus.processing) {
          await tx.extractionJob.updateMany({
            where: { invoiceId: id, state: JobState.queued },
            data: { state: JobState.failed, lastError: CANCELLED_BY_USER_ERROR },
          });
          if (processing) await assertNotExtracting();
        }

        return this.toResponse(await tx.invoice.update({ where: { id }, data }));
      });
    } catch (error) {
      this.rethrowPersistenceError(error, id);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    let removal: PendingFileRemoval | undefined;
    try {
      await this.prisma.$transaction(async transaction => {
        const invoice = await transaction.invoice.delete({ where: { id, userId }, select: { fileUrl: true } });
        removal = await this.storageService.stageRemoval(invoice.fileUrl);
      });
    } catch (error) {
      if (removal) {
        try {
          await removal.restore();
        } catch {
          this.logger.error('Failed to restore invoice file after database rollback');
        }
      }
      this.rethrowPersistenceError(error, id);
    }

    try {
      await removal!.finalize();
    } catch {
      this.logger.error('Failed to finalize invoice file deletion');
      throw new InternalServerErrorException('Invoice deleted but file cleanup failed');
    }
  }

  private rethrowPersistenceError(error: unknown, id: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Invoice ${id} was not found`);
    }
    throw error;
  }

  private toResponse(invoice: Invoice): InvoiceResponse {
    // Keep existing API consumers compatible with the v2 field names.
    return { ...invoice, sellerName: invoice.vendorName, amount: invoice.totalAmount };
  }
}
