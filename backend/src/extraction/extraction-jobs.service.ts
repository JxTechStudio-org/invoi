import { Injectable } from '@nestjs/common';
import { InvoiceStatus, JobState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EXTRACTION_FAILED_REASON, evaluateInvoiceReview, parseReviewReasons,
} from '../invoices/invoice-review';
import { EXTRACTED_FIELDS, ExtractedFields, ExtractionResult } from './invoice-extractor';

/** Waits before each retry: 3 retries after the first attempt (C11). */
export const RETRY_DELAYS_MS = [1, 5, 15].map(minutes => minutes * 60_000);
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** A job still running after this long belongs to a worker that stopped mid-job. */
export const STALE_JOB_MS = 10 * 60_000;
const MAX_ERROR_LENGTH = 500;

export interface ExtractionJobRef {
  id: string;
  invoiceId: string | null;
  attempts: number;
}

export type FailureOutcome = 'retried' | 'failed';

/** Database side of the extraction queue: claim, finish, retry, fail and spend. */
@Injectable()
export class ExtractionJobsService {
  constructor(private readonly prisma: PrismaService) {}

  /** AI spend since the start of the current UTC month, extraction and analytics together (H2). */
  async monthSpendUsd(now = new Date()): Promise<number> {
    const since = { createdAt: { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) } };
    const [extraction, analysis] = await Promise.all([
      this.prisma.extractionJob.aggregate({ where: since, _sum: { costUsd: true } }),
      this.prisma.analysisJob.aggregate({ where: since, _sum: { costUsd: true } }),
    ]);
    return (extraction._sum.costUsd?.toNumber() ?? 0) + (analysis._sum.costUsd?.toNumber() ?? 0);
  }

  /**
   * Claims the oldest due job and marks it running. Demo accounts are never claimed (H9);
   * accounts outside a non-empty allow-list stay queued until they are added (G25).
   */
  async claimNext(accountAllowlist: string[]): Promise<ExtractionJobRef | null> {
    // Prisma stores UTC in timestamp-without-time-zone columns, so compare in UTC.
    const rows = await this.prisma.$queryRaw<ExtractionJobRef[]>`
      WITH next AS (
        SELECT j."id"
        FROM "ExtractionJob" AS j
        JOIN "Invoice" AS i ON i."id" = j."invoiceId"
        JOIN "User" AS u ON u."id" = i."userId"
        WHERE j."state" = 'queued'
          AND j."runAfter" <= (now() AT TIME ZONE 'UTC')
          AND NOT u."isDemo"
          AND (cardinality(${accountAllowlist}::text[]) = 0 OR u."id" = ANY(${accountAllowlist}::text[]))
        ORDER BY j."runAfter", j."createdAt"
        LIMIT 1
        FOR UPDATE OF j SKIP LOCKED
      )
      UPDATE "ExtractionJob" AS j
      SET "state" = 'running', "attempts" = j."attempts" + 1, "updatedAt" = (now() AT TIME ZONE 'UTC')
      FROM next
      WHERE j."id" = next."id"
      RETURNING j."id", j."invoiceId", j."attempts"`;
    return rows[0] ?? null;
  }

  async findFileUrl(invoiceId: string): Promise<string | null> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, select: { fileUrl: true } });
    return invoice?.fileUrl ?? null;
  }

  /**
   * Stores the result and runs the review rules: clean → completed (X1), otherwise
   * needs_review. Fields the user edited by hand are never overwritten (C12). An invoice
   * that is no longer processing was taken over by a person and is left as it is.
   */
  async complete(job: ExtractionJobRef, result: ExtractionResult, durationMs: number): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.extractionJob.update({
        where: { id: job.id },
        data: { state: JobState.done, lastError: null, costUsd: { increment: result.costUsd } },
      });
      if (!job.invoiceId) return;

      await tx.$queryRaw`SELECT 1 FROM "Invoice" WHERE "id" = ${job.invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({
        where: { id: job.invoiceId },
        include: { user: { select: { businessName: true, businessNameEn: true, reviewAmountThreshold: true } } },
      });
      if (!invoice || invoice.status !== InvoiceStatus.processing) return;

      const edited = new Set<string>(invoice.editedFields);
      const fields: Partial<Record<keyof ExtractedFields, unknown>> = {};
      for (const field of EXTRACTED_FIELDS) {
        if (!edited.has(field) && result.fields[field] !== undefined) fields[field] = result.fields[field];
      }
      const confidence = Object.fromEntries(
        Object.entries(result.confidence).filter(([field]) => !edited.has(field)),
      );
      const reasons = [...new Set([
        ...parseReviewReasons(invoice.needsReviewReason).filter(reason => reason !== EXTRACTION_FAILED_REASON),
        ...(result.reviewReasons ?? []),
      ])];

      const review = evaluateInvoiceReview({
        ...invoice,
        ...(fields as Partial<ExtractedFields>),
        extractionConfidence: confidence,
        needsReviewReason: reasons.join(',') || null,
        status: InvoiceStatus.completed,
      }, invoice.user);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          ...(fields as Prisma.InvoiceUpdateInput),
          extractionConfidence: confidence,
          extractionModel: result.model,
          extractionDurationMs: durationMs,
          extractionCostUsd: result.costUsd,
          extractedAt: new Date(),
          status: review.status,
          needsReviewReason: review.needsReviewReason,
        },
      });
    });
  }

  /**
   * Schedules a retry, or after the last attempt (or a permanent error) fails the job and
   * sends a still-processing invoice to needs_review with extraction_failed (C11).
   */
  async fail(
    job: ExtractionJobRef,
    message: string,
    options: { permanent?: boolean; costUsd?: number } = {},
  ): Promise<FailureOutcome> {
    const lastError = message.slice(0, MAX_ERROR_LENGTH);
    const costUsd = { increment: options.costUsd ?? 0 };

    if (!options.permanent && job.attempts < MAX_ATTEMPTS && job.invoiceId) {
      await this.prisma.extractionJob.update({
        where: { id: job.id },
        data: {
          state: JobState.queued, lastError, costUsd,
          runAfter: new Date(Date.now() + RETRY_DELAYS_MS[job.attempts - 1]),
        },
      });
      return 'retried';
    }

    await this.prisma.$transaction(async tx => {
      await tx.extractionJob.update({ where: { id: job.id }, data: { state: JobState.failed, lastError, costUsd } });
      if (!job.invoiceId) return;

      await tx.$queryRaw`SELECT 1 FROM "Invoice" WHERE "id" = ${job.invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({
        where: { id: job.invoiceId }, select: { status: true, needsReviewReason: true },
      });
      if (invoice?.status !== InvoiceStatus.processing) return;

      const reasons = parseReviewReasons(invoice.needsReviewReason);
      if (!reasons.includes(EXTRACTION_FAILED_REASON)) reasons.push(EXTRACTION_FAILED_REASON);
      await tx.invoice.update({
        where: { id: job.invoiceId },
        data: { status: InvoiceStatus.needs_review, needsReviewReason: reasons.join(',') },
      });
    });
    return 'failed';
  }

  /** Jobs left running by a worker that stopped mid-job, except the ones still in progress here. */
  async findStale(activeJobIds: string[]): Promise<ExtractionJobRef[]> {
    return this.prisma.extractionJob.findMany({
      where: {
        state: JobState.running,
        updatedAt: { lt: new Date(Date.now() - STALE_JOB_MS) },
        id: { notIn: activeJobIds },
      },
      select: { id: true, invoiceId: true, attempts: true },
    });
  }

  /** Queued jobs whose invoice was deleted can never run. */
  async failOrphans(): Promise<number> {
    const { count } = await this.prisma.extractionJob.updateMany({
      where: { state: JobState.queued, invoiceId: null },
      data: { state: JobState.failed, lastError: 'Invoice was deleted before extraction' },
    });
    return count;
  }
}
