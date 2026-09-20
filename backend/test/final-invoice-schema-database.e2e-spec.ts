import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Final invoice schema migration (PostgreSQL)', () => {
  const schemaName = `final_schema_test_${randomUUID().replaceAll('-', '')}`;
  const prismaDirectory = resolve(__dirname, '../prisma');
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;

  function deploy(schemaPath: string, url: string) {
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', schemaPath,
    ], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe', timeout: 30000 });
  }

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-final-schema-migrations-'));
    cpSync(join(prismaDirectory, 'schema.prisma'), join(temporaryDirectory, 'schema.prisma'));
    mkdirSync(join(temporaryDirectory, 'migrations'));
    for (const entry of [
      'migration_lock.toml',
      '20260908000000_init_invoice',
      '20260912000000_user_invoice_schema_v2',
    ]) {
      cpSync(join(prismaDirectory, 'migrations', entry),
        join(temporaryDirectory, 'migrations', entry), { recursive: true });
    }

    deploy(join(temporaryDirectory, 'schema.prisma'), url.toString());
    await prisma.$executeRaw`
      INSERT INTO "User" ("id", "email", "passwordHash", "businessName")
      VALUES ('migration-owner', 'migration@example.test', 'not-a-real-password-hash', 'Migration Business')
    `;

    await prisma.$executeRaw`
      INSERT INTO "Invoice" (
        "id", "userId", "fileUrl", "status", "totalAmount", "taxAmount",
        "paymentStatus", "paymentMethod", "currency", "updatedAt"
      ) VALUES
        ('invoice-bank', 'migration-owner', '/bank.pdf', 'processing', 100.01, 15.01,
          'paid', 'Bank Transfer', 'SAR', CURRENT_TIMESTAMP),
        ('invoice-cash', 'migration-owner', '/cash.pdf', 'completed', 200.02, 30.02,
          'unpaid', 'Cash', 'USD', CURRENT_TIMESTAMP),
        ('invoice-cheque', 'migration-owner', '/cheque.pdf', 'needs_review', 300.03, 45.03,
          'overdue', 'Cheque', 'AED', CURRENT_TIMESTAMP),
        ('invoice-card', 'migration-owner', '/card.pdf', 'processing', 400.04, 60.04,
          'paid', 'Credit Card', 'SAR', CURRENT_TIMESTAMP),
        ('invoice-online', 'migration-owner', '/online.pdf', 'completed', 500.05, 75.05,
          'paid', 'Online Payment', 'USD', CURRENT_TIMESTAMP),
        ('invoice-null', 'migration-owner', '/null.pdf', 'processing', NULL, NULL,
          NULL, NULL, NULL, CURRENT_TIMESTAMP)
    `;

    await prisma.$executeRaw`
      UPDATE "Invoice"
      SET "vendorName" = 'Legacy Vendor',
          "invoiceNumber" = 'LEGACY-001',
          "invoiceDate" = '2026-08-01T00:00:00.000Z',
          "dueDate" = '2026-08-31T00:00:00.000Z',
          "customerName" = 'Migration Business',
          "taxNumber" = '001234567890123',
          "crNumber" = '0012345678',
          "extractionConfidence" = '{"vendorName": 0.97, "totalAmount": 0.91}'::jsonb,
          "needsReviewReason" = 'legacy_reason',
          "createdAt" = '2026-08-02T03:04:05.000Z',
          "updatedAt" = '2026-08-03T04:05:06.000Z'
      WHERE "id" = 'invoice-bank'
    `;

    deploy(join(prismaDirectory, 'schema.prisma'), url.toString());
  }, 60000);

  afterAll(async () => {
    try {
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('preserves rows, ownership, lifecycle status, and monetary values while mapping enums', async () => {
    const invoices = await prisma.invoice.findMany({ orderBy: { id: 'asc' } });
    expect(invoices).toHaveLength(6);
    expect(invoices.map(invoice => ({
      id: invoice.id,
      userId: invoice.userId,
      status: invoice.status,
      totalAmount: invoice.totalAmount?.toFixed(2) ?? null,
      taxAmount: invoice.taxAmount?.toFixed(2) ?? null,
      amountPaid: invoice.amountPaid?.toFixed(2) ?? null,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      currency: invoice.currency,
    }))).toEqual([
      {
        id: 'invoice-bank', userId: 'migration-owner', status: 'processing',
        totalAmount: '100.01', taxAmount: '15.01', amountPaid: null,
        paymentStatus: 'paid', paymentMethod: 'bank_transfer', currency: 'SAR',
      },
      {
        id: 'invoice-card', userId: 'migration-owner', status: 'processing',
        totalAmount: '400.04', taxAmount: '60.04', amountPaid: null,
        paymentStatus: 'paid', paymentMethod: 'credit_card', currency: 'SAR',
      },
      {
        id: 'invoice-cash', userId: 'migration-owner', status: 'completed',
        totalAmount: '200.02', taxAmount: '30.02', amountPaid: null,
        paymentStatus: 'unpaid', paymentMethod: 'cash', currency: 'USD',
      },
      {
        id: 'invoice-cheque', userId: 'migration-owner', status: 'needs_review',
        totalAmount: '300.03', taxAmount: '45.03', amountPaid: null,
        paymentStatus: 'overdue', paymentMethod: 'cheque', currency: 'AED',
      },
      {
        id: 'invoice-null', userId: 'migration-owner', status: 'processing',
        totalAmount: null, taxAmount: null, amountPaid: null,
        paymentStatus: null, paymentMethod: null, currency: null,
      },
      {
        id: 'invoice-online', userId: 'migration-owner', status: 'completed',
        totalAmount: '500.05', taxAmount: '75.05', amountPaid: null,
        paymentStatus: 'paid', paymentMethod: 'online_payment', currency: 'USD',
      },
    ]);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: 'migration-owner' } });
    expect(user.reviewAmountThreshold).toBeNull();
    expect(await prisma.invoice.count({ where: { userId: user.id } })).toBe(6);

    expect(await prisma.invoice.findUniqueOrThrow({ where: { id: 'invoice-bank' } }))
      .toMatchObject({
        fileUrl: '/bank.pdf', vendorName: 'Legacy Vendor', invoiceNumber: 'LEGACY-001',
        invoiceDate: new Date('2026-08-01T00:00:00.000Z'),
        dueDate: new Date('2026-08-31T00:00:00.000Z'),
        customerName: 'Migration Business', taxNumber: '001234567890123',
        crNumber: '0012345678', extractionConfidence: { vendorName: 0.97, totalAmount: 0.91 },
        needsReviewReason: 'legacy_reason', createdAt: new Date('2026-08-02T03:04:05.000Z'),
        updatedAt: new Date('2026-08-03T04:05:06.000Z'),
      });
  });
});
