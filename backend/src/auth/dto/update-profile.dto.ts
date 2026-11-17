import { IsNotEmpty, IsString, Matches, MinLength, Validate, ValidateIf } from 'class-validator';
import { InvoiceAmountConstraint } from '../../invoices/dto/update-invoice.dto';

const noOuterSpaces = /^[^\s].*[^\s]$|^[^\s]$/;

/** Account settings the user may change (F19). Omitted fields stay as they are. */
export class UpdateProfileDto {
  // Same rules as at registration; required, so null is rejected rather than cleared.
  @ValidateIf((dto: UpdateProfileDto) => dto.businessName !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  @MinLength(3, { message: 'Business name must be at least 3 characters long' })
  @Matches(noOuterSpaces, { message: 'Business name must not start or end with a space' })
  businessName?: string;

  // English name as printed on invoices; null clears it.
  @ValidateIf((dto: UpdateProfileDto) => dto.businessNameEn !== undefined && dto.businessNameEn !== null)
  @IsString()
  @MinLength(3, { message: 'English business name must be at least 3 characters long' })
  @Matches(noOuterSpaces, { message: 'English business name must not start or end with a space' })
  businessNameEn?: string | null;

  // Invoices whose total or tax is above this go to review; null switches the rule off.
  @ValidateIf((dto: UpdateProfileDto) => dto.reviewAmountThreshold !== undefined && dto.reviewAmountThreshold !== null)
  @Validate(InvoiceAmountConstraint)
  reviewAmountThreshold?: string | number | null;
}
