import { Invoice, Prisma } from '@prisma/client';
import { evaluateInvoiceReview, normalizeCustomerName } from '../src/invoices/invoice-review';
import { invoiceFixture } from './fixtures/invoice';

describe('Invoice review rules', () => {
  const review = (changes: Partial<Invoice> = {}, businessName: string | null = 'Demo Business') =>
    evaluateInvoiceReview(invoiceFixture(changes), businessName);

  it('accepts confidence exactly at 90 percent', () => {
    expect(review({ extractionConfidence: { vendorName: 0.9, totalAmount: 1 } }))
      .toEqual({ status: 'completed', needsReviewReason: null });
  });

  it.each([0, 0.5, 0.899999])('flags one low-confidence field at %s', score => {
    expect(review({ extractionConfidence: { vendorName: 0.99, totalAmount: score } }))
      .toEqual({ status: 'needs_review', needsReviewReason: 'low_confidence' });
  });

  it.each([null, {}, { vendorName: null }])('does not invent missing confidence scores: %p', confidence => {
    expect(review({ extractionConfidence: confidence }).needsReviewReason).toBeNull();
  });

  it.each([
    ['0', '0'], ['1.00', '9999.99'], ['9999999999.99', '9999999999.99'],
  ])('does not infer amount reasonableness from total %s and tax %s', (total, tax) => {
    expect(review({ totalAmount: new Prisma.Decimal(total), taxAmount: new Prisma.Decimal(tax) })
      .needsReviewReason).toBeNull();
  });

  it.each([
    ['  DEMO,   Business. ', 'demo business'],
    ['شركة،  المثال.', ' شركة المثال '],
    ['Cafe\u0301 Business', 'CAFÉ BUSINESS'],
  ])('matches normalized names %s and %s', (customer, business) => {
    expect(review({ customerName: customer }, business).needsReviewReason).toBeNull();
    expect(normalizeCustomerName(customer)).toBe(normalizeCustomerName(business));
  });

  it.each([
    ['Other Business', 'Demo Business'],
    ['شركة المثال', 'Example Company'],
  ])('flags different names without translation: %s / %s', (customer, business) => {
    expect(review({ customerName: customer }, business).needsReviewReason).toBe('customer_name_mismatch');
  });

  it.each([
    [null, 'Demo Business'], ['', 'Demo Business'], ['  ', 'Demo Business'],
    ['Demo Business', null], [null, null],
  ])('does not infer a mismatch from absent names: %p / %p', (customer, business) => {
    expect(review({ customerName: customer }, business).needsReviewReason).toBeNull();
  });

  it('preserves all reasons in deterministic order', () => {
    expect(review({
      extractionConfidence: { vendorName: 0.4, totalAmount: 0.8 },
      customerName: 'Other',
    })).toEqual({
      status: 'needs_review',
      needsReviewReason: 'low_confidence,customer_name_mismatch',
    });
  });

  it('handles absent amounts without inventing validation failures', () => {
    expect(review({ totalAmount: null, taxAmount: null }).needsReviewReason).toBeNull();
  });

  it.each(['processing', 'completed', 'needs_review'] as const)(
    'does not infer extraction completion from valid data in state %s', status => {
      expect(review({ status, needsReviewReason: 'customer_name_mismatch' }))
        .toEqual({ status, needsReviewReason: null });
    },
  );

  it('flags failed rules even when the invoice is processing', () => {
    expect(review({ status: 'processing', customerName: 'Other Business' }).status)
      .toBe('needs_review');
  });
});
