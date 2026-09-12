import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PendingFileRemoval, STORAGE_SERVICE, StorageService } from '../storage/storage.service';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { evaluateInvoiceReview } from './invoice-review';
import { invoicesToCsv } from './invoice-csv';

const editableTextFields = [
  'vendorName', 'invoiceNumber', 'currency', 'paymentStatus', 'paymentMethod',
  'customerName', 'taxNumber', 'crNumber',
] as const;

type EditableInvoice = Pick<Invoice,
  typeof editableTextFields[number] | 'invoiceDate' | 'dueDate' | 'totalAmount' | 'taxAmount'
>;

type InvoiceResponse = Invoice & {
  sellerName: Invoice['vendorName'];
  amount: Invoice['totalAmount'];
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

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

  async list(query: ListInvoicesQueryDto): Promise<InvoiceResponse[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.invoiceDate = { gte: start, lt: end };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async getById(id: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} was not found`);
    }

    return this.toResponse(invoice);
  }

  async export(query: ListInvoicesQueryDto): Promise<string> {
    return invoicesToCsv(await this.list(query));
  }

  async getStatus(id: string): Promise<{ invoiceId: string; status: InvoiceStatus }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id }, select: { id: true, status: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);
    return { invoiceId: invoice.id, status: invoice.status };
  }

  async update(id: string, body: UpdateInvoiceDto): Promise<InvoiceResponse> {
    const changes: Partial<EditableInvoice> = {};
    for (const field of editableTextFields) {
      if (body[field] !== undefined) changes[field] = body[field];
    }
    for (const field of ['invoiceDate', 'dueDate'] as const) {
      const value = body[field];
      if (value !== undefined) changes[field] = value === null ? null : new Date(value);
    }
    for (const field of ['totalAmount', 'taxAmount'] as const) {
      const value = body[field];
      if (value !== undefined) changes[field] = value === null ? null : new Prisma.Decimal(value);
    }
    if (!Object.keys(changes).length) {
      throw new BadRequestException('At least one editable invoice field is required');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id }, include: { user: { select: { businessName: true } } },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} was not found`);

    const review = evaluateInvoiceReview({ ...invoice, ...changes }, invoice.user.businessName);
    try {
      const updated = await this.prisma.invoice.update({ where: { id }, data: { ...changes, ...review } });
      return this.toResponse(updated);
    } catch (error) {
      this.rethrowPersistenceError(error, id);
    }
  }

  async delete(id: string): Promise<void> {
    let removal: PendingFileRemoval | undefined;
    try {
      await this.prisma.$transaction(async transaction => {
        const invoice = await transaction.invoice.delete({ where: { id }, select: { fileUrl: true } });
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
