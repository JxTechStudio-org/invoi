import { Injectable } from '@nestjs/common';
import { lstat, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PendingFileRemoval, StorageService, StoredFile } from './storage.service';

interface LocalStoredFile extends StoredFile {
  filePath: string;
}

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly storageDirectory = resolve(
    process.env.STORAGE_LOCAL_PATH ?? 'uploads',
  );

  async upload(file: Express.Multer.File): Promise<LocalStoredFile> {
    await mkdir(this.storageDirectory, { recursive: true });

    const extension = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const filePath = join(this.storageDirectory, filename);

    await writeFile(filePath, file.buffer);

    return {
      filePath,
      fileUrl: `/uploads/${filename}`,
    };
  }

  async remove(file: StoredFile): Promise<void> {
    const filePath = file.filePath ?? this.resolveReference(file.fileUrl);
    if (dirname(resolve(filePath)) !== this.storageDirectory) {
      throw new Error('Cannot remove a file outside the invoice storage directory');
    }
    await rm(filePath, { force: true });
  }

  async stageRemoval(fileUrl: string): Promise<PendingFileRemoval> {
    const originalPath = this.resolveReference(fileUrl);

    const stagedPath = join(this.storageDirectory, `.deleting-${randomUUID()}`);
    try {
      const info = await lstat(originalPath);
      if (!info.isFile() && !info.isSymbolicLink()) {
        throw new Error('Invoice storage object is not a file');
      }
      // Keep the move on the same filesystem so rollback can restore the file.
      await rename(originalPath, stagedPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { finalize: async () => {}, restore: async () => {} };
      }
      throw error;
    }
    return {
      finalize: () => rm(stagedPath, { force: true }),
      restore: () => rename(stagedPath, originalPath),
    };
  }

  private resolveReference(fileUrl: string): string {
    const prefix = '/uploads/';
    const filename = fileUrl.slice(prefix.length);
    const originalPath = resolve(this.storageDirectory, filename);
    if (!fileUrl.startsWith(prefix) || !filename || filename !== basename(filename)
      || filename.includes('\\') || dirname(originalPath) !== this.storageDirectory) {
      throw new Error('Invalid invoice storage URL');
    }
    return originalPath;
  }
}
