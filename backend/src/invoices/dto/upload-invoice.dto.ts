import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';

export class UploadInvoiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'userId must contain a non-whitespace character' })
  userId!: string;
}
