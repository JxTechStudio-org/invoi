import { Invoice, InvoiceStatus } from '@prisma/client';

type ReviewInput = Pick<Invoice,
  'status' | 'extractionConfidence' | 'customerName'
>;

export function normalizeCustomerName(name: string): string {
  return name.normalize('NFC').toLowerCase().replace(/\p{P}/gu, ' ').replace(/\s+/gu, ' ').trim();
}

export function evaluateInvoiceReview(invoice: ReviewInput, businessName: string | null): {
  status: InvoiceStatus;
  needsReviewReason: string | null;
} {
  const reasons: string[] = [];
  const confidence = invoice.extractionConfidence;
  if (confidence && typeof confidence === 'object' && !Array.isArray(confidence)
    && Object.values(confidence).some(score => typeof score === 'number' && score < 0.9)) {
    reasons.push('low_confidence');
  }

  const customer = normalizeCustomerName(invoice.customerName ?? '');
  const business = normalizeCustomerName(businessName ?? '');
  if (customer && business && customer !== business) {
    reasons.push('customer_name_mismatch');
  }

  return {
    status: reasons.length ? InvoiceStatus.needs_review : invoice.status,
    needsReviewReason: reasons.length ? reasons.join(',') : null,
  };
}
