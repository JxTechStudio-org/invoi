import { Module } from '@nestjs/common';
import { ClaudeInvoiceModel } from './claude-invoice-model';
import { MetricsModule } from '../metrics/metrics.module';
import { StorageModule } from '../storage/storage.module';
import { EXTRACTION_CONFIG, ExtractionConfig, extractionConfigFromEnvironment } from './extraction.config';
import { ExtractionJobsService } from './extraction-jobs.service';
import { ExtractionWorkerService } from './extraction-worker.service';
import { InvoiceExtractionPipeline } from './invoice-extraction-pipeline';
import { INVOICE_EXTRACTOR, InvoiceExtractor } from './invoice-extractor';

/** Built only when extraction is enabled, so the API key is needed only then (A3). */
export function invoiceExtractorFor(
  config: ExtractionConfig,
  environment: NodeJS.ProcessEnv = process.env,
): InvoiceExtractor | null {
  if (!config.enabled) return null;
  if (!environment.ANTHROPIC_API_KEY?.trim()) {
    throw new Error('ANTHROPIC_API_KEY is required when EXTRACTION_ENABLED is true');
  }
  return new InvoiceExtractionPipeline(new ClaudeInvoiceModel(config.model));
}

@Module({
  imports: [StorageModule, MetricsModule],
  providers: [
    { provide: EXTRACTION_CONFIG, useFactory: () => extractionConfigFromEnvironment() },
    { provide: INVOICE_EXTRACTOR, inject: [EXTRACTION_CONFIG], useFactory: (config: ExtractionConfig) => invoiceExtractorFor(config) },
    ExtractionJobsService,
    ExtractionWorkerService,
  ],
})
export class ExtractionModule {}
