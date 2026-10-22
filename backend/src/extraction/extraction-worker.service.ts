import {
  Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Optional,
} from '@nestjs/common';
import type { Readable } from 'node:stream';
import { MetricsService } from '../metrics/metrics.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';
import { EXTRACTION_CONFIG, ExtractionConfig } from './extraction.config';
import { ExtractionJobRef, ExtractionJobsService } from './extraction-jobs.service';
import { ExtractionError, INVOICE_EXTRACTOR, InvoiceExtractor } from './invoice-extractor';

export const POLL_INTERVAL_MS = 5_000;
/** One or two invoices at a time is enough below 200 a day (A5). */
export const MAX_CONCURRENT_JOBS = 2;

/**
 * Background worker inside the NestJS process (C10). Every few seconds it claims queued
 * jobs and hands each file to the extractor, within the kill switch, allow-list and
 * monthly budget (A4, G25). It does not start without EXTRACTION_ENABLED=true and an extractor.
 */
@Injectable()
export class ExtractionWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ExtractionWorkerService.name);
  private readonly running = new Map<string, Promise<void>>();
  private timer?: NodeJS.Timeout;
  private ticking = false;
  private budgetAlertMonth?: string;

  constructor(
    @Inject(EXTRACTION_CONFIG) private readonly config: ExtractionConfig,
    private readonly jobs: ExtractionJobsService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly metrics: MetricsService,
    @Optional() @Inject(INVOICE_EXTRACTOR) private readonly extractor: InvoiceExtractor | null,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.enabled) {
      this.logger.log('Extraction is disabled (EXTRACTION_ENABLED is not true); jobs stay queued');
      return;
    }
    if (!this.extractor) {
      this.logger.warn('EXTRACTION_ENABLED is true but no extractor is available yet; jobs stay queued');
      return;
    }
    const scope = this.config.accountAllowlist.length
      ? `${this.config.accountAllowlist.length} allow-listed account(s)` : 'all accounts';
    this.logger.log(`Extraction worker started for ${scope}, budget USD ${this.config.monthlyBudgetUsd}/month`);
    this.timer = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    void this.tick();
  }

  async onApplicationShutdown(): Promise<void> {
    clearInterval(this.timer);
    await this.idle();
  }

  /** One polling round: recover stuck jobs, then start jobs while there is room and budget. */
  async tick(): Promise<void> {
    if (this.ticking || !this.config.enabled || !this.extractor) return;
    this.ticking = true;
    try {
      await this.recover();
      while (this.running.size < MAX_CONCURRENT_JOBS && await this.withinBudget()) {
        const job = await this.jobs.claimNext(this.config.accountAllowlist);
        if (!job) break;
        const run = this.process(job).finally(() => this.running.delete(job.id));
        this.running.set(job.id, run);
      }
    } catch (error) {
      this.logger.error('Extraction polling failed', error instanceof Error ? error.stack : String(error));
    } finally {
      this.ticking = false;
    }
  }

  /** Resolves once every job started so far has finished. */
  async idle(): Promise<void> {
    await Promise.allSettled([...this.running.values()]);
  }

  private async withinBudget(): Promise<boolean> {
    const spent = await this.jobs.monthSpendUsd();
    this.metrics.setAiSpendThisMonth(spent);
    if (spent < this.config.monthlyBudgetUsd) return true;

    const month = new Date().toISOString().slice(0, 7);
    if (this.budgetAlertMonth !== month) {
      this.budgetAlertMonth = month;
      this.logger.warn(
        `AI budget reached: USD ${spent.toFixed(4)} of ${this.config.monthlyBudgetUsd} spent in ${month}; `
        + 'extraction paused, jobs stay queued',
      );
    }
    return false;
  }

  private async recover(): Promise<void> {
    await this.jobs.failOrphans();
    for (const job of await this.jobs.findStale([...this.running.keys()])) {
      this.record(await this.jobs.fail(job, 'Worker stopped while the job was running'));
    }
  }

  private async process(job: ExtractionJobRef): Promise<void> {
    try {
      const fileUrl = job.invoiceId ? await this.jobs.findFileUrl(job.invoiceId) : null;
      const file = fileUrl ? await this.storage.download(fileUrl) : null;
      if (!job.invoiceId || !file) {
        throw new ExtractionError('Invoice file not found', { permanent: true });
      }

      const started = Date.now();
      const result = await this.extractor!.extract({
        invoiceId: job.invoiceId, content: await readAll(file.stream), contentType: file.contentType,
      });
      await this.jobs.complete(job, result, Date.now() - started);
      this.metrics.recordExtractionJob('done');
    } catch (error) {
      const extractionError = error instanceof ExtractionError ? error : undefined;
      const message = error instanceof Error ? error.message : String(error);
      try {
        const outcome = await this.jobs.fail(job, message, {
          permanent: extractionError?.permanent, costUsd: extractionError?.costUsd,
        });
        this.record(outcome);
        this.logger.warn(`Extraction job ${job.id} attempt ${job.attempts} ${outcome}: ${message}`);
      } catch (failError) {
        // The job stays running and is recovered as stale on a later round.
        this.logger.error(`Could not record failure of extraction job ${job.id}`,
          failError instanceof Error ? failError.stack : String(failError));
      }
    }
  }

  private record(outcome: 'retried' | 'failed'): void {
    this.metrics.recordExtractionJob(outcome);
  }
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
