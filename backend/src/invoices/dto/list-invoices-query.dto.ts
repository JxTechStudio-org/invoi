import { InvoiceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ListInvoicesQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
