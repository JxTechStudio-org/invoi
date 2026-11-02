import { Prisma } from '@prisma/client';
import { ModelInvoiceFields } from '../src/extraction/claude-invoice-model';
import {
  checkExtraction, cleanText, digitsOnly, parseAmount, parseDate, qrDate, toAscii,
} from '../src/extraction/invoice-fields';
import { ZatcaQr } from '../src/extraction/zatca-qr';

const NOW = new Date('2026-10-23T12:00:00Z');

/** A clean SAR invoice: every check passes. */
const printed: ModelInvoiceFields = {
  vendorName: 'شركة المثال للتجارة', invoiceNumber: 'INV-0142', invoiceDate: '2026-09-14', dueDate: '2026-10-14',
  totalAmount: '1150.00', taxAmount: '150.00', currency: 'SAR', paymentStatus: null, paymentMethod: 'bank_transfer',
  customerName: 'Owner Co', taxNumber: '300000000000003', crNumber: '1010000000',
};
const qr: ZatcaQr = {
  sellerName: 'شركة المثال للتجارة', vatNumber: '300000000000003', timestamp: '2026-09-14T07:12:00Z',
  totalWithVat: '1150.00', vatTotal: '150.00',
};
const check = (changes: Partial<ModelInvoiceFields> = {}, code: ZatcaQr | null = null) =>
  checkExtraction({ ...printed, ...changes }, code, NOW);

describe('Field normalisation (F20, F21)', () => {
  it('converts Arabic-Indic and Persian digits and Arabic separators', () => {
    expect(toAscii('١٬١٥٠٫٠٠ ۱۲۳')).toBe('1,150.00 123');
    expect(digitsOnly('٣٠٠ ٠٠٠-٠٠٠ ٠٠٠ ٠٠٣')).toBe('300000000000003');
    expect(cleanText('  شركة   المثال \n')).toBe('شركة المثال');
    expect(cleanText('   ')).toBeNull();
  });

  it.each([
    ['1150.00', '1150'], ['1,150.50', '1150.5'], ['1,150', '1150'], ['115,5', '115.5'],
    ['١٬١٥٠٫٧٥', '1150.75'], ['10.005', '10.01'], ['0', '0'],
  ])('reads amount %s as %s', (text, expected) => {
    expect((parseAmount(text) as Prisma.Decimal).toString()).toBe(expected);
  });

  it.each(['-15.00', 'SAR 15', '1.2.3', '12,34,56', '99999999999'])('rejects amount %s', text => {
    expect(parseAmount(text)).toBe('invalid');
  });

  it('reads Gregorian dates and rejects impossible or Hijri-looking ones', () => {
    expect(parseDate('2026-09-14')).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(parseDate('٢٠٢٦/٠٩/٠٥')).toEqual(new Date('2026-09-05T00:00:00Z'));
    expect(parseDate('2026-02-30')).toBe('invalid');
    expect(parseDate('14/09/2026')).toBe('invalid');
    expect(parseDate(null)).toBeNull();
  });

  it('turns a UTC QR time stamp into the Saudi calendar day', () => {
    expect(qrDate('2026-09-14T07:12:00Z')).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(qrDate('2026-09-14T22:30:00Z')).toEqual(new Date('2026-09-15T00:00:00Z'));
    expect(qrDate('2026-09-14T01:30:00+03:00')).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(qrDate('2026-09-14 23:59:00')).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(qrDate('not a time')).toBeNull();
  });
});

