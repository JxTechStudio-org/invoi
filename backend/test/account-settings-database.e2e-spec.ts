import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AuthService } from '../src/auth/auth.service';
import { ExtractionAvailabilityService } from '../src/extraction/extraction-availability.service';
import { PrismaService } from '../src/prisma/prisma.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Account settings (PostgreSQL, F19)', () => {
  const schemaName = `account_settings_test_${randomUUID().replaceAll('-', '')}`;
  let prisma: PrismaClient;
  let temporaryDirectory: string;
  let schemaCreated = false;
  let auth: AuthService;

  async function addInvoice(id: string, data: Partial<Prisma.InvoiceUncheckedCreateInput>, userId = 'owner') {
    await prisma.invoice.create({
      data: {
        id, userId, fileUrl: `s3://invoices/invoices/${id}.pdf`, status: 'needs_review',
        vendorName: 'Vendor', totalAmount: '115.00', taxAmount: '15.00', customerName: 'شركة المالك',
        ...data,
      },
    });
  }

  const reasons = async () => Object.fromEntries((await prisma.invoice.findMany({ orderBy: { id: 'asc' } }))
    .map(invoice => [invoice.id, [invoice.status, invoice.needsReviewReason]]));

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;

    temporaryDirectory = mkdtempSync(join(tmpdir(), 'invoi-account-settings-'));
    cpSync(resolve(__dirname, '../prisma'), temporaryDirectory, { recursive: true });
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy',
      '--schema', join(temporaryDirectory, 'schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 30000 });

    const availability = { unavailableReason: jest.fn().mockResolvedValue('disabled') };
    auth = new AuthService(
      prisma as PrismaService, {} as JwtService, availability as unknown as ExtractionAvailabilityService,
    );
  }, 60000);

  beforeEach(async () => {
    await prisma.extractionJob.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.createMany({
      data: ['owner', 'other'].map(id => ({
        id, email: `${id}@example.test`, passwordHash: 'hash', businessName: 'شركة المالك',
        firstName: 'Test', lastName: 'User', username: id, phone: '+966500000000',
      })),
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

  it('saves the settings and returns the profile without the password hash', async () => {
    const profile = await auth.updateMe('owner', { businessNameEn: 'Owner Trading', reviewAmountThreshold: '5000.50' });
    expect(profile).toMatchObject({
      id: 'owner', businessName: 'شركة المالك', businessNameEn: 'Owner Trading', recheckedInvoices: 0,
      extractionAvailable: false, extractionUnavailableReason: 'disabled',
    });
    expect(profile.reviewAmountThreshold?.toFixed(2)).toBe('5000.50');
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('isDemo');

    await auth.updateMe('owner', { businessNameEn: null, reviewAmountThreshold: null });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: 'owner' } }))
      .toMatchObject({ businessNameEn: null, reviewAmountThreshold: null });
  });

  it('re-checks only the account\'s needs_review invoices and keeps reasons people or extraction added', async () => {
    await addInvoice('a-mismatch', { customerName: 'Owner Trading', needsReviewReason: 'customer_name_mismatch' });
    await addInvoice('b-flagged', {
      customerName: 'Owner Trading', needsReviewReason: 'customer_name_mismatch,user_flagged,extraction_failed',
    });
    await addInvoice('c-completed', { status: 'completed', customerName: 'Owner Trading', needsReviewReason: null });
    await addInvoice('d-processing', { status: 'processing', customerName: 'Owner Trading', needsReviewReason: null });
    await addInvoice('e-other-account', { customerName: 'Owner Trading', needsReviewReason: 'customer_name_mismatch' }, 'other');

    const profile = await auth.updateMe('owner', { businessNameEn: 'Owner Trading' });

    expect(profile.recheckedInvoices).toBe(2);
    expect(await reasons()).toEqual({
      'a-mismatch': ['needs_review', null],
      'b-flagged': ['needs_review', 'user_flagged,extraction_failed'],
      'c-completed': ['completed', null],
      'd-processing': ['processing', null],
      'e-other-account': ['needs_review', 'customer_name_mismatch'],
    });
  });

  it('adds and removes the threshold flag as the threshold moves', async () => {
    await addInvoice('a', { needsReviewReason: 'user_flagged' });
    await auth.updateMe('owner', { reviewAmountThreshold: '100' });
    expect((await reasons()).a).toEqual(['needs_review', 'amount_threshold_exceeded,user_flagged']);
    await auth.updateMe('owner', { reviewAmountThreshold: null });
    expect((await reasons()).a).toEqual(['needs_review', 'user_flagged']);
  });

  it('re-checks after a change of the Arabic business name too', async () => {
    await addInvoice('a', { customerName: 'شركة المالك الجديدة', needsReviewReason: 'customer_name_mismatch' });
    await expect(auth.updateMe('owner', { businessName: 'شركة المالك الجديدة' }))
      .resolves.toMatchObject({ recheckedInvoices: 1 });
    expect((await reasons()).a).toEqual(['needs_review', null]);
  });

  it('does not touch invoices when the values did not actually change', async () => {
    await addInvoice('a', { needsReviewReason: 'customer_name_mismatch' });
    await expect(auth.updateMe('owner', { businessName: 'شركة المالك' })).resolves.toMatchObject({ recheckedInvoices: 0 });
    expect((await reasons()).a).toEqual(['needs_review', 'customer_name_mismatch']);
  });

  it('requires at least one setting', async () => {
    await expect(auth.updateMe('owner', {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
