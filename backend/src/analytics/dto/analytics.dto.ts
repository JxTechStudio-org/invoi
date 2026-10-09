import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// this is just a setup, i will take actual list from abdullah later
export const ANALYTICS_TYPES = [
  'ap_summary',
  'dpo_aging',
  'top_suppliers',
  'invoices_review',
  'custom_question',
] as const;
export type AnalyticsType = (typeof ANALYTICS_TYPES)[number];

export class AnalyticsRequestDto {
  @IsIn(ANALYTICS_TYPES)
  type!: AnalyticsType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;
}