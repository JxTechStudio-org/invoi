import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { StorageModule } from '../storage/storage.module';
import { EXTRACTION_CONFIG, extractionConfigFromEnvironment } from './extraction.config';
import { ExtractionJobsService } from './extraction-jobs.service';
import { ExtractionWorkerService } from './extraction-worker.service';
import { INVOICE_EXTRACTOR } from './invoice-extractor';

@Module({
  imports: [StorageModule, MetricsModule],
  providers: [
    { provide: EXTRACTION_CONFIG, useFactory: () => extractionConfigFromEnvironment() },
    // No extractor yet: the ZATCA QR reader and model client arrive in Phase 1 tasks 4–5.
    { provide: INVOICE_EXTRACTOR, useValue: null },
    ExtractionJobsService,
    ExtractionWorkerService,
  ],
})
export class ExtractionModule {}
