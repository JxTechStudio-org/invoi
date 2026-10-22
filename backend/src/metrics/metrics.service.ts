import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Registry,
} from '@prometheus-io/client';

const requestLabelNames = ['method', 'route', 'status_code'] as const;

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'invoi_http_requests_total',
    help: 'Total number of HTTP requests handled by the Invoi application.',
    labelNames: requestLabelNames,
    registers: [this.registry],
  });
  private readonly extractionJobs = new Counter({
    name: 'invoi_extraction_jobs_total',
    help: 'Extraction job attempts by outcome: done, retried or failed.',
    labelNames: ['outcome'] as const,
    registers: [this.registry],
  });
  private readonly aiSpend = new Gauge({
    name: 'invoi_ai_spend_usd_month',
    help: 'AI spend in USD since the start of the current UTC month (extraction and analytics).',
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(method: string, route: string, statusCode: number): void {
    this.httpRequests.inc({
      method,
      route,
      status_code: String(statusCode),
    });
  }

  recordExtractionJob(outcome: 'done' | 'retried' | 'failed'): void {
    this.extractionJobs.inc({ outcome });
  }

  setAiSpendThisMonth(usd: number): void {
    this.aiSpend.set(usd);
  }
}
