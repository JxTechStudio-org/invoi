import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { StorageService, StoredFile } from './storage.service';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly storageDirectory = resolve(
    process.env.STORAGE_LOCAL_PATH ?? 'uploads',
  );

  async upload(file: Express.Multer.File): Promise<StoredFile> {
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
}
