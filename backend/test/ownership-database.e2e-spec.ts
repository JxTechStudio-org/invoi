import { execFileSync } from 'node:child_process';
import { randomUUID, scryptSync } from 'node:crypto';
import { cpSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Currency, PaymentMethod, PaymentStatus, PrismaClient } from '@prisma/client';

// Opt in with a disposable PostgreSQL database. Never use DATABASE_URL implicitly.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Ownership migration and persistence (PostgreSQL)', () => {
  const schemaName = `ownership_test_${randomUUID().replaceAll('-', '')}`;
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

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-ownership-migrations-'));
    cpSync(join(prismaDirectory, 'schema.prisma'), join(temporaryDirectory, 'schema.prisma'));
    mkdirSync(join(temporaryDirectory, 'migrations'));
    for (const entry of ['migration_lock.toml', '20260908000000_init_invoice']) {
      cpSync(join(prismaDirectory, 'migrations', entry),
        join(temporaryDirectory, 'migrations', entry), { recursive: true });
    }
    deploy(join(temporaryDirectory, 'schema.prisma'), url.toString());
    deploy(join(prismaDirectory, 'schema.prisma'), url.toString());
  }, 60000);

  afterAll(async () => {
    try {
      // Only this run's generated schema is removed; other schemas are untouched.
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  const account = (email: string) => ({
    email,
    businessName: 'Test Business',
    passwordHash: `scrypt:${scryptSync(randomUUID(), 'test-fixture-salt', 64).toString('hex')}`,
  });

  it('migrates the empty historical schema without fabricating users or invoices', async () => {
    expect(await prisma.invoice.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  it('creates multiple invoices belonging to the expected user', async () => {
    const user = await prisma.user.create({ data: {
      ...account('owner@example.test'),
      invoices: { create: [{ fileUrl: '/one.pdf' }, { fileUrl: '/two.pdf' }] },
    }, include: { invoices: true } });

    expect(user.invoices).toHaveLength(2);
    expect(user.createdAt).toBeInstanceOf(Date);
    for (const invoice of user.invoices) {
      expect(invoice.userId).toBe(user.id);
      const saved = await prisma.invoice.findUniqueOrThrow({
        where: { id: invoice.id }, include: { user: { select: { id: true, businessName: true } } },
      });
      expect(saved.user).toEqual({ id: user.id, businessName: 'Test Business' });
    }
  });

  it('rejects references to nonexistent owners', async () => {
    await expect(prisma.invoice.create({ data: {
      fileUrl: '/invalid.pdf', userId: randomUUID(),
    } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('enforces unique account emails', async () => {
    await prisma.user.create({ data: account('unique@example.test') });
    await expect(prisma.user.create({ data: account('unique@example.test') }))
      .rejects.toMatchObject({ code: 'P2002' });
  });

  it('prevents deleting a user that owns invoices', async () => {
    const user = await prisma.user.create({ data: {
      ...account('retained@example.test'), invoices: { create: { fileUrl: '/retained.pdf' } },
    } });
    await expect(prisma.user.delete({ where: { id: user.id } }))
      .rejects.toMatchObject({ code: 'P2003' });
    expect(await prisma.invoice.count({ where: { userId: user.id } })).toBe(1);
  });

  it('enforces NOT NULL ownership in PostgreSQL itself', async () => {
    await expect(prisma.$executeRaw`
      INSERT INTO "Invoice" ("id", "fileUrl", "updatedAt")
      VALUES ('unowned-invoice', '/unowned.pdf', CURRENT_TIMESTAMP)
    `).rejects.toMatchObject({ code: 'P2010', meta: { code: '23502' } });
  });

  it('round-trips v2 reporting fields, decimal amounts, and per-field JSON confidence', async () => {
    const user = await prisma.user.create({ data: account('reporting@example.test') });
    const data = {
      userId: user.id, fileUrl: '/reporting.pdf', vendorName: 'Vendor Business',
      invoiceNumber: 'INV-2026-1', invoiceDate: new Date('2026-09-12T00:00:00Z'),
      dueDate: new Date('2026-10-12T00:00:00Z'), totalAmount: '1234567890.12',
      taxAmount: '123456789.01', currency: Currency.SAR,
      paymentStatus: PaymentStatus.partially_paid,
      amountPaid: '1000000000.01', paymentMethod: PaymentMethod.mixed,
      customerName: 'Extracted Customer',
      taxNumber: '001234567890123', crNumber: '0012345678',
      extractionConfidence: { vendorName: 0.99, totalAmount: 0.87, customerName: 0.65 },
      needsReviewReason: 'Customer name confidence is low',
    };
    const created = await prisma.invoice.create({ data: { ...data, status: 'needs_review' } });
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: created.id } });
    const { totalAmount, taxAmount, amountPaid, ...otherFields } = data;
    expect(invoice).toMatchObject({ ...otherFields, status: 'needs_review' });
    expect(invoice.totalAmount?.toFixed(2)).toBe(totalAmount);
    expect(invoice.taxAmount?.toFixed(2)).toBe(taxAmount);
    expect(invoice.amountPaid?.toFixed(2)).toBe(amountPaid);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).businessName)
      .toBe('Test Business');
    expect(await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'completed' } }))
      .toMatchObject({ status: 'completed' });
  });
});
