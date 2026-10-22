import { Prisma } from '@prisma/client';
import { ModelInvoiceFields } from './claude-invoice-model';
import { EXTRACTED_FIELDS, ExtractedField, ExtractedFields } from './invoice-extractor';
import { ZatcaQr } from './zatca-qr';

/** Fields a human must see before an invoice can be completed; missing ones score 0 (B6). */
const REQUIRED_FIELDS: ExtractedField[] = ['vendorName', 'totalAmount', 'invoiceDate'];
const VAT_RATE = new Prisma.Decimal('0.15');
const MAX_AMOUNT = new Prisma.Decimal('9999999999.99');
const EARLIEST_DATE = Date.UTC(2000, 0, 1);
// QR time stamps are UTC; the printed invoice date is Saudi local time (UTC+3, no daylight saving).
const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000;

const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٫': '.', '٬': ',',
};

/** Arabic-Indic and Persian digits, the Arabic decimal and thousands separators → ASCII (F21). */
export function toAscii(text: string): string {
  return text.replace(/[٠-٩۰-۹٫٬]/g, char => ARABIC_DIGITS[char]);
}

export function cleanText(value: string | null): string | null {
  const text = value?.normalize('NFC').replace(/\s+/g, ' ').trim();
  return text ? text : null;
}

export function digitsOnly(value: string | null): string | null {
  const digits = value ? toAscii(value).replace(/[\s-]/g, '') : '';
  return digits ? digits : null;
}

/** A non-negative amount with up to two decimals, or 'invalid' when it can't be read safely. */
export function parseAmount(value: string | null): Prisma.Decimal | null | 'invalid' {
  if (value === null) return null;
  let text = toAscii(value).replace(/\s/g, '');
  if (!text) return null;
  if (text.includes(',') && text.includes('.')) text = text.replace(/,/g, '');
  else if (/^\d{1,3}(,\d{3})+$/.test(text)) text = text.replace(/,/g, '');
  else if (/^\d+,\d{1,2}$/.test(text)) text = text.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text)) return 'invalid';
  const amount = new Prisma.Decimal(text).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return amount.greaterThan(MAX_AMOUNT) ? 'invalid' : amount;
}

/** A Gregorian YYYY-MM-DD date at UTC midnight, or 'invalid' (F20: Hijri is never converted). */
export function parseDate(value: string | null): Date | null | 'invalid' {
  if (value === null) return null;
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(toAscii(value).trim());
  if (!match) return 'invalid';
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? date : 'invalid';
}

/** The Saudi calendar day of a ZATCA time stamp (UTC when it carries a zone, else as written). */
export function qrDate(timestamp: string): Date | null {
  const text = toAscii(timestamp).trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    const instant = Date.parse(text);
    if (Number.isNaN(instant)) return null;
    const local = new Date(instant + SAUDI_OFFSET_MS);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  }
  const parsed = parseDate(text.slice(0, 10));
  return parsed instanceof Date ? parsed : null;
}

/** 15 digits, starting and ending with 3. */
export function isSaudiVatNumber(value: string | null): boolean {
  return value !== null && /^3\d{13}3$/.test(value);
}

export interface CheckedExtraction {
  fields: ExtractedFields;
  /** Per-field scores 0–1 from code checks; below 0.9 sends the invoice to review (B6). */
  confidence: Partial<Record<ExtractedField, number>>;
}

/**
 * Normalises the model's answer, lets decoded ZATCA QR values win (B7), and scores each field
 * with the checks in section 8 of the technical documentation (B6, amended 22 Oct). The
 * model's own view is never used as a score.
 */
