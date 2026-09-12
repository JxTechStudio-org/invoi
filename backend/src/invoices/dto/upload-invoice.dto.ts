import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UploadInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'userId must contain a non-whitespace character' })
  userId!: string;
}
