import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
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

  it('restores a staged file byte-for-byte after rollback', async () => {
    const contents = Buffer.from('%PDF-1.4 original contents');
    const stored = await storage.upload({ originalname: 'invoice.pdf', buffer: contents } as Express.Multer.File);
    const removal = await storage.stageRemoval(stored.fileUrl);
    await expect(readFile(stored.filePath)).rejects.toMatchObject({ code: 'ENOENT' });
    await removal.restore();
    expect(await readFile(stored.filePath)).toEqual(contents);
    expect(await readdir(join(directory, 'uploads'))).toHaveLength(1);
  });

  it('finalizes only the staged invoice file', async () => {
    const file = { originalname: 'invoice.pdf', buffer: Buffer.from('%PDF-1.4') } as Express.Multer.File;
    const stored = await storage.upload(file);
    const other = await storage.upload(file);
    const removal = await storage.stageRemoval(stored.fileUrl);
    await removal.finalize();
    await expect(readFile(stored.filePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(other.filePath)).toEqual(file.buffer);
    expect(await readdir(join(directory, 'uploads'))).toHaveLength(1);
  });

  it('tolerates a file that is already absent', async () => {
    const removal = await storage.stageRemoval('/uploads/missing.pdf');
    await expect(removal.finalize()).resolves.toBeUndefined();
    await expect(removal.restore()).resolves.toBeUndefined();
  });

  it.each(['/uploads/../keep.txt', '/uploads/sub/file.pdf', '/uploads/..', '/uploads/', 'https://example.test/invoice.pdf', '/uploads/..\\keep.txt'])(
    'rejects unsafe or unsupported stored URL %s', async fileUrl => {
      const outsidePath = join(directory, 'keep.txt');
      await writeFile(outsidePath, 'keep');
      await expect(storage.stageRemoval(fileUrl)).rejects.toThrow('Invalid invoice storage URL');
      expect(await readFile(outsidePath, 'utf8')).toBe('keep');
    },
  );

  it('does not move or remove directories', async () => {
    const nested = join(directory, 'uploads', 'folder');
    await mkdir(nested, { recursive: true });
    await writeFile(join(nested, 'keep.txt'), 'keep');
    await expect(storage.stageRemoval('/uploads/folder')).rejects.toThrow('not a file');
    expect(await readFile(join(nested, 'keep.txt'), 'utf8')).toBe('keep');
  });

  it('removes a symlink without deleting its target', async () => {
    const outsidePath = join(directory, 'keep.txt');
    await writeFile(outsidePath, 'keep');
    await mkdir(join(directory, 'uploads'));
    await symlink(outsidePath, join(directory, 'uploads', 'link.pdf'));
    const removal = await storage.stageRemoval('/uploads/link.pdf');
    await removal.finalize();
    expect(await readFile(outsidePath, 'utf8')).toBe('keep');
    expect(await readdir(join(directory, 'uploads'))).toEqual([]);
  });
});
