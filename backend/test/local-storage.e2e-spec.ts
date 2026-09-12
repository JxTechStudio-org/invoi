import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorageService } from '../src/storage/local-storage.service';

describe('Local invoice storage cleanup', () => {
  let directory: string;
  let storage: LocalStorageService;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'invoi-storage-test-'));
    const previousPath = process.env.STORAGE_LOCAL_PATH;
    try {
      process.env.STORAGE_LOCAL_PATH = join(directory, 'uploads');
      storage = new LocalStorageService();
    } finally {
      if (previousPath === undefined) delete process.env.STORAGE_LOCAL_PATH;
      else process.env.STORAGE_LOCAL_PATH = previousPath;
    }
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('removes the file returned by upload and tolerates repeated cleanup', async () => {
    const contents = Buffer.from('%PDF-1.4');
    const stored = await storage.upload({
      originalname: 'invoice.pdf', buffer: contents,
    } as Express.Multer.File);
    expect(await readFile(stored.filePath)).toEqual(contents);
    await storage.remove(stored);
    await expect(readFile(stored.filePath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(storage.remove(stored)).resolves.toBeUndefined();
  });

  it('refuses to remove files outside the configured storage directory', async () => {
    const outsidePath = join(directory, 'keep.txt');
    await writeFile(outsidePath, 'keep');
    await expect(storage.remove({ filePath: outsidePath, fileUrl: '/keep.txt' }))
      .rejects.toThrow('outside the invoice storage directory');
    expect(await readFile(outsidePath, 'utf8')).toBe('keep');
  });
});
