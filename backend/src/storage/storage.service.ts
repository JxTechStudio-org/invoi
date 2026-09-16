export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StoredFile {
  filePath?: string;
  fileUrl: string;
}

export interface StorageService {
  upload(file: Express.Multer.File): Promise<StoredFile>;
  remove(file: StoredFile): Promise<void>;
  stageRemoval(fileUrl: string): Promise<PendingFileRemoval>;
}

export interface PendingFileRemoval {
  finalize(): Promise<void>;
  restore(): Promise<void>;
}
