import { Invoice, Prisma } from '@prisma/client';

export function invoiceFixture(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'test-invoice',
    userId: 'test-owner',
    fileUrl: '/uploads/test-invoice.pdf',
    status: 'completed',
    vendorName: 'Example Vendor',
    invoiceNumber: 'INV-001',
    invoiceDate: new Date('2026-09-12T00:00:00Z'),
    dueDate: new Date('2026-10-12T00:00:00Z'),
    totalAmount: new Prisma.Decimal('100.00'),
    taxAmount: new Prisma.Decimal('15.00'),
    currency: 'SAR',
    paymentStatus: 'unpaid',
    paymentMethod: 'bank transfer',
    customerName: 'Demo Business',
    taxNumber: '001234567890123',
    crNumber: '0012345678',
    extractionConfidence: null,
    needsReviewReason: null,
    createdAt: new Date('2026-09-12T09:00:00Z'),
    updatedAt: new Date('2026-09-12T09:00:00Z'),
    ...overrides,
  };
}
