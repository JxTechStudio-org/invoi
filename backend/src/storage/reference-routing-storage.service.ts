import { PendingFileRemoval, StorageService, StoredFile } from './storage.service';

export class ReferenceRoutingStorageService implements StorageService {
  constructor(
    private readonly primaryStorage: StorageService,
    private readonly legacyLocalStorage: StorageService,
  ) {}

  upload(file: Express.Multer.File): Promise<StoredFile> {
    return this.primaryStorage.upload(file);
  }

  remove(file: StoredFile): Promise<void> {
    return this.storageFor(file.fileUrl).remove(file);
  }

  stageRemoval(fileUrl: string): Promise<PendingFileRemoval> {
    return this.storageFor(fileUrl).stageRemoval(fileUrl);
  }

  private storageFor(fileUrl: string): StorageService {
    return fileUrl.startsWith('/uploads/') ? this.legacyLocalStorage : this.primaryStorage;
  }
}
