import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'invoiceAmount', async: false })
class InvoiceAmountConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (typeof value === 'string' || typeof value === 'number')
      && /^\d{1,10}(?:\.\d{1,2})?$/.test(String(value));
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be a nonnegative decimal with at most 10 integer digits and 2 decimal places`;
  }
}

const invoiceDatePattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  vendorName?: string | null;

  @IsOptional()
  @IsString()
  invoiceNumber?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(invoiceDatePattern)
  invoiceDate?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(invoiceDatePattern)
  dueDate?: string | null;

  @IsOptional()
  @Validate(InvoiceAmountConstraint)
  totalAmount?: string | number | null;

  @IsOptional()
  @Validate(InvoiceAmountConstraint)
  taxAmount?: string | number | null;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsOptional()
  @IsString()
  paymentStatus?: string | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string | null;

  @IsOptional()
  @IsString()
  customerName?: string | null;

  @IsOptional()
  @IsString()
  taxNumber?: string | null;

  @IsOptional()
  @IsString()
  crNumber?: string | null;
}
