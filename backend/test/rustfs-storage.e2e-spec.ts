import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { LocalStorageService } from '../src/storage/local-storage.service';
import { ReferenceRoutingStorageService } from '../src/storage/reference-routing-storage.service';
import {
  rustFsConfigFromEnvironment,
  RustFsStorageConfig,
  RustFsStorageService,
} from '../src/storage/rustfs-storage.service';
import { configuredStorageService } from '../src/storage/storage.module';

describe('RustFS S3 storage', () => {
  const config = (): RustFsStorageConfig => ({
    endpoint: 'http://rustfs:9000',
    region: 'us-east-1',
    bucket: 'invoices',
    accessKey: randomUUID(),
    secretKey: randomUUID(),
  });

  const client = (send: jest.Mock): S3Client => ({ send } as unknown as S3Client);
  const file = (overrides: Partial<Express.Multer.File> = {}) => ({
    originalname: '../../invoice.PDF',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
    ...overrides,
  } as Express.Multer.File);

  it('creates the configured bucket when it is missing and safely uploads an invoice', async () => {
    const send = jest.fn(async command => {
      if (command instanceof HeadBucketCommand) {
        throw { name: 'NotFound', $metadata: { httpStatusCode: 404 } };
      }
      return {};
    });
    const storage = new RustFsStorageService(config(), client(send));

    const stored = await storage.upload(file());

    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    const put = send.mock.calls[2][0] as PutObjectCommand;
    expect(put.input).toMatchObject({
      Bucket: 'invoices', Body: Buffer.from('%PDF-1.4'),
      ContentLength: 8, ContentType: 'application/pdf',
    });
    expect(put.input.Key).toMatch(/^invoices\/[0-9a-f-]{36}\.pdf$/);
    expect(stored).toEqual({ fileUrl: `s3://invoices/${put.input.Key}` });
    expect(stored.fileUrl).not.toContain('..');
  });

  it('reuses an existing bucket and initializes it only once', async () => {
    const send = jest.fn().mockResolvedValue({});
    const storage = new RustFsStorageService(config(), client(send));
    await storage.upload(file({ originalname: 'scan.jpeg', mimetype: 'image/jpeg' }));
    await storage.upload(file({ originalname: 'scan.png', mimetype: 'image/png' }));

    expect(send.mock.calls.filter(([command]) => command instanceof HeadBucketCommand)).toHaveLength(1);
    expect(send.mock.calls.filter(([command]) => command instanceof CreateBucketCommand)).toHaveLength(0);
    const puts = send.mock.calls.filter(([command]) => command instanceof PutObjectCommand);
    expect((puts[0][0] as PutObjectCommand).input.Key).toMatch(/\.jpeg$/);
    expect((puts[1][0] as PutObjectCommand).input.Key).toMatch(/\.png$/);
  });

  it('removes an uploaded object using its stable S3 reference', async () => {
    const send = jest.fn().mockResolvedValue({});
    const storage = new RustFsStorageService(config(), client(send));
    await storage.remove({ fileUrl: 's3://invoices/invoices/test-object.pdf' });
    expect((send.mock.calls[0][0] as DeleteObjectCommand).input).toEqual({
      Bucket: 'invoices', Key: 'invoices/test-object.pdf',
    });
  });

  it('stages deletion by copy and restores the object after database rollback', async () => {
    const send = jest.fn().mockResolvedValue({});
    const storage = new RustFsStorageService(config(), client(send));
    const removal = await storage.stageRemoval('s3://invoices/invoices/original.pdf');

    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    const stageCopy = send.mock.calls[1][0] as CopyObjectCommand;
    expect(stageCopy.input).toMatchObject({
      Bucket: 'invoices', CopySource: 'invoices/invoices/original.pdf',
    });
    expect(stageCopy.input.Key).toMatch(/^_deleting\/[0-9a-f-]{36}$/);
    expect((send.mock.calls[2][0] as DeleteObjectCommand).input.Key).toBe('invoices/original.pdf');

    await removal.restore();
    expect((send.mock.calls[3][0] as CopyObjectCommand).input).toMatchObject({
      Bucket: 'invoices', Key: 'invoices/original.pdf',
      CopySource: `invoices/${stageCopy.input.Key}`,
    });
    expect((send.mock.calls[4][0] as DeleteObjectCommand).input.Key).toBe(stageCopy.input.Key);
  });

  it('finalizes committed deletion by removing only the staging copy', async () => {
    const send = jest.fn().mockResolvedValue({});
    const storage = new RustFsStorageService(config(), client(send));
    const removal = await storage.stageRemoval('s3://invoices/invoices/original.pdf');
    const stagedKey = (send.mock.calls[1][0] as CopyObjectCommand).input.Key;
    await removal.finalize();
    expect((send.mock.calls[3][0] as DeleteObjectCommand).input.Key).toBe(stagedKey);
  });

  it('treats an already missing object as a successful no-op deletion', async () => {
    const send = jest.fn().mockRejectedValue({ name: 'NoSuchKey' });
    const storage = new RustFsStorageService(config(), client(send));
    const removal = await storage.stageRemoval('s3://invoices/invoices/missing.pdf');
    await expect(removal.finalize()).resolves.toBeUndefined();
    await expect(removal.restore()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('keeps the original and removes its staging copy when original deletion fails', async () => {
    const deleteFailure = new Error('delete unavailable');
    const send = jest.fn(async command => {
      if (command instanceof DeleteObjectCommand
        && command.input.Key === 'invoices/original.pdf') throw deleteFailure;
      return {};
    });
    const storage = new RustFsStorageService(config(), client(send));
    await expect(storage.stageRemoval('s3://invoices/invoices/original.pdf')).rejects.toBe(deleteFailure);
    expect(send.mock.calls[1][0]).toBeInstanceOf(CopyObjectCommand);
    expect((send.mock.calls[3][0] as DeleteObjectCommand).input.Key).toMatch(/^_deleting\//);
  });

  it.each([
    's3://other-bucket/invoices/file.pdf',
    's3://invoices/',
    's3://invoices/../file.pdf',
    's3://invoices/invoices\\file.pdf',
  ])('rejects unsafe or foreign object reference %s', async reference => {
    const send = jest.fn();
    const storage = new RustFsStorageService(config(), client(send));
    await expect(storage.stageRemoval(reference)).rejects.toThrow('Invalid RustFS storage reference');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('Storage driver configuration', () => {
  it('selects local storage by default and when explicitly configured', async () => {
    const local = new LocalStorageService();
    await expect(configuredStorageService(local, {})).resolves.toBe(local);
    await expect(configuredStorageService(local, { STORAGE_DRIVER: 'local' })).resolves.toBe(local);
  });

  it('rejects an unsupported storage driver clearly', async () => {
    await expect(configuredStorageService(
      new LocalStorageService(), { STORAGE_DRIVER: 'unsupported' },
    )).rejects.toThrow('Unsupported STORAGE_DRIVER: unsupported');
  });

  it('fails driver selection with every missing RustFS setting and no exposed values', async () => {
    await expect(configuredStorageService(
      new LocalStorageService(), { STORAGE_DRIVER: 'rustfs' },
    )).rejects.toThrow(
      'Missing required RustFS configuration: RUSTFS_ENDPOINT, RUSTFS_REGION, RUSTFS_BUCKET, RUSTFS_ACCESS_KEY, RUSTFS_SECRET_KEY',
    );
  });

  it('validates endpoint protocol and S3 bucket naming', () => {
    const environment = {
      RUSTFS_ENDPOINT: 'ftp://rustfs', RUSTFS_REGION: 'us-east-1', RUSTFS_BUCKET: 'Invalid_Bucket',
      RUSTFS_ACCESS_KEY: randomUUID(), RUSTFS_SECRET_KEY: randomUUID(),
    };
    expect(() => rustFsConfigFromEnvironment(environment))
      .toThrow('RUSTFS_ENDPOINT must be a valid HTTP or HTTPS URL');
    expect(() => rustFsConfigFromEnvironment({ ...environment, RUSTFS_ENDPOINT: 'http://rustfs:9000' }))
      .toThrow('RUSTFS_BUCKET must be a valid S3 bucket name');
  });
});

describe('Storage reference routing', () => {
  const storage = () => ({
    upload: jest.fn(), remove: jest.fn(), stageRemoval: jest.fn(),
  });

  it('uses RustFS for new uploads and S3 references', async () => {
    const rustfs = storage();
    const local = storage();
    const router = new ReferenceRoutingStorageService(rustfs, local);
    const invoice = { originalname: 'invoice.pdf' } as Express.Multer.File;
    const stored = { fileUrl: 's3://invoices/invoices/file.pdf' };
    rustfs.upload.mockResolvedValue(stored);
    rustfs.stageRemoval.mockResolvedValue({ finalize: jest.fn(), restore: jest.fn() });

    await expect(router.upload(invoice)).resolves.toBe(stored);
    await router.remove(stored);
    await router.stageRemoval(stored.fileUrl);

    expect(rustfs.upload).toHaveBeenCalledWith(invoice);
    expect(rustfs.remove).toHaveBeenCalledWith(stored);
    expect(rustfs.stageRemoval).toHaveBeenCalledWith(stored.fileUrl);
    expect(local.remove).not.toHaveBeenCalled();
    expect(local.stageRemoval).not.toHaveBeenCalled();
  });

  it('retains deletion support for existing local invoice references', async () => {
    const rustfs = storage();
    const local = storage();
    const router = new ReferenceRoutingStorageService(rustfs, local);
    const stored = { fileUrl: '/uploads/legacy.pdf', filePath: '/legacy.pdf' };
    local.stageRemoval.mockResolvedValue({ finalize: jest.fn(), restore: jest.fn() });

    await router.remove(stored);
    await router.stageRemoval(stored.fileUrl);

    expect(local.remove).toHaveBeenCalledWith(stored);
    expect(local.stageRemoval).toHaveBeenCalledWith(stored.fileUrl);
    expect(rustfs.remove).not.toHaveBeenCalled();
    expect(rustfs.stageRemoval).not.toHaveBeenCalled();
  });
});
