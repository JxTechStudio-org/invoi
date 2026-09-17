import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { ReferenceRoutingStorageService } from './reference-routing-storage.service';
import {
  rustFsConfigFromEnvironment,
  RustFsStorageService,
} from './rustfs-storage.service';
import { STORAGE_SERVICE, StorageService } from './storage.service';

export async function configuredStorageService(
  localStorage: LocalStorageService,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<StorageService> {
  const driver = environment.STORAGE_DRIVER ?? 'local';
  if (driver === 'local') return localStorage;
  if (driver === 'rustfs') {
    const storage = new RustFsStorageService(rustFsConfigFromEnvironment(environment));
    await storage.initialize();
    return new ReferenceRoutingStorageService(storage, localStorage);
  }
  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}

@Module({
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [LocalStorageService],
      useFactory: configuredStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
