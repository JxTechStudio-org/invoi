import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Invoice, Prisma } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { STORAGE_SERVICE } from '../src/storage/storage.service';
import { invoiceFixture } from './fixtures/invoice';

const csvHeader = 'Invoice ID,Invoice Number,Vendor Name,Vendor Tax Number,Vendor CR Number,Customer Name,Invoice Date,Due Date,Total Amount,Tax Amount,Currency,Payment Status,Payment Method';

describe('Invoice lifecycle API (e2e)', () => {
  let app: INestApplication;
  let records: Map<string, Invoice>;
  let findUnique: jest.Mock;
  let findMany: jest.Mock;
  let update: jest.Mock;
  let deleteInvoice: jest.Mock;
  let stageRemoval: jest.Mock;
  let finalize: jest.Mock;
  let restore: jest.Mock;
  let transactionError: Error | null;
  let errorLog: jest.SpyInstance;

  function notFound() {
    return new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '6' });
  }

  beforeEach(async () => {
    records = new Map([['test-invoice', invoiceFixture()]]);
    transactionError = null;
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    findUnique = jest.fn(async ({ where, select, include }) => {
      const invoice = records.get(where.id);
      if (!invoice) return null;
      if (select) return Object.fromEntries(Object.keys(select).map(key => [key, invoice[key as keyof Invoice]]));
      return include?.user ? { ...invoice, user: { businessName: 'Demo Business' } } : invoice;
    });
    findMany = jest.fn(async ({ where }) => [...records.values()].filter(invoice =>
      (!where.status || invoice.status === where.status)
      && (!where.invoiceDate || (invoice.invoiceDate
        && invoice.invoiceDate >= where.invoiceDate.gte && invoice.invoiceDate < where.invoiceDate.lt)),
    ));
    update = jest.fn(async ({ where, data }) => {
      const invoice = records.get(where.id);
      if (!invoice) throw notFound();
      const updated = { ...invoice, ...data, updatedAt: new Date() };
      records.set(where.id, updated);
      return updated;
    });
    deleteInvoice = jest.fn(async ({ where }) => {
      const invoice = records.get(where.id);
      if (!invoice) throw notFound();
      records.delete(where.id);
      return invoice;
    });
    finalize = jest.fn().mockResolvedValue(undefined);
    restore = jest.fn().mockResolvedValue(undefined);
    stageRemoval = jest.fn().mockResolvedValue({ finalize, restore });
    const invoice = { findUnique, findMany, update, delete: deleteInvoice };
    const prisma = {
      invoice,
      $transaction: async (action: (tx: { invoice: typeof invoice }) => Promise<unknown>) => {
        const snapshot = new Map(records);
        try {
          const result = await action({ invoice });
          if (transactionError) throw transactionError;
          return result;
        } catch (error) {
          records = snapshot;
          throw error;
        }
      },
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(STORAGE_SERVICE).useValue({ stageRemoval })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    errorLog.mockRestore();
  });

  it('updates every editable business field and preserves exact money and ownership', async () => {
    const body = {
      vendorName: 'Updated Vendor', invoiceNumber: 'INV-002',
      invoiceDate: '2026-09-13', dueDate: '2026-10-13T12:30:00+03:00',
      totalAmount: '9999999999.99', taxAmount: '0.01', currency: 'USD',
      paymentStatus: 'partially_paid', paymentMethod: 'card + bank transfer',
      customerName: ' DEMO, BUSINESS. ', taxNumber: '000111', crNumber: '000222',
    };
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice').send(body).expect(200);
    expect(response.body).toMatchObject({
      ...body, invoiceDate: '2026-09-13T00:00:00.000Z', dueDate: '2026-10-13T09:30:00.000Z',
      id: 'test-invoice', userId: 'test-owner', status: 'completed', needsReviewReason: null,
      sellerName: 'Updated Vendor', amount: '9999999999.99',
    });
    expect(response.body).not.toHaveProperty('user');
    expect(response.body).not.toHaveProperty('passwordHash');
    const saved = records.get('test-invoice')!;
    expect(saved.totalAmount?.toFixed(2)).toBe('9999999999.99');
    expect(saved.taxAmount?.toFixed(2)).toBe('0.01');
    expect(saved.createdAt).toEqual(invoiceFixture().createdAt);
    expect(saved.fileUrl).toBe('/uploads/test-invoice.pdf');
    expect(saved.crNumber).toBe('000222');
  });

  it('allows numeric monetary inputs within the database precision', async () => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: 123.45, taxAmount: 12.34 }).expect(200);
    expect(records.get('test-invoice')!.totalAmount?.toFixed(2)).toBe('123.45');
  });

  it('supports explicit nulls and preserves omitted fields', async () => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: null, invoiceDate: null, dueDate: null, totalAmount: null, taxAmount: null })
      .expect(200);
    expect(records.get('test-invoice')).toMatchObject({
      vendorName: null, invoiceDate: null, dueDate: null, totalAmount: null, taxAmount: null,
      customerName: 'Demo Business', invoiceNumber: 'INV-001',
    });
  });

  it('returns 404 when updating an unknown invoice', async () => {
    await request(app.getHttpServer()).put('/api/invoices/unknown').send({ vendorName: 'Vendor' }).expect(404);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(['id', 'userId', 'fileUrl', 'createdAt', 'updatedAt', 'status', 'extractionConfidence', 'needsReviewReason', 'user', 'passwordHash'])(
    'rejects protected field %s', async field => {
      await request(app.getHttpServer()).put('/api/invoices/test-invoice')
        .send({ vendorName: 'Vendor', [field]: 'not-allowed' }).expect(400);
      expect(update).not.toHaveBeenCalled();
    },
  );

  it.each([
    {}, { vendorName: 12 }, { customerName: [] }, { paymentStatus: {} },
    { invoiceDate: 'not-a-date' }, { invoiceDate: '2026-02-30' },
    { dueDate: '2026-09-12T12:00:00' }, { totalAmount: '1.001' },
    { totalAmount: '10000000000' }, { totalAmount: '1e3' },
    { totalAmount: 'NaN' }, { totalAmount: true }, { taxAmount: {} },
    { totalAmount: '-1' }, { totalAmount: -0.01 }, { taxAmount: '-0.01' }, { taxAmount: -10 },
  ])('rejects invalid updates %p', async body => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice').send(body).expect(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('preserves confidence after manual corrections and reapplies review rules', async () => {
    records.set('test-invoice', invoiceFixture({
      status: 'needs_review', extractionConfidence: { totalAmount: 0.75 },
      totalAmount: null, taxAmount: null, needsReviewReason: 'low_confidence',
    }));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '100.00', customerName: 'Other Business' }).expect(200);
    expect(response.body).toMatchObject({
      status: 'needs_review', extractionConfidence: { totalAmount: 0.75 },
      needsReviewReason: 'low_confidence,customer_name_mismatch',
    });
  });

  it('does not mark processing invoices completed after a correction', async () => {
    records.set('test-invoice', invoiceFixture({ status: 'processing' }));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: 'Updated' }).expect(200);
    expect(response.body.status).toBe('processing');
  });

  it('does not flag positive monetary values based on an inferred accounting threshold', async () => {
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '1.00', taxAmount: '9999.99' }).expect(200);
    expect(response.body).toMatchObject({ status: 'completed', needsReviewReason: null });
  });

  it('accepts zero amounts without inferring a review reason', async () => {
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '0', taxAmount: '0' }).expect(200);
    expect(response.body).toMatchObject({ status: 'completed', needsReviewReason: null });
  });

  it('clears resolved reasons without inventing extraction completion', async () => {
    records.set('test-invoice', invoiceFixture({
      status: 'needs_review', customerName: 'Other Business', needsReviewReason: 'customer_name_mismatch',
    }));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ customerName: 'Demo Business' }).expect(200);
    expect(response.body).toMatchObject({ status: 'needs_review', needsReviewReason: null });
  });

  it('returns 404 if an invoice disappears during update', async () => {
    update.mockRejectedValueOnce(notFound());
    await request(app.getHttpServer()).put('/api/invoices/test-invoice').send({ vendorName: 'Vendor' }).expect(404);
  });

  it('hides unexpected database error details', async () => {
    update.mockRejectedValueOnce(new Error('sensitive database details'));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: 'Vendor' }).expect(500);
    expect(JSON.stringify(response.body)).not.toContain('sensitive database details');
  });

  it('deletes the row, finalizes its file removal, and returns an empty 204', async () => {
    const response = await request(app.getHttpServer()).delete('/api/invoices/test-invoice').expect(204);
    expect(response.text).toBe('');
    expect(records.has('test-invoice')).toBe(false);
    expect(stageRemoval).toHaveBeenCalledWith('/uploads/test-invoice.pdf');
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(restore).not.toHaveBeenCalled();
    await request(app.getHttpServer()).get('/api/invoices/test-invoice').expect(404);
  });

  it('returns 404 for unknown deletes without touching storage', async () => {
    await request(app.getHttpServer()).delete('/api/invoices/unknown').expect(404);
    expect(stageRemoval).not.toHaveBeenCalled();
  });

  it('rolls the database deletion back if file staging fails', async () => {
    stageRemoval.mockRejectedValueOnce(new Error('Storage unavailable'));
    await request(app.getHttpServer()).delete('/api/invoices/test-invoice').expect(500);
    expect(records.has('test-invoice')).toBe(true);
    expect(finalize).not.toHaveBeenCalled();
  });

  it('restores the staged file if the database commit fails', async () => {
    transactionError = new Error('Commit failed');
    await request(app.getHttpServer()).delete('/api/invoices/test-invoice').expect(500);
    expect(records.has('test-invoice')).toBe(true);
    expect(restore).toHaveBeenCalledTimes(1);
    expect(finalize).not.toHaveBeenCalled();
  });

  it('reports final cleanup failures without recreating the committed deleted row', async () => {
    finalize.mockRejectedValueOnce(new Error('Cleanup failed'));
    const response = await request(app.getHttpServer()).delete('/api/invoices/test-invoice').expect(500);
    expect(response.body.message).toBe('Invoice deleted but file cleanup failed');
    expect(records.has('test-invoice')).toBe(false);
    expect(restore).not.toHaveBeenCalled();
  });

  it.each(['processing', 'completed', 'needs_review'] as const)('returns only the stored %s status', async status => {
    records.set('test-invoice', invoiceFixture({ status }));
    await request(app.getHttpServer()).get('/api/invoices/test-invoice/status')
      .expect(200).expect({ invoiceId: 'test-invoice', status });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'test-invoice' }, select: { id: true, status: true } });
  });

  it('returns 404 for unknown status requests', async () => {
    await request(app.getHttpServer()).get('/api/invoices/unknown/status').expect(404);
  });

  it('exports the static route with the exact reporting columns, mapping, and UTF-8 BOM', async () => {
    const response = await request(app.getHttpServer()).get('/api/invoices/export').expect(200);
    expect(response.headers['content-type']).toMatch(/^text\/csv; charset=utf-8/i);
    expect(response.headers['content-disposition']).toBe('attachment; filename="invoices.csv"');
    expect(response.text).toBe(`\uFEFF${csvHeader}\r\ntest-invoice,INV-001,Example Vendor,001234567890123,0012345678,Demo Business,2026-09-12,2026-10-12,100.00,15.00,SAR,unpaid,bank transfer\r\n`);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('escapes commas, quotes, line breaks, Arabic, and multiple rows', async () => {
    records.set('test-invoice', invoiceFixture({
      vendorName: 'شركة "المثال", LLC\nفرع الرياض', customerName: 'عميل عربي',
    }));
    records.set('second-invoice', invoiceFixture({ id: 'second-invoice', invoiceNumber: 'INV-002' }));
    const response = await request(app.getHttpServer()).get('/api/invoices/export').expect(200);
    expect(response.text).toContain('"شركة ""المثال"", LLC\nفرع الرياض"');
    expect(response.text).toContain('عميل عربي');
    expect(response.text).toContain('\r\nsecond-invoice,INV-002,');
  });

  it('exports null values as empty cells', async () => {
    records.set('test-invoice', invoiceFixture({
      invoiceNumber: null, vendorName: null, taxNumber: null, crNumber: null, customerName: null,
      invoiceDate: null, dueDate: null, totalAmount: null, taxAmount: null,
      currency: null, paymentStatus: null, paymentMethod: null,
    }));
    const response = await request(app.getHttpServer()).get('/api/invoices/export').expect(200);
    expect(response.text).toBe(`\uFEFF${csvHeader}\r\ntest-invoice${','.repeat(12)}\r\n`);
  });

  it('reuses list filters for CSV and returns headers for an empty result', async () => {
    records.set('other', invoiceFixture({ id: 'other', status: 'processing' }));
    const query = '?status=completed&date=2026-09-12';
    const list = await request(app.getHttpServer()).get(`/api/invoices${query}`).expect(200);
    const csv = await request(app.getHttpServer()).get(`/api/invoices/export${query}`).expect(200);
    expect(list.body).toHaveLength(1);
    expect(csv.text).toContain('\r\ntest-invoice,');
    expect(csv.text).not.toContain('\r\nother,');
    expect(findMany.mock.calls[0][0]).toEqual(findMany.mock.calls[1][0]);
    const empty = await request(app.getHttpServer()).get('/api/invoices/export?date=2026-09-13').expect(200);
    expect(empty.text).toBe(`\uFEFF${csvHeader}\r\n`);
  });

  it.each(['status=invalid', 'date=invalid', 'date=2026-02-30', 'userId=not-a-filter'])(
    'rejects invalid export query %s', async query => {
      await request(app.getHttpServer()).get(`/api/invoices/export?${query}`).expect(400);
    },
  );

  it('neutralizes spreadsheet formulas in text while preserving numeric amounts', async () => {
    records.set('test-invoice', invoiceFixture({ vendorName: '=1+1', totalAmount: new Prisma.Decimal(-10) }));
    const response = await request(app.getHttpServer()).get('/api/invoices/export').expect(200);
    expect(response.text).toContain(",INV-001,'=1+1,");
    expect(response.text).toContain(',-10.00,15.00,');
  });
});
