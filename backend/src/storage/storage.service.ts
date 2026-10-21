import { extname } from 'node:path';
import type { Readable } from 'node:stream';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StoredFile {
  filePath?: string;
  fileUrl: string;
}

export interface StorageService {
  upload(file: Express.Multer.File): Promise<StoredFile>;
  remove(file: StoredFile): Promise<void>;
  stageRemoval(fileUrl: string): Promise<PendingFileRemoval>;
  /** Resolves to null when the referenced file no longer exists. */
  download(fileUrl: string): Promise<StoredFileContent | null>;
}

export interface StoredFileContent {
  stream: Readable;
  contentType: string;
  contentLength?: number;
}

const contentTypesByExtension: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

// Derived from the stored name (uploads only accept these types), never from stored metadata.
export function contentTypeFor(reference: string): string {
  return contentTypesByExtension[extname(reference).toLowerCase()] ?? 'application/octet-stream';
}

export interface PendingFileRemoval {
  finalize(): Promise<void>;
  restore(): Promise<void>;
}
