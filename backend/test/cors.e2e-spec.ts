import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { corsOptions } from '../src/cors.config';
import { HealthModule } from '../src/health/health.module';

describe('CORS HTTP behavior', () => {
  let app: INestApplication;

  async function createApp(allowedOrigins: string | undefined) {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableCors(corsOptions(allowedOrigins));
    await app.init();
  }

  afterEach(async () => {
    await app?.close();
  });

  it.each(['http://localhost:5173', 'https://frontend.example.com'])(
    'allows the configured origin %s after trimming whitespace and empty entries', async origin => {
      await createApp(' , http://localhost:5173, , https://frontend.example.com , ');

      const response = await request(app.getHttpServer())
        .get('/api/health').set('Origin', origin).expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers.vary).toContain('Origin');
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    },
  );

  it('allows a preflight for an approved origin without enabling credentials', async () => {
    await createApp('http://localhost:5173');

    const response = await request(app.getHttpServer())
      .options('/api/invoices/example')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PUT')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods'].split(',')).toContain('PUT');
    expect(response.headers['access-control-allow-headers']).toBe('content-type');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it.each([
    'https://unapproved.example.com',
    'http://localhost:5173.evil.com',
    'https://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'null',
  ])('withholds CORS approval for the nonmatching origin %s', async origin => {
    await createApp('http://localhost:5173');

    const response = await request(app.getHttpServer())
      .get('/api/health').set('Origin', origin).expect(200);
    const preflight = await request(app.getHttpServer())
      .options('/api/invoices/example')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'PUT')
      .expect(204);

    for (const result of [response, preflight]) {
      expect(result.headers['access-control-allow-origin']).toBeUndefined();
      expect(result.headers['access-control-allow-credentials']).toBeUndefined();
    }
  });

  it.each([undefined, '', ' , , ', '*'])(
    'does not allow all origins with configuration %p', async configuration => {
      await createApp(configuration);

      const response = await request(app.getHttpServer())
        .get('/api/health').set('Origin', 'http://localhost:5173').expect(200);
      const preflight = await request(app.getHttpServer())
        .options('/api/invoices/example')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'PUT')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
    },
  );

  it.each([undefined, 'http://localhost:5173'])(
    'keeps requests without Origin working with configuration %p', async configuration => {
      await createApp(configuration);

      const response = await request(app.getHttpServer())
        .get('/api/health').expect(200).expect({ status: 'ok' });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    },
  );
});
