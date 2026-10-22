import { PendingFileRemoval, StorageService, StoredFile, StoredFileContent } from './storage.service';

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

  download(fileUrl: string): Promise<StoredFileContent | null> {
    return this.storageFor(fileUrl).download(fileUrl);
  }

  private storageFor(fileUrl: string): StorageService {
    return fileUrl.startsWith('/uploads/') ? this.legacyLocalStorage : this.primaryStorage;
  }
}
