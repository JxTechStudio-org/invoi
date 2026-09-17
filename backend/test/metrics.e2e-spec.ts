import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MetricsModule } from '../src/metrics/metrics.module';

@Controller()
class MetricsTestController {
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('invoices/:id')
  invoice(): { status: string } {
    return { status: 'ok' };
  }

  @Get('failure')
  failure(): never {
    throw new Error('database-password=must-not-appear');
  }

  @Get('bad-request')
  badRequest(): never {
    throw new BadRequestException();
  }
}

describe('Prometheus metrics (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MetricsModule],
      controllers: [MetricsTestController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('exposes Prometheus metrics with the expected content type and defaults', async () => {
    const response = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.headers['content-type']).toContain('version=0.0.4');
    expect(response.headers['content-type']).toContain('charset=utf-8');
    expect(response.text).toContain('# HELP invoi_http_requests_total');
    expect(response.text).toContain('# TYPE invoi_http_requests_total counter');
    expect(response.text).toContain('# HELP process_start_time_seconds');
  });

  it('records normal requests with method, normalized route, and status code', async () => {
    const invoiceId = 'cmu2lxbyq0000qy2g3udd5gvg';
    const querySecret = 'private-customer-name';

    await request(app.getHttpServer())
      .get(`/api/invoices/${invoiceId}?customer=${querySecret}`)
      .expect(200);

    const metrics = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(metrics.text).toContain(
      'invoi_http_requests_total{method="GET",route="/api/invoices/:id",status_code="200"} 1',
    );
    expect(metrics.text).not.toContain(invoiceId);
    expect(metrics.text).not.toContain(querySecret);
  });

  it('records unexpected failures as 5xx without exposing error details', async () => {
    await request(app.getHttpServer()).get('/api/failure').expect(500);

    const metrics = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(metrics.text).toContain(
      'invoi_http_requests_total{method="GET",route="/api/failure",status_code="500"} 1',
    );
    expect(metrics.text).not.toContain('database-password');
    expect(metrics.text).not.toContain('must-not-appear');
  });

  it('records handled application errors with their 4xx status code', async () => {
    await request(app.getHttpServer()).get('/api/bad-request').expect(400);

    const metrics = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(metrics.text).toContain(
      'invoi_http_requests_total{method="GET",route="/api/bad-request",status_code="400"} 1',
    );
  });

  it('does not count metric scrapes as application requests', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
    await request(app.getHttpServer()).get('/api/metrics?token=secret-one').expect(200);
    const metrics = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(metrics.text).toContain(
      'invoi_http_requests_total{method="GET",route="/api/health",status_code="200"} 1',
    );
    expect(metrics.text).not.toContain('route="/api/metrics"');
    expect(metrics.text).not.toContain('secret-one');
  });

  it('does not create a raw route label for unknown URLs', async () => {
    const unknownValue = 'arbitrary-user-supplied-path';
    await request(app.getHttpServer()).get(`/api/${unknownValue}`).expect(404);

    const metrics = await request(app.getHttpServer()).get('/api/metrics').expect(200);

    expect(metrics.text).not.toContain(unknownValue);
  });
});
