export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StoredFile {
  filePath: string;
  fileUrl: string;
}

export interface StorageService {
  upload(file: Express.Multer.File): Promise<StoredFile>;
  remove(file: StoredFile): Promise<void>;
}
