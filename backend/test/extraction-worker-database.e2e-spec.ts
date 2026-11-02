import { Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { ExtractionConfig } from '../src/extraction/extraction.config';
import { ExtractionJobsService, RETRY_DELAYS_MS } from '../src/extraction/extraction-jobs.service';
import { ExtractionWorkerService } from '../src/extraction/extraction-worker.service';
import { ExtractionError, ExtractionResult, InvoiceExtractor } from '../src/extraction/invoice-extractor';
import { MetricsService } from '../src/metrics/metrics.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

const cleanResult: ExtractionResult = {
  fields: {
    vendorName: 'Example Trading Co', invoiceNumber: 'INV-1', invoiceDate: new Date('2026-09-14T00:00:00Z'),
    totalAmount: new Prisma.Decimal('1150.00'), taxAmount: new Prisma.Decimal('150.00'), currency: 'SAR',
    customerName: 'Owner Co', taxNumber: '300000000000003',
  },
  confidence: { vendorName: 1, totalAmount: 1, taxAmount: 1, invoiceDate: 1 },
  model: 'test-model',
  costUsd: 0.01,
};

describeDatabase('Extraction worker (PostgreSQL)', () => {
  const schemaName = `extraction_worker_test_${randomUUID().replaceAll('-', '')}`;
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;
  let extract: jest.Mock;
  let download: jest.Mock;

  function worker(config: Partial<ExtractionConfig> = {}): ExtractionWorkerService {
    const storage = { download } as unknown as StorageService;
    const extractor: InvoiceExtractor = { extract };
    return new ExtractionWorkerService(
      { enabled: true, accountAllowlist: [], monthlyBudgetUsd: 2, model: 'claude-sonnet-5-5', ...config },
      new ExtractionJobsService(prisma as PrismaService), storage, new MetricsService(), extractor,
    );
  }

  async function run(config: Partial<ExtractionConfig> = {}): Promise<void> {
    const instance = worker(config);
    await instance.tick();
    await instance.idle();
  }

  async function addInvoice(id: string, userId = 'owner', data: Partial<Prisma.InvoiceUncheckedCreateInput> = {}) {
    await prisma.invoice.create({
      data: { id, userId, fileUrl: `s3://invoices/invoices/${id}.pdf`, extractionJobs: { create: { id: `job-${id}` } }, ...data },
    });
  }

  const job = (id: string) => prisma.extractionJob.findUniqueOrThrow({ where: { id: `job-${id}` } });
  const invoice = (id: string) => prisma.invoice.findUniqueOrThrow({ where: { id } });

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-extraction-worker-'));
    cpSync(resolve(__dirname, '../prisma'), temporaryDirectory, { recursive: true });
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy',
      '--schema', join(temporaryDirectory, 'schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 30000 });
  }, 60000);

  beforeEach(async () => {
    await prisma.extractionJob.deleteMany();
    await prisma.analysisJob.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.createMany({
      data: ['owner', 'other', 'demo'].map(id => ({
        id, email: `${id}@example.test`, passwordHash: 'hash', businessName: 'Owner Co',
        firstName: 'Test', lastName: 'User', username: id, phone: '+966500000000', isDemo: id === 'demo',
      })),
    });
    extract = jest.fn(async () => cleanResult);
    download = jest.fn(async () => ({ stream: Readable.from([Buffer.from('%PDF-1.4')]), contentType: 'application/pdf' }));
  });

  afterAll(async () => {
    try {
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('stores a clean result and completes the invoice (X1)', async () => {
    await addInvoice('a');
    await run();

    expect(extract).toHaveBeenCalledWith({ invoiceId: 'a', content: Buffer.from('%PDF-1.4'), contentType: 'application/pdf' });
    expect(await job('a')).toMatchObject({ state: 'done', attempts: 1, lastError: null });
    expect((await job('a')).costUsd.toString()).toBe('0.01');
    const stored = await invoice('a');
    expect(stored).toMatchObject({
      status: 'completed', needsReviewReason: null, vendorName: 'Example Trading Co', currency: 'SAR',
      extractionModel: 'test-model', extractionConfidence: cleanResult.confidence,
    });
    expect(stored.totalAmount?.toString()).toBe('1150');
    expect(stored.extractedAt).toBeInstanceOf(Date);
    expect(stored.extractionDurationMs).toEqual(expect.any(Number));
  });

  it('sends the invoice to review when a rule fires', async () => {
    extract.mockResolvedValue({ ...cleanResult, confidence: { ...cleanResult.confidence, totalAmount: 0.6 } });
    await addInvoice('a');
    await run();
    expect(await invoice('a')).toMatchObject({ status: 'needs_review', needsReviewReason: 'low_confidence' });
  });

  it('adds review reasons only extraction knows, keeping sticky ones (F24)', async () => {
    extract.mockResolvedValue({ ...cleanResult, reviewReasons: ['multiple_invoices'] });
    await addInvoice('a', 'owner', { needsReviewReason: 'user_flagged' });
    await run();
    expect(await invoice('a')).toMatchObject({
      status: 'needs_review', needsReviewReason: 'user_flagged,multiple_invoices',
    });
  });

  it('never overwrites fields the user edited (C12)', async () => {
    await addInvoice('a', 'owner', { vendorName: 'Typed by user', editedFields: ['vendorName'] });
    await run();
    const stored = await invoice('a');
    expect(stored.vendorName).toBe('Typed by user');
    expect(stored.invoiceNumber).toBe('INV-1');
    expect(stored.extractionConfidence).not.toHaveProperty('vendorName');
  });

  it('leaves an invoice alone when a person already took it out of processing', async () => {
    await addInvoice('a', 'owner', { status: 'completed', vendorName: 'Approved by user' });
    await run();
    expect(await job('a')).toMatchObject({ state: 'done' });
    expect(await invoice('a')).toMatchObject({ status: 'completed', vendorName: 'Approved by user', extractedAt: null });
  });

  it('retries a failed attempt after a delay and does not run it again early', async () => {
    extract.mockRejectedValue(new ExtractionError('model timeout', { costUsd: 0.002 }));
    await addInvoice('a');
    const before = Date.now();
    await run();

    const retried = await job('a');
    expect(retried).toMatchObject({ state: 'queued', attempts: 1, lastError: 'model timeout' });
    expect(retried.costUsd.toString()).toBe('0.002');
    expect(retried.runAfter.getTime()).toBeGreaterThanOrEqual(before + RETRY_DELAYS_MS[0] - 1000);
    expect(await invoice('a')).toMatchObject({ status: 'processing' });

    await run();
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('fails after the last retry and flags extraction_failed (C11)', async () => {
    extract.mockRejectedValue(new Error('unreadable'));
    await addInvoice('a', 'owner', { needsReviewReason: 'user_flagged' });
    await prisma.extractionJob.update({ where: { id: 'job-a' }, data: { attempts: 3 } });
    await run();

    expect(await job('a')).toMatchObject({ state: 'failed', attempts: 4, lastError: 'unreadable' });
    expect(await invoice('a')).toMatchObject({
      status: 'needs_review', needsReviewReason: 'user_flagged,extraction_failed',
    });
  });

  it('fails at once on a permanent error, such as a missing file', async () => {
    download.mockResolvedValue(null);
    await addInvoice('a');
    await run();
    expect(await job('a')).toMatchObject({ state: 'failed', attempts: 1, lastError: 'Invoice file not found' });
    expect(extract).not.toHaveBeenCalled();
    expect(await invoice('a')).toMatchObject({ status: 'needs_review', needsReviewReason: 'extraction_failed' });
  });

  it('never claims the demo account and respects the allow-list (H9, G25)', async () => {
    await addInvoice('demo-invoice', 'demo');
    await addInvoice('other-invoice', 'other');
    await addInvoice('owner-invoice', 'owner');
    await run({ accountAllowlist: ['owner'] });

    expect(await job('owner-invoice')).toMatchObject({ state: 'done' });
    expect(await job('other-invoice')).toMatchObject({ state: 'queued', attempts: 0 });
    expect(await job('demo-invoice')).toMatchObject({ state: 'queued', attempts: 0 });

    await run();
    expect(await job('other-invoice')).toMatchObject({ state: 'done' });
    expect(await job('demo-invoice')).toMatchObject({ state: 'queued', attempts: 0 });
  });

  it('stops at the monthly budget, counting analytics spend too (A4, H2)', async () => {
    await prisma.analysisJob.create({ data: { userId: 'owner', type: 'dpo_aging', costUsd: 1.995 } });
    await addInvoice('a');
    await addInvoice('b');
    await prisma.extractionJob.update({ where: { id: 'job-b' }, data: { runAfter: new Date(Date.now() + 1000) } });
    await run();
    expect(await job('a')).toMatchObject({ state: 'done' });

    // 1.995 + 0.01 is over the USD 2 cap: the next job waits.
    await prisma.extractionJob.update({ where: { id: 'job-b' }, data: { runAfter: new Date(0) } });
    await run();
    expect(await job('b')).toMatchObject({ state: 'queued', attempts: 0 });
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('runs at most two jobs at a time', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolveGate => { release = resolveGate; });
    extract.mockImplementation(async () => { await gate; return cleanResult; });
    for (const id of ['a', 'b', 'c']) await addInvoice(id);

    const instance = worker();
    await instance.tick();
    expect(await prisma.extractionJob.count({ where: { state: 'running' } })).toBe(2);
    expect(await prisma.extractionJob.count({ where: { state: 'queued' } })).toBe(1);
    release();
    await instance.idle();
    expect(extract).toHaveBeenCalledTimes(2);
    expect(await prisma.extractionJob.count({ where: { state: 'queued' } })).toBe(1);
  });

  it('recovers jobs left running by a stopped worker, and fails orphaned jobs', async () => {
    await addInvoice('a');
    await prisma.$executeRaw`
      UPDATE "ExtractionJob" SET "state" = 'running', "attempts" = 1,
        "updatedAt" = (now() AT TIME ZONE 'UTC') - interval '20 minutes'
      WHERE "id" = 'job-a'`;
    await addInvoice('gone');
    await prisma.invoice.delete({ where: { id: 'gone' } });
    await run();

    expect(await job('a')).toMatchObject({ state: 'queued', attempts: 1, lastError: 'Worker stopped while the job was running' });
    expect(await job('gone')).toMatchObject({ state: 'failed', invoiceId: null });
  });
});
