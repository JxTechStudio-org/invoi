import { Invoice, InvoiceStatus, Prisma, User } from '@prisma/client';

type ReviewInput = Pick<Invoice,
  'status' | 'extractionConfidence' | 'customerName' | 'totalAmount' | 'taxAmount' | 'needsReviewReason'
>;

// Set by the user ("report an error"); only approval clears it.
export const USER_FLAGGED_REASON = 'user_flagged';
// Set when every extraction attempt failed (C11); the user fills the fields in by hand.
export const EXTRACTION_FAILED_REASON = 'extraction_failed';
// The file held more than one invoice; only the first was extracted (F24). Kept until approval.
export const MULTIPLE_INVOICES_REASON = 'multiple_invoices';
// Reasons the rules below cannot recompute, so they survive edits until a human approves.
const STICKY_REASONS = [USER_FLAGGED_REASON, MULTIPLE_INVOICES_REASON];

const TAX_SHARE_LIMIT = new Prisma.Decimal('0.3');

export function parseReviewReasons(reasons: string | null): string[] {
  return reasons ? reasons.split(',').filter(Boolean) : [];
}

type ReviewAccount = {
  businessName: User['businessName'] | null;
  businessNameEn?: User['businessNameEn'];
  reviewAmountThreshold: User['reviewAmountThreshold'];
};

export function normalizeCustomerName(name: string): string {
  return name.normalize('NFC').toLowerCase().replace(/\p{P}/gu, ' ').replace(/\s+/gu, ' ').trim();
}

export function evaluateInvoiceReview(invoice: ReviewInput, account: ReviewAccount): {
  status: InvoiceStatus;
  needsReviewReason: string | null;
} {
  const reasons: string[] = [];
  const confidence = invoice.extractionConfidence;
  if (confidence && typeof confidence === 'object' && !Array.isArray(confidence)
    && Object.values(confidence).some(score => typeof score === 'number' && score < 0.9)) {
    reasons.push('low_confidence');
  }

  // Either the Arabic or the English business name may be printed on the invoice (F19).
  const customer = normalizeCustomerName(invoice.customerName ?? '');
  const businessNames = [account.businessName, account.businessNameEn]
    .map(name => normalizeCustomerName(name ?? '')).filter(Boolean);
  if (customer && businessNames.length && !businessNames.includes(customer)) {
    reasons.push('customer_name_mismatch');
  }

  const threshold = account.reviewAmountThreshold;
  if (threshold !== null
    && (invoice.totalAmount?.greaterThan(threshold) || invoice.taxAmount?.greaterThan(threshold))) {
    reasons.push('amount_threshold_exceeded');
  }

  // B8: a zero total goes to review but can still be approved; tax above 30% of the total
  // is checked on every invoice, whatever its currency or VAT number.
  const total = invoice.totalAmount;
  if (total?.isZero()) reasons.push('zero_total');
  if (total && invoice.taxAmount?.greaterThan(total.mul(TAX_SHARE_LIMIT))) {
    reasons.push('tax_over_30_percent');
  }

  for (const sticky of STICKY_REASONS) {
    if (parseReviewReasons(invoice.needsReviewReason).includes(sticky)) reasons.push(sticky);
  }

  return {
    status: reasons.length ? InvoiceStatus.needs_review : invoice.status,
    needsReviewReason: reasons.length ? reasons.join(',') : null,
  };
}

// Reasons evaluateInvoiceReview derives from the invoice and the account settings.
const RULE_REASONS = [
  'low_confidence', 'customer_name_mismatch', 'amount_threshold_exceeded', 'zero_total', 'tax_over_30_percent',
];

/**
 * Review reasons after the account settings changed: rule reasons are recomputed, every
 * other reason (user_flagged, multiple_invoices, extraction_failed, anything unknown) is
 * kept exactly as it was. The status is not part of the answer: it stays needs_review.
 */
export function recheckReviewReasons(invoice: ReviewInput, account: ReviewAccount): string | null {
  const ruled = parseReviewReasons(evaluateInvoiceReview({ ...invoice, needsReviewReason: null }, account).needsReviewReason);
  const kept = parseReviewReasons(invoice.needsReviewReason).filter(reason => !RULE_REASONS.includes(reason));
  return [...ruled, ...kept].join(',') || null;
}
