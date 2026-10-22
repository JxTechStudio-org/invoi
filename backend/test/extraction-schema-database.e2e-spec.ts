import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const EXTRACTION_MIGRATION = '20261022120000_extraction_schema';

describeDatabase('Extraction schema migration (PostgreSQL)', () => {
  const schemaName = `extraction_schema_test_${randomUUID().replaceAll('-', '')}`;
  const prismaDirectory = resolve(__dirname, '../prisma');
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;

  function deploy(schemaPath: string, url: string) {
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', schemaPath,
    ], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe', timeout: 30000 });
  }

  function copyMigration(entry: string) {
    cpSync(join(prismaDirectory, 'migrations', entry),
      join(temporaryDirectory, 'migrations', entry), { recursive: true });
  }

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-extraction-schema-migrations-'));
    cpSync(join(prismaDirectory, 'schema.prisma'), join(temporaryDirectory, 'schema.prisma'));
    mkdirSync(join(temporaryDirectory, 'migrations'));
    for (const entry of readdirSync(join(prismaDirectory, 'migrations'))) {
      if (entry !== EXTRACTION_MIGRATION) copyMigration(entry);
    }
    deploy(join(temporaryDirectory, 'schema.prisma'), url.toString());

    // Production-like data before the migration: a demo account with seed:// invoices
    // and a real account whose paid invoice must stay untouched.
    await prisma.$executeRaw`
      INSERT INTO "User" ("id", "email", "passwordHash", "businessName", "firstName", "lastName", "username", "phone")
      VALUES
        ('demo-user', 'demo@example.test', 'hash', 'Demo Co', 'Demo', 'User', 'demo', '+966500000001'),
        ('real-user', 'real@example.test', 'hash', 'Real Co', 'Real', 'User', 'real', '+966500000002')
    `;
    await prisma.$executeRaw`
      INSERT INTO "Invoice" ("id", "userId", "fileUrl", "status", "paymentStatus", "currency", "updatedAt")
      VALUES
        ('demo-paid', 'demo-user', 'seed://invoices/demo-1.pdf', 'completed', 'paid', 'SAR', '2026-09-10T08:00:00.000Z'),
        ('demo-unpaid', 'demo-user', 'seed://invoices/demo-2.pdf', 'completed', 'unpaid', 'SAR', '2026-09-11T08:00:00.000Z'),
        ('real-paid', 'real-user', 's3://invoices/invoices/real.pdf', 'completed', 'paid', 'SAR', '2026-09-12T08:00:00.000Z')
    `;

    copyMigration(EXTRACTION_MIGRATION);
    deploy(join(temporaryDirectory, 'schema.prisma'), url.toString());
  }, 90000);

  afterAll(async () => {
    try {
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('marks only the account with seed:// invoices as the demo account', async () => {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' }, select: { id: true, isDemo: true, businessNameEn: true },
    });
    expect(users).toEqual([
      { id: 'demo-user', isDemo: true, businessNameEn: null },
      { id: 'real-user', isDemo: false, businessNameEn: null },
    ]);
  });

  it('copies paidAt from updatedAt only for paid demo invoices, without touching updatedAt', async () => {
    const invoices = await prisma.invoice.findMany({
      orderBy: { id: 'asc' }, select: { id: true, paidAt: true, updatedAt: true, editedFields: true },
    });
    expect(invoices).toEqual([
      { id: 'demo-paid', paidAt: new Date('2026-09-10T08:00:00.000Z'),
        updatedAt: new Date('2026-09-10T08:00:00.000Z'), editedFields: [] },
      { id: 'demo-unpaid', paidAt: null, updatedAt: new Date('2026-09-11T08:00:00.000Z'), editedFields: [] },
      { id: 'real-paid', paidAt: null, updatedAt: new Date('2026-09-12T08:00:00.000Z'), editedFields: [] },
    ]);
  });

  it('accepts the new currencies and job tables', async () => {
    await prisma.invoice.update({ where: { id: 'real-paid' }, data: { currency: 'EUR' } });
    const job = await prisma.extractionJob.create({ data: { invoiceId: 'real-paid' } });
    expect(job).toMatchObject({ state: 'queued', attempts: 0, lastError: null });

    const analysis = await prisma.analysisJob.create({ data: { userId: 'real-user', type: 'dpo_aging' } });
    expect(analysis).toMatchObject({ state: 'queued', result: null, costUsd: null });

    // Deleting an invoice removes its extraction jobs.
    await prisma.invoice.delete({ where: { id: 'real-paid' } });
    expect(await prisma.extractionJob.count()).toBe(0);
  });
});
