import Anthropic from '@anthropic-ai/sdk';
import { ClaudeInvoiceModel, costOf } from '../src/extraction/claude-invoice-model';
import { ExtractionError } from '../src/extraction/invoice-extractor';

// Tests never call the paid API: the SDK client is replaced by a fake (CI never spends budget).
const answer = {
  isInvoice: true, invoiceCount: 1,
  vendorName: 'شركة المثال للتجارة', invoiceNumber: 'INV-2026-0142', invoiceDate: '2026-09-14',
  dueDate: null, totalAmount: '1150.00', taxAmount: '150.00', currency: 'SAR',
  paymentStatus: null, paymentMethod: 'bank_transfer', customerName: 'Owner Co',
  taxNumber: '300000000000003', crNumber: '1010000000',
};

function message(overrides: Partial<Anthropic.Beta.BetaMessage> = {}): Anthropic.Beta.BetaMessage {
  return {
    id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5',
    content: [{ type: 'text', text: JSON.stringify(answer), citations: null }],
    stop_reason: 'end_turn', stop_sequence: null, stop_details: null,
    usage: { input_tokens: 2000, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, iterations: null },
    ...overrides,
  } as unknown as Anthropic.Beta.BetaMessage;
}

function setup(model: 'claude-sonnet-5-5' | 'claude-haiku-5-5' = 'claude-sonnet-5-5') {
  const create = jest.fn(async () => message());
  const client = { beta: { messages: { create } } } as unknown as Pick<Anthropic, 'beta'>;
  return { create, model: new ClaudeInvoiceModel(model, client) };
}

/** The request as the fake client received it. */
interface SentRequest {
  model: string;
  max_tokens: number;
  betas?: string[];
  fallbacks?: string;
  thinking?: unknown;
  output_config: { effort: string; format: { type: string; schema: { required: string[]; additionalProperties: boolean } } };
  messages: { content: [Record<string, unknown>, { text: string }] }[];
}
const sent = (create: jest.Mock): SentRequest => (create.mock.calls[0] as unknown[])[0] as SentRequest;

const pdf = Buffer.from('%PDF-1.4 test');
const qr = {
  sellerName: 'شركة المثال للتجارة', vatNumber: '300000000000003', timestamp: '2026-09-14T10:12:00Z',
  totalWithVat: '1150.00', vatTotal: '150.00',
};

