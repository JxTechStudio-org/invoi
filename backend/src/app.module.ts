import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, StorageModule, InvoicesModule, HealthModule, MetricsModule, AuthModule],
})
export class AppModule {}
