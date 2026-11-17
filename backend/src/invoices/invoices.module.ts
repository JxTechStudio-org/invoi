import { Module } from '@nestjs/common';
import { ExtractionModule } from '../extraction/extraction.module';
import { StorageModule } from '../storage/storage.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [StorageModule, ExtractionModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
