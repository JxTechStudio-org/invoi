import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.service';

@Module({
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      useExisting: LocalStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
