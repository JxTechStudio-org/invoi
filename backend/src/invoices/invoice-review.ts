import { Invoice, InvoiceStatus, User } from '@prisma/client';

type ReviewInput = Pick<Invoice,
  'status' | 'extractionConfidence' | 'customerName' | 'totalAmount' | 'taxAmount'
>;

type ReviewAccount = {
  businessName: User['businessName'] | null;
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

  const customer = normalizeCustomerName(invoice.customerName ?? '');
  const business = normalizeCustomerName(account.businessName ?? '');
  if (customer && business && customer !== business) {
    reasons.push('customer_name_mismatch');
  }

  const threshold = account.reviewAmountThreshold;
  if (threshold !== null
    && (invoice.totalAmount?.greaterThan(threshold) || invoice.taxAmount?.greaterThan(threshold))) {
    reasons.push('amount_threshold_exceeded');
  }

  return {
    status: reasons.length ? InvoiceStatus.needs_review : invoice.status,
    needsReviewReason: reasons.length ? reasons.join(',') : null,
  };
}
