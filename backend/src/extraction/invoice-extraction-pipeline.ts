import { MULTIPLE_INVOICES_REASON } from '../invoices/invoice-review';
import { ClaudeInvoiceModel } from './claude-invoice-model';
import { checkExtraction } from './invoice-fields';
import { ExtractionError, ExtractionInput, ExtractionResult, InvoiceExtractor } from './invoice-extractor';
import { readZatcaQr } from './zatca-qr-reader';
import { ZatcaQr } from './zatca-qr';

/**
 * The extraction pipeline (section 8): read the ZATCA QR, ask the model for the rest with the
 * QR values as known, then normalise and score every field with code checks.
 */
export class InvoiceExtractionPipeline implements InvoiceExtractor {
  constructor(
    private readonly model: Pick<ClaudeInvoiceModel, 'extract'>,
    private readonly readQr: (content: Buffer, contentType: string) => Promise<ZatcaQr | null> = readZatcaQr,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const qr = await this.readQr(input.content, input.contentType);
    const answer = await this.model.extract(input.content, input.contentType, qr);
    if (!answer.isInvoice) {
      // A file that is clearly not an invoice fails at once, without retries (C11).
      throw new ExtractionError('File is not an invoice', { permanent: true, costUsd: answer.costUsd });
    }

    const { fields, confidence } = checkExtraction(answer.fields, qr, this.now());
    return {
      fields,
      confidence,
      model: answer.model,
      costUsd: answer.costUsd,
      reviewReasons: answer.invoiceCount > 1 ? [MULTIPLE_INVOICES_REASON] : [],
    };
  }
}
