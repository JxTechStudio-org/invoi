import { ConflictException, HttpException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ExtractionAvailabilityService } from '../src/extraction/extraction-availability.service';
import { ExtractionJobsService } from '../src/extraction/extraction-jobs.service';
import { InvoicesService, MAX_REEXTRACTS } from '../src/invoices/invoices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Re-extract (PostgreSQL, C12)', () => {
  const schemaName = `invoice_reextract_test_${randomUUID().replaceAll('-', '')}`;
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;
  let invoices: InvoicesService;
  let jobs: ExtractionJobsService;
  let unavailableReason: jest.Mock;

  async function addInvoice(id: string, data: Partial<Prisma.InvoiceUncheckedCreateInput> = {}) {
    await prisma.invoice.create({
      data: {
        id, userId: 'owner', fileUrl: `s3://invoices/invoices/${id}.pdf`, status: 'needs_review',
        needsReviewReason: 'extraction_failed', ...data,
      },
    });
  }

  const jobsOf = (invoiceId: string) => prisma.extractionJob.findMany({ where: { invoiceId }, orderBy: { createdAt: 'asc' } });
  const invoice = (id: string) => prisma.invoice.findUniqueOrThrow({ where: { id } });

  async function expectRefusal(promise: Promise<unknown>, type: new (...args: never[]) => HttpException, code: string) {
    const error = await promise.then(() => null, (reason: unknown) => reason);
    expect(error).toBeInstanceOf(type);
    expect((error as HttpException).getResponse()).toMatchObject({ code });
  }

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-reextract-'));
    cpSync(resolve(__dirname, '../prisma'), temporaryDirectory, { recursive: true });
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy',
      '--schema', join(temporaryDirectory, 'schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 30000 });

    jobs = new ExtractionJobsService(prisma as PrismaService);
  }, 60000);

  beforeEach(async () => {
    await prisma.extractionJob.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.createMany({
      data: ['owner', 'other'].map(id => ({
        id, email: `${id}@example.test`, passwordHash: 'hash', businessName: 'Owner Co',
        firstName: 'Test', lastName: 'User', username: id, phone: '+966500000000',
      })),
    });
    unavailableReason = jest.fn().mockResolvedValue(null);
    invoices = new InvoicesService(
      prisma as PrismaService, {} as StorageService, { unavailableReason } as unknown as ExtractionAvailabilityService,
    );
  });

  afterAll(async () => {
    try {
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('queues a re-extract job and puts the invoice back in processing', async () => {
    await addInvoice('a');
    await expect(invoices.reExtract('a', 'owner')).resolves.toMatchObject({ id: 'a', status: 'processing' });
    expect(await jobsOf('a')).toEqual([expect.objectContaining({ state: 'queued', trigger: 'reextract', attempts: 0 })]);
    expect(unavailableReason).toHaveBeenCalledWith({ id: 'owner', isDemo: false });
  });

  it('keeps hand-edited fields when the new result is stored', async () => {
    await addInvoice('a', { vendorName: 'Typed by user', editedFields: ['vendorName'] });
    await invoices.reExtract('a', 'owner');
    const claimed = await jobs.claimNext([]);
    await jobs.complete(claimed!, {
      fields: {
        vendorName: 'Model guess', totalAmount: new Prisma.Decimal('115.00'), taxAmount: new Prisma.Decimal('15.00'),
        invoiceDate: new Date('2026-09-14T00:00:00Z'), customerName: 'Owner Co',
      },
      confidence: { vendorName: 1, totalAmount: 1, taxAmount: 1, invoiceDate: 1 },
      model: 'test-model', costUsd: 0.01,
    }, 100);

    expect(await invoice('a')).toMatchObject({
      vendorName: 'Typed by user', status: 'completed', needsReviewReason: null,
    });
    expect((await invoice('a')).totalAmount?.toFixed(2)).toBe('115.00');
  });

  it('allows a processing invoice whose job has finished', async () => {
    await addInvoice('a', { status: 'processing', extractionJobs: { create: { state: 'failed' } } });
    await expect(invoices.reExtract('a', 'owner')).resolves.toMatchObject({ status: 'processing' });
  });

  it('refuses approved invoices: the user has to flag them first', async () => {
    await addInvoice('a', { status: 'completed', needsReviewReason: null });
    await expectRefusal(invoices.reExtract('a', 'owner'), ConflictException, 'INVOICE_COMPLETED');
    expect(await jobsOf('a')).toHaveLength(0);
  });

  it.each(['queued', 'running'] as const)('refuses while a job is %s', async state => {
    await addInvoice('a', { status: 'processing', extractionJobs: { create: { state } } });
    await expectRefusal(invoices.reExtract('a', 'owner'), ConflictException, 'EXTRACTION_IN_PROGRESS');
    expect(await jobsOf('a')).toHaveLength(1);
  });

  it.each([
    ['disabled', 'EXTRACTION_DISABLED'],
    ['demo_account', 'EXTRACTION_DEMO_ACCOUNT'],
    ['not_allowed', 'EXTRACTION_NOT_ALLOWED'],
    ['budget_reached', 'EXTRACTION_BUDGET_REACHED'],
  ])('refuses with 503 when extraction is unavailable (%s) and leaves the invoice as it was', async (reason, code) => {
    unavailableReason.mockResolvedValue(reason);
    await addInvoice('a');
    await expectRefusal(invoices.reExtract('a', 'owner'), ServiceUnavailableException, code);
    expect(await invoice('a')).toMatchObject({ status: 'needs_review', needsReviewReason: 'extraction_failed' });
    expect(await jobsOf('a')).toHaveLength(0);
  });

  it(`stops after ${MAX_REEXTRACTS} re-extracts; upload and backfill jobs do not count`, async () => {
    await addInvoice('a', {
      extractionJobs: { create: [{ state: 'done', trigger: 'upload' }, { state: 'done', trigger: 'backfill' }] },
    });
    for (let round = 0; round < MAX_REEXTRACTS; round++) {
      await invoices.reExtract('a', 'owner');
      await prisma.extractionJob.updateMany({ where: { invoiceId: 'a', state: 'queued' }, data: { state: 'done' } });
      await prisma.invoice.update({ where: { id: 'a' }, data: { status: 'needs_review' } });
    }
    const refusal = invoices.reExtract('a', 'owner');
    await expectRefusal(refusal, HttpException, 'REEXTRACT_LIMIT_REACHED');
    await expect(refusal).rejects.toMatchObject({ status: 429 });
    expect((await invoice('a')).status).toBe('needs_review');
  });

  it('returns 404 for invoices of another account', async () => {
    await addInvoice('a', { userId: 'other' });
    await expect(invoices.reExtract('a', 'owner')).rejects.toBeInstanceOf(NotFoundException);
    expect(await jobsOf('a')).toHaveLength(0);
  });

  it('queues only one job when two requests arrive together', async () => {
    await addInvoice('a');
    const results = await Promise.allSettled([invoices.reExtract('a', 'owner'), invoices.reExtract('a', 'owner')]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictException);
    expect(await jobsOf('a')).toHaveLength(1);
  });
});
