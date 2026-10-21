import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InvoiceStatus } from '@prisma/client';
import { Readable } from 'node:stream';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt.auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { STORAGE_SERVICE } from '../src/storage/storage.service';

type TestInvoice = {
  id: string;
  fileUrl: string;
  status: InvoiceStatus;
  vendorName: string | null;
  invoiceDate: Date | null;
  totalAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

describe('Invoices API (e2e)', () => {
  let app: INestApplication;
  let invoices: TestInvoice[];
  let upload: jest.Mock;
  let createInvoice: jest.Mock;
  let findUser: jest.Mock;
  let remove: jest.Mock;
  let download: jest.Mock;
  let authUserId: string;

  beforeEach(async () => {
    authUserId = 'test-owner';
    invoices = [
      {
        id: 'existing-invoice',
        fileUrl: '/uploads/existing.pdf',
        status: InvoiceStatus.processing,
        vendorName: 'Example Seller',
        invoiceDate: new Date('2026-09-08T00:00:00.000Z'),
        totalAmount: '120.00',
        createdAt: new Date('2026-09-08T09:00:00.000Z'),
        updatedAt: new Date('2026-09-08T09:00:00.000Z'),
        userId: 'test-owner',
      },
    ];

    createInvoice = jest.fn(({ data }) => {
      const now = new Date();
      const invoice: TestInvoice = {
        id: `uploaded-invoice-${invoices.length}`,
        fileUrl: data.fileUrl,
        status: data.status,
        vendorName: null,
        invoiceDate: null,
        totalAmount: null,
        createdAt: now,
        updatedAt: now,
        userId: data.user.connect.id,
      };
      invoices.unshift(invoice);
      return Promise.resolve(invoice);
    });
    findUser = jest.fn(({ where }) => Promise.resolve(
      ['test-owner', 'second-test-owner'].includes(where.id) ? { id: where.id } : null,
    ));
    remove = jest.fn().mockResolvedValue(undefined);
    download = jest.fn(() => Promise.resolve({
      stream: Readable.from([Buffer.from('%PDF-1.4')]), contentType: 'application/pdf', contentLength: 8,
    }));
    upload = jest.fn().mockResolvedValue({
      filePath: '/tmp/invoice.pdf',
      fileUrl: '/uploads/uploaded-invoice.pdf',
    });
    const prismaMock = {
      user: { findUnique: findUser },
      invoice: {
        create: createInvoice,
        findMany: jest.fn(({ where }) =>
          Promise.resolve(
            invoices.filter((invoice) => {
              if (where.status && invoice.status !== where.status) return false;
              if (where.invoiceDate) {
                const { gte, lt } = where.invoiceDate;
                if (!invoice.invoiceDate) return false;
                if (gte && invoice.invoiceDate < gte) return false;
                if (lt && invoice.invoiceDate >= lt) return false;
              }
              return true;
            }),
          ),
        ),
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(invoices.find((invoice) => invoice.id === where.id) ?? null),
        ),
        update: jest.fn(({ where, data }) => {
          const invoice = invoices.find((candidate) => candidate.id === where.id)!;
          Object.assign(invoice, data);
          return Promise.resolve(invoice);
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(STORAGE_SERVICE)
      .useValue({ upload, remove, download })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { userId: authUserId, email: 'owner@example.test' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports API health', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('uploads for the authenticated user and returns the created invoice id', async () => {
    authUserId = 'second-test-owner';
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect({ invoice_id: 'uploaded-invoice-1' });

    expect(findUser).toHaveBeenCalledWith({
      where: { id: 'second-test-owner' }, select: { id: true },
    });
    expect(invoices[0].userId).toBe('second-test-owner');
    expect(findUser.mock.invocationCallOrder[0]).toBeLessThan(upload.mock.invocationCallOrder[0]);
    expect(upload.mock.invocationCallOrder[0]).toBeLessThan(createInvoice.mock.invocationCallOrder[0]);
    expect(remove).not.toHaveBeenCalled();
    const response = await request(app.getHttpServer())
      .get('/api/invoices/uploaded-invoice-1').expect(200);
    expect(response.body.userId).toBe('second-test-owner');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('rejects an upload without a file', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .field('userId', 'test-owner')
      .expect(400);
  });

  it('rejects an unknown user before storage or invoice creation', async () => {
    authUserId = 'unknown-user';
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(404);
    expect(findUser).toHaveBeenCalledTimes(1);
    expect(upload).not.toHaveBeenCalled();
    expect(createInvoice).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it.each([
    { userId: '' }, { userId: ' \t ' },
    { userId: ['test-owner', 'second-test-owner'] },
  ])(
    'rejects invalid userId $userId before lookup or storage', async ({ userId }) => {
      const uploadRequest = request(app.getHttpServer()).post('/api/invoices/upload');
      uploadRequest.field('userId', userId);
      await uploadRequest.attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'invoice.pdf', contentType: 'application/pdf',
      }).expect(400);
      expect(findUser).not.toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
      expect(createInvoice).not.toHaveBeenCalled();
    },
  );

  it('rejects password fields instead of accepting user credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .field('userId', 'test-owner')
      .field('password', 'rejected-test-input')
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'invoice.pdf', contentType: 'application/pdf',
      }).expect(400);
    expect(findUser).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it('allows one existing user to upload multiple invoices', async () => {
    const invoiceIds: string[] = [];
    for (let index = 0; index < 2; index++) {
      const response = await request(app.getHttpServer())
        .post('/api/invoices/upload')
        .field('userId', 'test-owner')
        .attach('file', Buffer.from('%PDF-1.4'), {
          filename: 'invoice.pdf', contentType: 'application/pdf',
        }).expect(201);
      invoiceIds.push(response.body.invoice_id);
    }
    expect(new Set(invoiceIds).size).toBe(2);
    expect(createInvoice).toHaveBeenCalledTimes(2);
    for (const id of invoiceIds) {
      expect(invoices.find((invoice) => invoice.id === id)?.userId).toBe('test-owner');
    }
  });

  it('rejects an unsupported upload type', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .field('userId', 'test-owner')
      .attach('file', Buffer.from('not an invoice'), {
        filename: 'invoice.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('returns invoices and forwards the status filter to persistence', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/invoices?status=processing')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: 'existing-invoice' });
    expect(response.body[0]).not.toHaveProperty('user');
    expect(response.body[0]).not.toHaveProperty('passwordHash');
  });

  it('returns an invoice by id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/invoices/existing-invoice')
      .expect(200);

    expect(response.body).toMatchObject({
      id: 'existing-invoice',
      sellerName: 'Example Seller',
      vendorName: 'Example Seller',
      invoiceDate: '2026-09-08T00:00:00.000Z',
      amount: '120.00',
      totalAmount: '120.00',
      userId: 'test-owner',
      status: 'processing',
      fileUrl: '/uploads/existing.pdf',
    });
    expect(response.body).not.toHaveProperty('user');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it.each(['completed', 'needs_review'] as const)('accepts the %s lifecycle filter', async (status) => {
    invoices[0].status = status;
    const response = await request(app.getHttpServer())
      .get(`/api/invoices?status=${status}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe(status);
  });

  it('preserves invoice date filtering', async () => {
    const matching = await request(app.getHttpServer())
      .get('/api/invoices?date=2026-09-08').expect(200);
    expect(matching.body).toHaveLength(1);
    await request(app.getHttpServer())
      .get('/api/invoices?date=2026-09-09').expect(200).expect([]);
  });

  it('approves an invoice with 200 and marks it completed', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/invoices/existing-invoice/approve')
      .expect(200);
    expect(response.body).toMatchObject({ id: 'existing-invoice', status: 'completed', needsReviewReason: null });
  });

  it('refuses to approve an invoice missing required data', async () => {
    invoices[0].vendorName = null;
    const response = await request(app.getHttpServer())
      .post('/api/invoices/existing-invoice/approve')
      .expect(400);
    expect(response.body.message).toContain('vendorName');
    expect(invoices[0].status).toBe(InvoiceStatus.processing);
  });

  it('flags an invoice for review with 200', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/invoices/existing-invoice/flag')
      .expect(200);
    expect(response.body).toMatchObject({ status: 'needs_review', needsReviewReason: 'user_flagged' });
  });

  it.each(['approve', 'flag'])('returns 404 when trying to %s an unknown invoice', async (action) => {
    await request(app.getHttpServer())
      .post(`/api/invoices/missing-invoice/${action}`)
      .expect(404);
  });

  it('streams the invoice file inline with safe headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/invoices/existing-invoice/file')
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(download).toHaveBeenCalledWith('/uploads/existing.pdf');
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toBe('inline');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect((response.body as Buffer).toString()).toBe('%PDF-1.4');
  });

  it('returns 404 for the file of an unknown invoice', async () => {
    await request(app.getHttpServer()).get('/api/invoices/missing-invoice/file').expect(404);
    expect(download).not.toHaveBeenCalled();
  });

  it('returns 404 when the stored file is missing', async () => {
    download.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/api/invoices/existing-invoice/file').expect(404);
  });

  it('returns 404 for an unknown invoice id', async () => {
    await request(app.getHttpServer())
      .get('/api/invoices/unknown-invoice')
      .expect(404);
  });
});
