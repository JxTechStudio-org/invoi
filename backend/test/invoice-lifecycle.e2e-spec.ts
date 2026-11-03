import { ExecutionContext, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Invoice, Prisma } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt.auth.guard';
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
  let reviewAmountThreshold: Prisma.Decimal | null;
  let errorLog: jest.SpyInstance;
  let extractionJob: { count: jest.Mock; updateMany: jest.Mock };
  let $queryRaw: jest.Mock;

  function notFound() {
    return new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '6' });
  }

  beforeEach(async () => {
    records = new Map([['test-invoice', invoiceFixture()]]);
    transactionError = null;
    reviewAmountThreshold = null;
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    findUnique = jest.fn(async ({ where, select, include }) => {
      const invoice = records.get(where.id);
      if (!invoice) return null;
      if (select) return Object.fromEntries(Object.keys(select).map(key => [key, invoice[key as keyof Invoice]]));
      return include?.user
        ? { ...invoice, user: { businessName: 'Demo Business', reviewAmountThreshold } }
        : invoice;
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
    extractionJob = { count: jest.fn().mockResolvedValue(0), updateMany: jest.fn().mockResolvedValue({ count: 0 }) };
    $queryRaw = jest.fn().mockResolvedValue([]);
    const prisma = {
      invoice,
      extractionJob,
      $transaction: async (action: (tx: unknown) => Promise<unknown>) => {
        const snapshot = new Map(records);
        try {
          const result = await action({ invoice, extractionJob, $queryRaw });
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
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'test-owner' };
          return true;
        },
      })
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
      totalAmount: '9999999999.99', taxAmount: '0.01', amountPaid: '500.25', currency: 'USD',
      paymentStatus: 'partially_paid', paymentMethod: 'mixed',
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
    expect(saved.amountPaid?.toFixed(2)).toBe('500.25');
    expect(saved.createdAt).toEqual(invoiceFixture().createdAt);
    expect(saved.fileUrl).toBe('/uploads/test-invoice.pdf');
    expect(saved.crNumber).toBe('000222');
  });

  it('allows numeric monetary inputs within the database precision', async () => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: 123.45, taxAmount: 12.34, amountPaid: 0 }).expect(200);
    expect(records.get('test-invoice')!.totalAmount?.toFixed(2)).toBe('123.45');
    expect(records.get('test-invoice')!.amountPaid?.toFixed(2)).toBe('0.00');
  });

  it('supports explicit nulls and preserves omitted fields', async () => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({
        vendorName: null, invoiceDate: null, dueDate: null,
        totalAmount: null, taxAmount: null, amountPaid: null,
        currency: null, paymentStatus: null, paymentMethod: null,
      })
      .expect(200);
    expect(records.get('test-invoice')).toMatchObject({
      vendorName: null, invoiceDate: null, dueDate: null,
      totalAmount: null, taxAmount: null, amountPaid: null,
      currency: null, paymentStatus: null, paymentMethod: null,
      customerName: 'Demo Business', invoiceNumber: 'INV-001',
    });
  });

  it('returns 404 when updating an unknown invoice', async () => {
    await request(app.getHttpServer()).put('/api/invoices/unknown').send({ vendorName: 'Vendor' }).expect(404);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(['id', 'userId', 'fileUrl', 'createdAt', 'updatedAt', 'status', 'extractionConfidence', 'needsReviewReason', 'reviewAmountThreshold', 'user', 'passwordHash'])(
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
    { amountPaid: '-0.01' }, { amountPaid: '1.001' }, { amountPaid: '10000000000' },
    { paymentStatus: 'invalid' }, { paymentMethod: 'Bank Transfer' }, { currency: 'XYZ' }, { currency: 'eur' },
  ])('rejects invalid updates %p', async body => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice').send(body).expect(400);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(['paid', 'unpaid', 'partially_paid', 'overdue'])('accepts payment status %s', async paymentStatus => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ paymentStatus }).expect(200);
    expect(records.get('test-invoice')?.paymentStatus).toBe(paymentStatus);
  });

  it.each(['bank_transfer', 'credit_card', 'cash', 'cheque', 'online_payment', 'mixed'])(
    'accepts payment method %s', async paymentMethod => {
      await request(app.getHttpServer()).put('/api/invoices/test-invoice')
        .send({ paymentMethod }).expect(200);
      expect(records.get('test-invoice')?.paymentMethod).toBe(paymentMethod);
    },
  );

  it.each(['SAR', 'USD', 'AED', 'EUR', 'KWD', 'INR'])('accepts currency %s', async currency => {
    await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ currency }).expect(200);
    expect(records.get('test-invoice')?.currency).toBe(currency);
  });

  it('drops the scores of corrected fields so their low_confidence clears, and reapplies review rules', async () => {
    records.set('test-invoice', invoiceFixture({
      status: 'needs_review', extractionConfidence: { totalAmount: 0.75, vendorName: 0.5 },
      totalAmount: null, taxAmount: null, needsReviewReason: 'low_confidence',
    }));
    const corrected = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '100.00', customerName: 'Other Business' }).expect(200);
    expect(corrected.body).toMatchObject({
      status: 'needs_review', extractionConfidence: { vendorName: 0.5 },
      needsReviewReason: 'low_confidence,customer_name_mismatch',
      editedFields: ['customerName', 'totalAmount'],
    });

    const allCorrected = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: 'Checked Vendor', customerName: 'Demo Business' }).expect(200);
    expect(allCorrected.body).toMatchObject({
      status: 'needs_review', extractionConfidence: {}, needsReviewReason: null,
      editedFields: ['customerName', 'totalAmount', 'vendorName'],
    });
  });

  it('records only fields whose value really changed', async () => {
    records.set('test-invoice', invoiceFixture({ editedFields: ['crNumber'], extractionConfidence: { totalAmount: 0.6 } }));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: 'Example Vendor', totalAmount: '100.00', invoiceDate: '2026-09-12', taxNumber: '999' }).expect(200);
    expect(response.body.editedFields).toEqual(['crNumber', 'taxNumber']);
    expect(response.body.extractionConfidence).toEqual({ totalAmount: 0.6 });
  });

  it.each([
    ['PUT', ''],
    ['POST', '/approve'],
    ['POST', '/flag'],
  ])('returns 409 for %s %s while the invoice is being extracted (D15)', async (method, action) => {
    records.set('test-invoice', invoiceFixture({ status: 'processing' }));
    extractionJob.count.mockResolvedValue(1);
    const path = `/api/invoices/test-invoice${action}`;
    const server = request(app.getHttpServer());
    await (method === 'PUT' ? server.put(path).send({ vendorName: 'Vendor' }) : server.post(path)).expect(409);
    expect(update).not.toHaveBeenCalled();
    expect(extractionJob.count).toHaveBeenCalledWith({ where: { invoiceId: 'test-invoice', state: 'running' } });
  });

  it('does not check for running jobs once the invoice has left processing', async () => {
    extractionJob.count.mockResolvedValue(1);
    await request(app.getHttpServer()).put('/api/invoices/test-invoice').send({ vendorName: 'Vendor' }).expect(200);
    expect(extractionJob.count).not.toHaveBeenCalled();
  });

  it('keeps the queued job when an edit leaves the invoice processing', async () => {
    records.set('test-invoice', invoiceFixture({ status: 'processing' }));
    await request(app.getHttpServer()).put('/api/invoices/test-invoice').send({ vendorName: 'Updated' }).expect(200);
    expect(extractionJob.updateMany).not.toHaveBeenCalled();
  });

  it.each(['approve', 'flag'])('cancels queued jobs when a person %ss a processing invoice', async action => {
    records.set('test-invoice', invoiceFixture({ status: 'processing' }));
    await request(app.getHttpServer()).post(`/api/invoices/test-invoice/${action}`).expect(200);
    expect(extractionJob.updateMany).toHaveBeenCalledWith({
      where: { invoiceId: 'test-invoice', state: 'queued' },
      data: { state: 'failed', lastError: expect.stringContaining('Cancelled') },
    });
    expect($queryRaw).toHaveBeenCalled();
  });

  it('does not mark processing invoices completed after a correction', async () => {
    records.set('test-invoice', invoiceFixture({ status: 'processing' }));
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ vendorName: 'Updated' }).expect(200);
    expect(response.body.status).toBe('processing');
  });

  it('does not flag positive monetary values based on an inferred accounting threshold', async () => {
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '1150.00', taxAmount: '150.00' }).expect(200);
    expect(response.body).toMatchObject({ status: 'completed', needsReviewReason: null });
  });

  it('applies the owning user amount threshold with Decimal precision', async () => {
    reviewAmountThreshold = new Prisma.Decimal('100.00');
    const equal = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '100.00', taxAmount: '13.04' }).expect(200);
    expect(equal.body.needsReviewReason).toBeNull();

    const above = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '100.01' }).expect(200);
    expect(above.body).toMatchObject({
      status: 'needs_review', needsReviewReason: 'amount_threshold_exceeded',
    });
  });

  it('accepts zero amounts but sends a zero total to review (B8)', async () => {
    const response = await request(app.getHttpServer()).put('/api/invoices/test-invoice')
      .send({ totalAmount: '0', taxAmount: '0' }).expect(200);
    expect(response.body).toMatchObject({ status: 'needs_review', needsReviewReason: 'zero_total' });
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
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'test-invoice', userId: 'test-owner' }, select: { id: true, status: true } });
  });

  it('returns 404 for unknown status requests', async () => {
    await request(app.getHttpServer()).get('/api/invoices/unknown/status').expect(404);
  });

  it('exports the static route with the exact reporting columns, mapping, and UTF-8 BOM', async () => {
    const response = await request(app.getHttpServer()).get('/api/invoices/export').expect(200);
    expect(response.headers['content-type']).toMatch(/^text\/csv; charset=utf-8/i);
    expect(response.headers['content-disposition']).toBe('attachment; filename="invoices.csv"');
    expect(response.text).toBe(`\uFEFF${csvHeader}\r\ntest-invoice,INV-001,Example Vendor,001234567890123,0012345678,Demo Business,2026-09-12,2026-10-12,100.00,15.00,SAR,unpaid,bank_transfer\r\n`);
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
