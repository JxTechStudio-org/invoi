import { ConflictException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CANCELLED_BY_USER_ERROR, ExtractionJobsService } from '../src/extraction/extraction-jobs.service';
import { InvoicesService } from '../src/invoices/invoices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Invoice locks while extracting (PostgreSQL, D15)', () => {
  const schemaName = `invoice_lock_test_${randomUUID().replaceAll('-', '')}`;
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;
  let invoices: InvoicesService;
  let jobs: ExtractionJobsService;

  async function addInvoice(
    id: string,
    state: 'queued' | 'running' | null,
    data: Partial<Prisma.InvoiceUncheckedCreateInput> = {},
  ) {
    await prisma.invoice.create({
      data: {
        id, userId: 'owner', fileUrl: `s3://invoices/invoices/${id}.pdf`,
        vendorName: 'Example Vendor', totalAmount: '115.00', taxAmount: '15.00',
        invoiceDate: new Date('2026-09-14T00:00:00Z'), customerName: 'Owner Co',
        ...(state && { extractionJobs: { create: { id: `job-${id}`, state } } }),
        ...data,
      },
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

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-invoice-lock-'));
    cpSync(resolve(__dirname, '../prisma'), temporaryDirectory, { recursive: true });
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy',
      '--schema', join(temporaryDirectory, 'schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 30000 });

    invoices = new InvoicesService(prisma as PrismaService, {} as StorageService);
    jobs = new ExtractionJobsService(prisma as PrismaService);
  }, 60000);

  beforeEach(async () => {
    await prisma.extractionJob.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        id: 'owner', email: 'owner@example.test', passwordHash: 'hash', businessName: 'Owner Co',
        firstName: 'Test', lastName: 'User', username: 'owner', phone: '+966500000000',
      },
    });
  });

  afterAll(async () => {
    try {
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it.each([
    ['edit', () => invoices.update('a', { vendorName: 'Typed' }, 'owner')],
    ['approve', () => invoices.approve('a', 'owner')],
    ['flag', () => invoices.flag('a', 'owner')],
  ])('refuses to %s a processing invoice whose job is running', async (_action, act) => {
    await addInvoice('a', 'running');
    await expect(act()).rejects.toBeInstanceOf(ConflictException);
    expect(await invoice('a')).toMatchObject({
      status: 'processing', vendorName: 'Example Vendor', editedFields: [], needsReviewReason: null,
    });
    expect((await job('a')).state).toBe('running');
  });

  it('allows changes while the job is only queued (extraction off, retry wait, budget used)', async () => {
    await addInvoice('a', 'queued');
    await invoices.update('a', { vendorName: 'Typed' }, 'owner');
    expect(await invoice('a')).toMatchObject({ status: 'processing', vendorName: 'Typed', editedFields: ['vendorName'] });
    expect((await job('a')).state).toBe('queued');
  });

  it.each([
    ['approve', 'completed', () => invoices.approve('a', 'owner')],
    ['flag', 'needs_review', () => invoices.flag('a', 'owner')],
    ['edit that fires a rule', 'needs_review', () => invoices.update('a', { customerName: 'Someone Else' }, 'owner')],
  ])('an %s cancels the queued job so the worker never claims it', async (_action, status, act) => {
    await addInvoice('a', 'queued');
    await act();
    expect((await invoice('a')).status).toBe(status);
    expect(await job('a')).toMatchObject({ state: 'failed', lastError: CANCELLED_BY_USER_ERROR, attempts: 0 });
    await expect(jobs.claimNext([])).resolves.toBeNull();
  });

  it('allows changes to an invoice that left processing even if a job is still running', async () => {
    await addInvoice('a', 'running', { status: 'needs_review' });
    await expect(invoices.approve('a', 'owner')).resolves.toMatchObject({ status: 'completed' });
    expect((await job('a')).state).toBe('running');
  });

  it('lets exactly one of approve and claim win when they race', async () => {
    const outcomes = { approved: 0, claimed: 0 };
    for (let round = 0; round < 25; round++) {
      const id = `race-${round}`;
      await addInvoice(id, 'queued');
      const [approval, claim] = await Promise.allSettled([invoices.approve(id, 'owner'), jobs.claimNext([])]);
      const stored = await invoice(id);
      const stateAfter = (await job(id)).state;

      if (approval.status === 'fulfilled') {
        outcomes.approved++;
        expect(claim).toEqual({ status: 'fulfilled', value: null });
        expect(stored.status).toBe('completed');
        expect(stateAfter).toBe('failed');
      } else {
        outcomes.claimed++;
        expect(approval.reason).toBeInstanceOf(ConflictException);
        expect(claim).toMatchObject({ status: 'fulfilled', value: { invoiceId: id, attempts: 1 } });
        expect(stored.status).toBe('processing');
        expect(stateAfter).toBe('running');
        // Free the claimed job so later rounds only see their own.
        await prisma.extractionJob.update({ where: { id: `job-${id}` }, data: { state: 'done' } });
      }
    }
    expect(outcomes.approved + outcomes.claimed).toBe(25);
  }, 60000);
});
