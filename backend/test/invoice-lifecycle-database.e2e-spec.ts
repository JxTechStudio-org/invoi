import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Invoice, Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID, scryptSync } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { LocalStorageService } from '../src/storage/local-storage.service';
import { STORAGE_SERVICE } from '../src/storage/storage.service';
import { invoiceFixture } from './fixtures/invoice';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Invoice lifecycle persistence (PostgreSQL)', () => {
  const schemaName = `lifecycle_test_${randomUUID().replaceAll('-', '')}`;
  let prisma: PrismaClient;
  let app: INestApplication;
  let directory: string;
  let userId: string;
  let schemaCreated = false;

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    url.searchParams.set('schema', schemaName);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
    schemaCreated = true;
    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy',
      '--schema', resolve(__dirname, '../prisma/schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 30000 });

    directory = await mkdtemp(join(tmpdir(), 'invoi-lifecycle-test-'));
    const previousPath = process.env.STORAGE_LOCAL_PATH;
    let storage: LocalStorageService;
    try {
      process.env.STORAGE_LOCAL_PATH = join(directory, 'uploads');
      storage = new LocalStorageService();
    } finally {
      if (previousPath === undefined) delete process.env.STORAGE_LOCAL_PATH;
      else process.env.STORAGE_LOCAL_PATH = previousPath;
    }
    const user = await prisma.user.create({ data: {
      email: 'lifecycle@example.test', businessName: 'Demo Business',
      passwordHash: `scrypt:${scryptSync(randomUUID(), 'test-fixture-salt', 64).toString('hex')}`,
    } });
    userId = user.id;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(STORAGE_SERVICE).useValue(storage)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  }, 60000);

  beforeEach(async () => {
    await prisma.invoice.deleteMany();
  });

  afterAll(async () => {
    try {
      await app?.close();
      if (schemaCreated) await prisma.$executeRawUnsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
    } finally {
      await prisma?.$disconnect();
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  async function upload(): Promise<string> {
    const response = await request(app.getHttpServer()).post('/api/invoices/upload')
      .field('userId', userId)
      .attach('file', Buffer.from('%PDF-1.4'), { filename: 'invoice.pdf', contentType: 'application/pdf' })
      .expect(201);
    return response.body.invoice_id;
  }

  function invoiceData(overrides: Partial<Invoice> = {}): Prisma.InvoiceUncheckedCreateInput {
    const { extractionConfidence, ...data } = invoiceFixture({ userId, ...overrides });
    return { ...data, extractionConfidence: extractionConfidence ?? Prisma.DbNull };
  }

  it('persists manual corrections and exposes recalculated status', async () => {
    const id = await upload();
    await request(app.getHttpServer()).put(`/api/invoices/${id}`).send({
      totalAmount: '100.00', taxAmount: '99.99', customerName: '  DEMO, Business. ',
      invoiceDate: '2026-09-12',
    }).expect(200);
    const saved = await prisma.invoice.findUniqueOrThrow({ where: { id } });
    expect(saved.totalAmount?.toFixed(2)).toBe('100.00');
    expect(saved.taxAmount?.toFixed(2)).toBe('99.99');
    expect(saved.userId).toBe(userId);
    expect(saved.status).toBe('processing');
    expect(saved.needsReviewReason).toBeNull();
    await request(app.getHttpServer()).put(`/api/invoices/${id}`).send({ customerName: 'Other Business' }).expect(200);
    await request(app.getHttpServer()).get(`/api/invoices/${id}/status`)
      .expect(200).expect({ invoiceId: id, status: 'needs_review' });
    expect((await prisma.invoice.findUniqueOrThrow({ where: { id } })).needsReviewReason)
      .toBe('customer_name_mismatch');
  });

  it('preserves original confidence and does not expose the User when updating', async () => {
    const invoice = await prisma.invoice.create({ data: invoiceData({
      userId, extractionConfidence: { totalAmount: 0.75 },
    }) });
    const response = await request(app.getHttpServer()).put(`/api/invoices/${invoice.id}`)
      .send({ totalAmount: '1234567890.12' }).expect(200);
    expect(response.body).toMatchObject({ status: 'needs_review', needsReviewReason: 'low_confidence' });
    expect(response.body).not.toHaveProperty('user');
    expect(response.body).not.toHaveProperty('passwordHash');
    const saved = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(saved.totalAmount?.toFixed(2)).toBe('1234567890.12');
    expect(saved.extractionConfidence).toEqual({ totalAmount: 0.75 });
  });

  it('exports persisted reporting values and applies list filters', async () => {
    await prisma.invoice.create({ data: invoiceData({ vendorName: 'شركة "المثال", الرياض' }) });
    await prisma.invoice.create({ data: invoiceData({ id: 'other-invoice', status: 'processing' }) });
    const response = await request(app.getHttpServer())
      .get('/api/invoices/export?status=completed&date=2026-09-12').expect(200);
    expect(response.text).toContain('"شركة ""المثال"", الرياض"');
    expect(response.text).toContain(',100.00,15.00,SAR,');
    expect(response.text).not.toContain('other-invoice');
  });

  it('deletes the database row and its actual file while retaining another invoice', async () => {
    const id = await upload();
    const otherId = await upload();
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });
    const other = await prisma.invoice.findUniqueOrThrow({ where: { id: otherId } });
    const filePath = join(directory, 'uploads', basename(invoice.fileUrl));
    expect(await readFile(filePath, 'utf8')).toBe('%PDF-1.4');
    const response = await request(app.getHttpServer()).delete(`/api/invoices/${id}`).expect(204);
    expect(response.text).toBe('');
    expect(await prisma.invoice.findUnique({ where: { id } })).toBeNull();
    await expect(readFile(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await prisma.invoice.findUnique({ where: { id: otherId } })).not.toBeNull();
    expect(await readFile(join(directory, 'uploads', basename(other.fileUrl)), 'utf8')).toBe('%PDF-1.4');
    await request(app.getHttpServer()).delete(`/api/invoices/${id}`).expect(404);
  });

  it('rolls back the database deletion if the stored path is unsafe', async () => {
    const invoice = await prisma.invoice.create({ data: invoiceData({ fileUrl: '/uploads/../keep.txt' }) });
    await writeFile(join(directory, 'keep.txt'), 'keep');
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      await request(app.getHttpServer()).delete(`/api/invoices/${invoice.id}`).expect(500);
    } finally {
      log.mockRestore();
    }
    expect(await prisma.invoice.findUnique({ where: { id: invoice.id } })).not.toBeNull();
    expect(await readFile(join(directory, 'keep.txt'), 'utf8')).toBe('keep');
  });
});
