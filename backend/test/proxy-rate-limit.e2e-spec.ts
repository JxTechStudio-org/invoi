import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TRUST_PROXY_HOPS } from '../src/proxy.config';
import { STORAGE_SERVICE } from '../src/storage/storage.service';

describe('Login rate limit behind the reverse proxy', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: jest.fn().mockResolvedValue(null) } })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    (app as NestExpressApplication).set('trust proxy', TRUST_PROXY_HOPS);
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // Nginx appends the address it saw to whatever X-Forwarded-For the client sent.
  const login = (forwardedFor: string) => request(app.getHttpServer())
    .post('/api/auth/login')
    .set('X-Forwarded-For', forwardedFor)
    .send({ email: 'someone@example.com', password: 'Password@12' });

  it('cannot be bypassed by spoofing X-Forwarded-For entries', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await login(`10.0.0.${attempt}, 203.0.113.7`).expect(401);
    }
    await login('10.0.0.99, 203.0.113.7').expect(429);
  });

  it('keeps a separate limit for each real client address', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await login('203.0.113.7').expect(401);
    }
    await login('203.0.113.7').expect(429);
    await login('198.51.100.20').expect(401);
  });
});
