import { Invoice } from '@prisma/client';

export const INVOICE_EXTRACTOR = Symbol('INVOICE_EXTRACTOR');

/** The 12 fields extraction fills (section 8 of the technical documentation). */
export const EXTRACTED_FIELDS = [
  'vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'taxAmount',
  'currency', 'paymentStatus', 'paymentMethod', 'customerName', 'taxNumber', 'crNumber',
] as const;

export type ExtractedField = typeof EXTRACTED_FIELDS[number];
export type ExtractedFields = Pick<Invoice, ExtractedField>;

export interface ExtractionInput {
  invoiceId: string;
  content: Buffer;
  contentType: string;
}

export interface ExtractionResult {
  /** Missing keys are left untouched; null means "not on the invoice". */
  fields: Partial<ExtractedFields>;
  /** Per-field scores 0–1 from the code checks (B6). */
  confidence: Partial<Record<ExtractedField, number>>;
  /** Model ID used, or `zatca_qr` when the QR code alone was enough (E17). */
  model: string;
  costUsd: number;
}

/** Reads one invoice file. Implemented in later Phase 1 tasks (QR reader, model client). */
export interface InvoiceExtractor {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/**
 * Thrown by an extractor to control retries. `permanent` skips the remaining attempts,
 * e.g. for a file that is clearly not an invoice (C11). `costUsd` is spend already incurred.
 */
export class ExtractionError extends Error {
  readonly permanent: boolean;
  readonly costUsd: number;

  constructor(message: string, options: { permanent?: boolean; costUsd?: number } = {}) {
    super(message);
    this.name = 'ExtractionError';
    this.permanent = options.permanent ?? false;
    this.costUsd = options.costUsd ?? 0;
  }
}
