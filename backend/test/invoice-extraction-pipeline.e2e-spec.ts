import { ModelExtraction } from '../src/extraction/claude-invoice-model';
import { invoiceExtractorFor } from '../src/extraction/extraction.module';
import { InvoiceExtractionPipeline } from '../src/extraction/invoice-extraction-pipeline';
import { ExtractionConfig } from '../src/extraction/extraction.config';
import { ZatcaQr } from '../src/extraction/zatca-qr';

const qr: ZatcaQr = {
  sellerName: 'Vendor', vatNumber: '300000000000003', timestamp: '2026-09-14T07:00:00Z',
  totalWithVat: '115.00', vatTotal: '15.00',
};
const answer: ModelExtraction = {
  isInvoice: true, invoiceCount: 1, model: 'claude-sonnet-5-5', costUsd: 0.007,
  fields: {
    vendorName: 'Vendor', invoiceNumber: '7', invoiceDate: '2026-09-14', dueDate: null, totalAmount: '115.00',
    taxAmount: '15.00', currency: 'SAR', paymentStatus: null, paymentMethod: null, customerName: null,
    taxNumber: '300000000000003', crNumber: null,
  },
};

describe('Extraction pipeline', () => {
  const setup = (modelAnswer: Partial<ModelExtraction> = {}, code: ZatcaQr | null = qr) => {
    const model = { extract: jest.fn(async () => ({ ...answer, ...modelAnswer })) };
    const readQr = jest.fn(async () => code);
    const pipeline = new InvoiceExtractionPipeline(model, readQr, () => new Date('2026-10-23T12:00:00Z'));
    return { model, readQr, pipeline };
  };
  const input = { invoiceId: 'a', content: Buffer.from('%PDF'), contentType: 'application/pdf' };

  it('reads the QR first and passes it to the model as known values', async () => {
    const { model, readQr, pipeline } = setup();
    const result = await pipeline.extract(input);
    expect(readQr).toHaveBeenCalledWith(input.content, 'application/pdf');
    expect(model.extract).toHaveBeenCalledWith(input.content, 'application/pdf', qr);
    expect(result).toMatchObject({ model: 'claude-sonnet-5-5', costUsd: 0.007, reviewReasons: [] });
    expect(result.fields.totalAmount?.toString()).toBe('115');
    expect(result.confidence).toMatchObject({ totalAmount: 1, taxAmount: 1, vendorName: 1 });
  });

  it('flags a file with several invoices (F24)', async () => {
    const { pipeline } = setup({ invoiceCount: 2 });
    expect((await pipeline.extract(input)).reviewReasons).toEqual(['multiple_invoices']);
  });

  it('fails at once, keeping the cost, when the file is not an invoice (C11)', async () => {
    const { pipeline } = setup({ isInvoice: false });
    await expect(pipeline.extract(input)).rejects.toMatchObject({
      name: 'ExtractionError', permanent: true, costUsd: 0.007, message: 'File is not an invoice',
    });
  });
});

describe('Extractor wiring', () => {
  const config = (enabled: boolean): ExtractionConfig => ({
    enabled, accountAllowlist: [], monthlyBudgetUsd: 2, model: 'claude-sonnet-5-5',
  });

  it('builds no extractor while extraction is off, so no API key is needed', () => {
    expect(invoiceExtractorFor(config(false), {})).toBeNull();
  });

  it('requires ANTHROPIC_API_KEY once extraction is on', () => {
    expect(() => invoiceExtractorFor(config(true), { ANTHROPIC_API_KEY: ' ' }))
      .toThrow('ANTHROPIC_API_KEY is required when EXTRACTION_ENABLED is true');
  });

  it('builds the pipeline when extraction is on and a key is set', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key-not-used';
    try {
      expect(invoiceExtractorFor(config(true))).toBeInstanceOf(InvoiceExtractionPipeline);
    } finally {
      if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previous;
    }
  });
});
