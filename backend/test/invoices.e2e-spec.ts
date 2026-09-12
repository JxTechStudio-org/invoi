import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InvoiceStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
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

  beforeEach(async () => {
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
      },
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(STORAGE_SERVICE)
      .useValue({ upload, remove })
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

  it('uploads for an existing user and returns the created invoice id without authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .field('userId', 'second-test-owner')
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
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .field('userId', 'unknown-user')
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
    { userId: undefined }, { userId: '' }, { userId: ' \t ' },
    { userId: ['test-owner', 'second-test-owner'] },
  ])(
    'rejects missing or invalid userId $userId before lookup or storage', async ({ userId }) => {
      const uploadRequest = request(app.getHttpServer()).post('/api/invoices/upload');
      if (userId !== undefined) uploadRequest.field('userId', userId);
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

  it('returns 404 for an unknown invoice id', async () => {
    await request(app.getHttpServer())
      .get('/api/invoices/unknown-invoice')
      .expect(404);
  });
});
