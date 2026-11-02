import {
  isFilelessReference, noOpRemoval, PendingFileRemoval, StorageService, StoredFile, StoredFileContent,
} from './storage.service';

export class ReferenceRoutingStorageService implements StorageService {
  constructor(
    private readonly primaryStorage: StorageService,
    private readonly legacyLocalStorage: StorageService,
  ) {}

  upload(file: Express.Multer.File): Promise<StoredFile> {
    return this.primaryStorage.upload(file);
  }

  async remove(file: StoredFile): Promise<void> {
    if (isFilelessReference(file.fileUrl)) return;
    return this.storageFor(file.fileUrl).remove(file);
  }

  async stageRemoval(fileUrl: string): Promise<PendingFileRemoval> {
    if (isFilelessReference(fileUrl)) return noOpRemoval();
    return this.storageFor(fileUrl).stageRemoval(fileUrl);
  }

  async download(fileUrl: string): Promise<StoredFileContent | null> {
    if (isFilelessReference(fileUrl)) return null;
    return this.storageFor(fileUrl).download(fileUrl);
  }

  private storageFor(fileUrl: string): StorageService {
    return fileUrl.startsWith('/uploads/') ? this.legacyLocalStorage : this.primaryStorage;
  }
}
