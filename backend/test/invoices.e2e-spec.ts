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
  sellerName: string | null;
  invoiceDate: Date | null;
  amount: string | null;
  createdAt: Date;
  updatedAt: Date;
};

describe('Invoices API (e2e)', () => {
  let app: INestApplication;
  let invoices: TestInvoice[];

  beforeEach(async () => {
    invoices = [
      {
        id: 'existing-invoice',
        fileUrl: '/uploads/existing.pdf',
        status: InvoiceStatus.processing,
        sellerName: 'Example Seller',
        invoiceDate: new Date('2026-09-08T00:00:00.000Z'),
        amount: '120.00',
        createdAt: new Date('2026-09-08T09:00:00.000Z'),
        updatedAt: new Date('2026-09-08T09:00:00.000Z'),
      },
    ];

    const prismaMock = {
      invoice: {
        create: jest.fn(({ data }) => {
          const now = new Date();
          const invoice: TestInvoice = {
            id: 'uploaded-invoice',
            fileUrl: data.fileUrl,
            status: data.status,
            sellerName: null,
            invoiceDate: null,
            amount: null,
            createdAt: now,
            updatedAt: now,
          };
          invoices.unshift(invoice);
          return Promise.resolve(invoice);
        }),
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
      .useValue({
        upload: jest.fn().mockResolvedValue({
          filePath: '/tmp/invoice.pdf',
          fileUrl: '/uploads/uploaded-invoice.pdf',
        }),
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

  it('uploads a supported invoice and returns its created id', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect({ invoice_id: 'uploaded-invoice' });
  });

  it('rejects an upload without a file', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
      .expect(400);
  });

  it('rejects an unsupported upload type', async () => {
    await request(app.getHttpServer())
      .post('/api/invoices/upload')
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
  });

  it('returns an invoice by id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/invoices/existing-invoice')
      .expect(200);

    expect(response.body).toMatchObject({
      id: 'existing-invoice',
      sellerName: 'Example Seller',
      invoiceDate: '2026-09-08T00:00:00.000Z',
      amount: '120.00',
      status: 'processing',
      fileUrl: '/uploads/existing.pdf',
    });
  });

  it('returns 404 for an unknown invoice id', async () => {
    await request(app.getHttpServer())
      .get('/api/invoices/unknown-invoice')
      .expect(404);
  });
});
