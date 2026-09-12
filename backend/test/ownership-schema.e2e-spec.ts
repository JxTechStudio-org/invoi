import { InvoiceStatus, Prisma } from '@prisma/client';

describe('Ownership schema', () => {
  const user = Prisma.dmmf.datamodel.models.find((model) => model.name === 'User')!;
  const invoice = Prisma.dmmf.datamodel.models.find((model) => model.name === 'Invoice')!;

  it('requires account identity and password hash with unique email', () => {
    expect(user).toBeDefined();
    for (const name of ['id', 'email', 'passwordHash', 'businessName', 'createdAt']) {
      expect(user.fields.find((field) => field.name === name)).toMatchObject({
        isRequired: true,
      });
    }
    expect(user.fields.find((field) => field.name === 'email')).toMatchObject({
      isUnique: true,
    });
    expect(user.fields.some((field) => field.name === 'password')).toBe(false);
  });

  it('requires every invoice to belong to one user through a foreign key', () => {
    expect(user.fields.find((field) => field.name === 'invoices')).toMatchObject({
      kind: 'object', type: 'Invoice', isList: true,
    });
    expect(invoice.fields.find((field) => field.name === 'userId')).toMatchObject({
      type: 'String', isRequired: true,
    });
    expect(invoice.fields.find((field) => field.name === 'user')).toMatchObject({
      kind: 'object', type: 'User', isList: false, isRequired: true,
      relationFromFields: ['userId'], relationToFields: ['id'],
      relationOnDelete: 'Restrict',
    });
  });

  it.each([
    ['id', 'String', true], ['userId', 'String', true], ['fileUrl', 'String', true],
    ['status', 'InvoiceStatus', true], ['vendorName', 'String', false],
    ['invoiceNumber', 'String', false], ['invoiceDate', 'DateTime', false],
    ['dueDate', 'DateTime', false], ['totalAmount', 'Decimal', false],
    ['taxAmount', 'Decimal', false], ['currency', 'String', false],
    ['paymentStatus', 'String', false], ['paymentMethod', 'String', false],
    ['customerName', 'String', false], ['taxNumber', 'String', false],
    ['crNumber', 'String', false], ['extractionConfidence', 'Json', false],
    ['needsReviewReason', 'String', false], ['createdAt', 'DateTime', true],
    ['updatedAt', 'DateTime', true],
  ])('defines Invoice.%s with the intended type and nullability', (name, type, isRequired) => {
    expect(invoice.fields.find((field) => field.name === name)).toMatchObject({
      type, isRequired,
    });
  });

  it('supports the complete lifecycle without adding outgoing-invoice fields', () => {
    expect(InvoiceStatus).toEqual({
      processing: 'processing', completed: 'completed', needs_review: 'needs_review',
    });
    for (const name of ['invoiceType', 'sellerName', 'amount', 'needsReview']) {
      expect(invoice.fields.some((field) => field.name === name)).toBe(false);
    }
  });
});
