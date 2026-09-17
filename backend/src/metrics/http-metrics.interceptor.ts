import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

type RoutedRequest = Request & {
  route?: {
    path?: unknown;
  };
};

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getClass() === MetricsController) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RoutedRequest>();
    const response = http.getResponse<Response>();
    const method = request.method.toUpperCase();
    const route = this.getNormalizedRoute(request);

    return next.handle().pipe(tap({
      complete: () => {
        this.metricsService.recordHttpRequest(method, route, response.statusCode);
      },
      error: (error: unknown) => {
        this.metricsService.recordHttpRequest(method, route, this.getErrorStatus(error));
      },
    }));
  }

  private getNormalizedRoute(request: RoutedRequest): string {
    const routePath = request.route?.path;
    if (typeof routePath !== 'string') {
      return 'unknown';
    }

    const path = `${request.baseUrl}${routePath}`.replace(/\/{2,}/g, '/');
    return path.startsWith('/') ? path : `/${path}`;
  }

  private getErrorStatus(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (typeof error === 'object' && error !== null) {
      const status = 'status' in error ? error.status : undefined;
      const statusCode = 'statusCode' in error ? error.statusCode : undefined;
      const candidate = typeof status === 'number' ? status : statusCode;
      if (typeof candidate === 'number' && candidate >= 400 && candidate < 600) {
        return candidate;
      }
    }

    return 500;
  }
}