describe('Field checks and scores (B6)', () => {
  it('scores a clean invoice 1.0 on every extracted field', () => {
    const { fields, confidence } = check();
    expect(fields).toMatchObject({
      vendorName: 'شركة المثال للتجارة', invoiceDate: new Date('2026-09-14T00:00:00Z'), currency: 'SAR',
      paymentStatus: null, paymentMethod: 'bank_transfer', taxNumber: '300000000000003',
    });
    expect(fields.totalAmount?.toString()).toBe('1150');
    expect(Object.values(confidence).every(score => score === 1)).toBe(true);
    expect(confidence).not.toHaveProperty('paymentStatus');
  });

  it('prefers exact QR values and scores them 1.0 (B7)', () => {
    const { fields, confidence } = check({ vendorName: 'Example Trading', totalAmount: null, invoiceDate: null }, qr);
    expect(fields.vendorName).toBe('شركة المثال للتجارة');
    expect(fields.totalAmount?.toString()).toBe('1150');
    expect(fields.invoiceDate).toEqual(new Date('2026-09-14T00:00:00Z'));
    expect(confidence).toMatchObject({ vendorName: 1, totalAmount: 1, invoiceDate: 1, taxAmount: 1 });
  });

  it.each([
    ['too short', '30000000000003'], ['wrong first digit', '100000000000003'], ['wrong last digit', '300000000000001'],
  ])('scores taxNumber 0.5 when it is %s', (_label, taxNumber) => {
    expect(check({ taxNumber, currency: 'USD' }).confidence.taxNumber).toBe(0.5);
  });

  it('scores taxNumber 0.5 when the printed number differs from the QR', () => {
    const { fields, confidence } = check({ taxNumber: '311111111111113' }, qr);
    expect(fields.taxNumber).toBe('300000000000003');
    expect(confidence.taxNumber).toBe(0.5);
  });

  describe('VAT check (SAR + valid Saudi VAT number only, amended 22 Oct)', () => {
    it.each([
      ['exact 15%', '1150.00', '150.00'], ['within 1 SAR', '115.00', '15.50'], ['within 1%', '115000.00', '15100.00'],
      ['zero-rated', '1000.00', '0.00'],
    ])('accepts %s', (_label, totalAmount, taxAmount) => {
      const { confidence } = check({ totalAmount, taxAmount });
      expect(confidence).toMatchObject({ totalAmount: 1, taxAmount: 1 });
    });

    it.each([['5% VAT', '1050.00', '50.00'], ['just outside 1 SAR', '115.00', '16.10']])(
      'scores both 0.6 for %s', (_label, totalAmount, taxAmount) => {
        expect(check({ totalAmount, taxAmount }).confidence).toMatchObject({ totalAmount: 0.6, taxAmount: 0.6 });
      },
    );

    it.each([
      ['another currency', { currency: 'USD' as const }],
      ['no VAT number', { taxNumber: null }],
      ['an invalid VAT number', { taxNumber: '12345' }],
    ])('skips the 15%% check with no penalty for %s', (_label, changes) => {
      const { confidence } = check({ totalAmount: '1050.00', taxAmount: '50.00', ...changes });
      expect(confidence).toMatchObject({ totalAmount: 1, taxAmount: 1 });
    });

    it('scores both 0.6 when printed totals differ from the QR, whatever the currency', () => {
      const { fields, confidence } = check({ currency: 'USD', totalAmount: '1100.00' }, qr);
      expect(fields.totalAmount?.toString()).toBe('1150');
      expect(confidence).toMatchObject({ totalAmount: 0.6, taxAmount: 0.6 });
    });
  });

  it('scores a zero total 0.5', () => {
    expect(check({ totalAmount: '0', taxAmount: '0' }).confidence.totalAmount).toBe(0.5);
  });

  it('leaves unreadable, future or pre-2000 dates empty with score 0.5, and flags a due date before the invoice date', () => {
    expect(check({ dueDate: '1448-03-12' })).toMatchObject({ fields: { dueDate: null }, confidence: { dueDate: 0.5 } });
    expect(check({ dueDate: '14/10/2026' })).toMatchObject({ fields: { dueDate: null }, confidence: { dueDate: 0.5 } });
    expect(check({ invoiceDate: '2026-12-01', dueDate: null }))
      .toMatchObject({ fields: { invoiceDate: null }, confidence: { invoiceDate: 0 } });
    expect(check({ dueDate: '2026-09-01' }).confidence.dueDate).toBe(0.5);
    expect(check({ dueDate: '2027-03-01' }).confidence.dueDate).toBe(1);
  });

  it('scores crNumber 0.7 unless it has 10 digits', () => {
    expect(check({ crNumber: '10100000' }).confidence.crNumber).toBe(0.7);
    expect(check({ crNumber: '١٠١٠٠٠٠٠٠٠' }).confidence.crNumber).toBe(1);
  });

  it('scores missing required fields 0 and leaves other missing fields unscored', () => {
    const { confidence } = check({ vendorName: null, totalAmount: null, invoiceDate: null, dueDate: null, crNumber: null });
    expect(confidence).toMatchObject({ vendorName: 0, totalAmount: 0, invoiceDate: 0 });
    expect(confidence).not.toHaveProperty('dueDate');
    expect(confidence).not.toHaveProperty('crNumber');
  });

  it('keeps the lowest score when several checks fail on one field', () => {
    expect(check({ totalAmount: 'abc' }).confidence.totalAmount).toBe(0);
    expect(check({ taxAmount: 'abc' }).confidence.taxAmount).toBe(0.5);
  });
});