export function checkExtraction(model: ModelInvoiceFields, qr: ZatcaQr | null, now: Date): CheckedExtraction {
  const confidence: Partial<Record<ExtractedField, number>> = {};
  const lower = (field: ExtractedField, score: number) => {
    confidence[field] = Math.min(confidence[field] ?? 1, score);
  };

  // Model values, normalised. Unreadable amounts and dates are left empty with a low score.
  const readAmount = (field: 'totalAmount' | 'taxAmount') => {
    const amount = parseAmount(model[field]);
    if (amount === 'invalid') { lower(field, 0.5); return null; }
    return amount;
  };
  const readDate = (field: 'invoiceDate' | 'dueDate') => {
    const date = parseDate(model[field]);
    if (date === 'invalid') { lower(field, 0.5); return null; }
    return date;
  };
  const modelValues = {
    vendorName: cleanText(model.vendorName),
    taxNumber: digitsOnly(model.taxNumber),
    invoiceDate: readDate('invoiceDate'),
    totalAmount: readAmount('totalAmount'),
    taxAmount: readAmount('taxAmount'),
  };

  // QR values (exact when present and readable).
  const qrTotal = qr ? parseAmount(qr.totalWithVat) : null;
  const qrVat = qr ? parseAmount(qr.vatTotal) : null;
  const qrValues = {
    vendorName: qr ? cleanText(qr.sellerName) : null,
    taxNumber: qr ? digitsOnly(qr.vatNumber) : null,
    invoiceDate: qr ? qrDate(qr.timestamp) : null,
    totalAmount: qrTotal instanceof Prisma.Decimal ? qrTotal : null,
    taxAmount: qrVat instanceof Prisma.Decimal ? qrVat : null,
  };

  const fields: ExtractedFields = {
    vendorName: qrValues.vendorName ?? modelValues.vendorName,
    invoiceNumber: cleanText(model.invoiceNumber),
    invoiceDate: qrValues.invoiceDate ?? modelValues.invoiceDate,
    dueDate: readDate('dueDate'),
    totalAmount: qrValues.totalAmount ?? modelValues.totalAmount,
    taxAmount: qrValues.taxAmount ?? modelValues.taxAmount,
    currency: model.currency,
    paymentStatus: model.paymentStatus,
    paymentMethod: model.paymentMethod,
    customerName: cleanText(model.customerName),
    taxNumber: qrValues.taxNumber ?? modelValues.taxNumber,
    crNumber: digitsOnly(model.crNumber),
  };

  for (const field of EXTRACTED_FIELDS) {
    if (fields[field] !== null) lower(field, 1);
  }

  // taxNumber: 15 digits starting and ending with 3; the printed number must match the QR.
  if (fields.taxNumber !== null && !isSaudiVatNumber(fields.taxNumber)) lower('taxNumber', 0.5);
  if (qrValues.taxNumber && modelValues.taxNumber && qrValues.taxNumber !== modelValues.taxNumber) {
    lower('taxNumber', 0.5);
  }

  // VAT: printed totals must match the QR; the 15% check runs only for SAR invoices from a
  // vendor with a valid Saudi VAT number, and accepts ≈15% or exactly 0 (B6, amended 22 Oct).
  const mismatch = (a: Prisma.Decimal | null, b: Prisma.Decimal | null) => a !== null && b !== null && !a.equals(b);
  let vatOk = !mismatch(qrValues.totalAmount, modelValues.totalAmount)
    && !mismatch(qrValues.taxAmount, modelValues.taxAmount);
  const { totalAmount: total, taxAmount: tax } = fields;
  if (fields.currency === 'SAR' && isSaudiVatNumber(fields.taxNumber) && total !== null && tax !== null && !tax.isZero()) {
    const expected = total.minus(tax).mul(VAT_RATE);
    const tolerance = Prisma.Decimal.max(1, expected.mul('0.01'));
    if (tax.minus(expected).abs().greaterThan(tolerance)) vatOk = false;
  }
  if (!vatOk) {
    lower('taxAmount', 0.6);
    lower('totalAmount', 0.6);
  }

  if (total !== null && !total.greaterThan(0)) lower('totalAmount', 0.5);

  // Dates: after 2000 and not in the future, else left empty; due date not before invoice date.
  const latest = now.getTime() + 24 * 60 * 60 * 1000;
  for (const field of ['invoiceDate', 'dueDate'] as const) {
    const date = fields[field];
    if (date && (date.getTime() < EARLIEST_DATE || (field === 'invoiceDate' && date.getTime() > latest))) {
      fields[field] = null;
      confidence[field] = 0.5;
    }
  }
  if (fields.invoiceDate && fields.dueDate && fields.dueDate < fields.invoiceDate) lower('dueDate', 0.5);

  if (fields.crNumber !== null && !/^\d{10}$/.test(fields.crNumber)) lower('crNumber', 0.7);

  for (const field of REQUIRED_FIELDS) {
    if (fields[field] === null) confidence[field] = 0;
  }

  return { fields, confidence };
}