describe('Claude invoice model client', () => {
  it('sends a PDF with the JSON schema, low effort and server-side fallback on Sonnet 5.5', async () => {
    const { create, model } = setup();
    const result = await model.extract(pdf, 'application/pdf', qr);

    const request = sent(create);
    expect(request).toMatchObject({
      model: 'claude-sonnet-5-5', max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    });
    expect(request.thinking).toBeUndefined();
    expect(request.output_config.format.schema.required).toHaveLength(14);
    expect(request.output_config.format.schema.additionalProperties).toBe(false);
    expect(request.messages[0].content[0]).toEqual({
      type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') },
    });
    expect(request.messages[0].content[1].text).toContain('seller VAT number: 300000000000003');

    expect(result).toEqual({
      isInvoice: true, invoiceCount: 1, model: 'claude-sonnet-5-5', costUsd: 0.007,
      fields: {
        vendorName: answer.vendorName, invoiceNumber: 'INV-2026-0142', invoiceDate: '2026-09-14', dueDate: null,
        totalAmount: '1150.00', taxAmount: '150.00', currency: 'SAR', paymentStatus: null,
        paymentMethod: 'bank_transfer', customerName: 'Owner Co', taxNumber: '300000000000003', crNumber: '1010000000',
      },
    });
  });

  it('sends photos as images, and Haiku 5.5 without fallbacks', async () => {
    const { create, model } = setup('claude-haiku-5-5');
    create.mockResolvedValue(message({ model: 'claude-haiku-5-5' }));
    await model.extract(Buffer.from('jpeg'), 'image/jpeg', null);

    const request = sent(create);
    expect(request.model).toBe('claude-haiku-5-5');
    expect(request).not.toHaveProperty('fallbacks');
    expect(request).not.toHaveProperty('betas');
    expect(request.messages[0].content[0]).toMatchObject({ type: 'image', source: { media_type: 'image/jpeg' } });
    expect(request.messages[0].content[1].text).toBe('Extract the invoice fields.');
  });

  it('reports a file that is not an invoice, and several invoices in one file', async () => {
    const { create, model } = setup();
    create.mockResolvedValue(message({
      content: [{ type: 'text', text: JSON.stringify({ ...answer, isInvoice: false, invoiceCount: 0 }), citations: null }],
    }));
    expect(await model.extract(pdf, 'application/pdf', null)).toMatchObject({ isInvoice: false, invoiceCount: 1 });

    create.mockResolvedValue(message({
      content: [{ type: 'text', text: JSON.stringify({ ...answer, invoiceCount: 3 }), citations: null }],
    }));
    expect(await model.extract(pdf, 'application/pdf', null)).toMatchObject({ invoiceCount: 3 });
  });

  it('fails permanently on a refusal, keeping its cost', async () => {
    const { create, model } = setup();
    create.mockResolvedValue(message({
      stop_reason: 'refusal', content: [],
      stop_details: { type: 'refusal', category: 'general_harms', explanation: null } as never,
    }));
    await expect(model.extract(pdf, 'application/pdf', null)).rejects.toMatchObject({
      name: 'ExtractionError', permanent: true, costUsd: 0.007, message: 'Model declined the request (general_harms)',
    });
  });

  it.each([
    ['output cut off at max_tokens', message({ stop_reason: 'max_tokens' })],
    ['invalid JSON', message({ content: [{ type: 'text', text: '{"isInvoice":', citations: null }] as never })],
    ['no text block', message({ content: [] })],
  ])('retries on %s, keeping its cost', async (_label, response) => {
    const { create, model } = setup();
    create.mockResolvedValue(response);
    await expect(model.extract(pdf, 'application/pdf', null)).rejects.toMatchObject({
      name: 'ExtractionError', permanent: false, costUsd: 0.007,
    });
  });

  it('treats rejected requests as permanent and API or network failures as retryable', async () => {
    const { create, model } = setup();
    create.mockRejectedValueOnce(new Anthropic.BadRequestError(400, {}, 'PDF could not be processed', new Headers()));
    await expect(model.extract(pdf, 'application/pdf', null)).rejects.toMatchObject({ permanent: true });

    create.mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, 'slow down', new Headers()));
    await expect(model.extract(pdf, 'application/pdf', null)).rejects.toMatchObject({ permanent: false });

    create.mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: 'socket hang up' }));
    await expect(model.extract(pdf, 'application/pdf', null)).rejects.toMatchObject({ permanent: false });
  });

  it('rejects unsupported file types before calling the API', async () => {
    const { create, model } = setup();
    await expect(model.extract(pdf, 'application/octet-stream', null)).rejects.toBeInstanceOf(ExtractionError);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('Extraction cost', () => {
  const usage = (fields: Record<string, unknown>) => ({
    input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, iterations: null,
    ...fields,
  }) as unknown as Anthropic.Beta.BetaUsage;

  it('prices input, output and cache tokens per model', () => {
    expect(costOf({ model: 'claude-sonnet-5-5', usage: usage({
      input_tokens: 1_000_000, output_tokens: 100_000, cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000,
    }) })).toBe(2 + 1 + 0.2 + 2.5);
    expect(costOf({ model: 'claude-haiku-5-5', usage: usage({ input_tokens: 10_000, output_tokens: 1_000 }) }))
      .toBe(0.0015);
  });

  it('uses the long-prompt rate for Haiku 5.5 above 100K input tokens', () => {
    expect(costOf({ model: 'claude-haiku-5-5', usage: usage({ input_tokens: 200_000, output_tokens: 1_000 }) }))
      .toBe(0.1025);
  });

  it('sums the primary and fallback models when a fallback ran', () => {
    expect(costOf({ model: 'claude-sonnet-5', usage: usage({
      iterations: [
        { type: 'message', model: null, input_tokens: 1000, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
        { type: 'fallback_message', model: 'claude-sonnet-5', input_tokens: 1000, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      ],
    }) }, 'claude-sonnet-5-5')).toBe(0.0061);
  });

  it('refuses to guess the price of an unknown model', () => {
    expect(() => costOf({ model: 'claude-unknown', usage: usage({ input_tokens: 1 }) })).toThrow('No price known');
  });
});
