import { InvoiceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, Matches } from 'class-validator';

export class ListInvoicesQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString()
  date?: string;
}
