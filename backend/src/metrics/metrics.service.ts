import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
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
}
