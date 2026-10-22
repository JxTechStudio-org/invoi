import Anthropic from '@anthropic-ai/sdk';
import { Currency, PaymentMethod, PaymentStatus } from '@prisma/client';
import { ExtractionError } from './invoice-extractor';
import { ZatcaQr } from './zatca-qr';

/** USD per million tokens (Anthropic first-party prices). */
interface ModelPrice {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  /** Higher rates once a prompt passes this many input tokens, where the model has them. */
  longPrompt?: { aboveInputTokens: number; input: number; output: number };
}

export const MODEL_PRICES: Record<string, ModelPrice> = {
  'claude-sonnet-5-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  // Server-side fallback target for Claude Sonnet 5.5 declines.
  'claude-sonnet-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-haiku-5-5': {
    input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01,
    longPrompt: { aboveInputTokens: 100_000, input: 0.5, output: 2.5 },
  },
};

export const SUPPORTED_EXTRACTION_MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'] as const;
export type ExtractionModel = typeof SUPPORTED_EXTRACTION_MODELS[number];

/** What the model reads off the invoice, as strings; normalisation and checks come after (B6, F20–F22). */
export interface ModelInvoiceFields {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  totalAmount: string | null;
  taxAmount: string | null;
  currency: Currency | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  customerName: string | null;
  taxNumber: string | null;
  crNumber: string | null;
}

export interface ModelExtraction {
  /** False when the file is clearly not an invoice (C11). */
  isInvoice: boolean;
  /** Invoices in the file; only the first is extracted (F24). */
  invoiceCount: number;
  fields: ModelInvoiceFields;
  /** The model that produced the answer (a fallback model if one ran). */
  model: string;
  costUsd: number;
}

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });
const text = nullable({ type: 'string' });

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isInvoice', 'invoiceCount', 'vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate',
    'totalAmount', 'taxAmount', 'currency', 'paymentStatus', 'paymentMethod', 'customerName',
    'taxNumber', 'crNumber',
  ],
  properties: {
    isInvoice: { type: 'boolean' },
    invoiceCount: { type: 'integer' },
    vendorName: text,
    invoiceNumber: text,
    invoiceDate: text,
    dueDate: text,
    totalAmount: text,
    taxAmount: text,
    currency: nullable({ type: 'string', enum: Object.values(Currency) }),
    paymentStatus: nullable({ type: 'string', enum: Object.values(PaymentStatus) }),
    paymentMethod: nullable({ type: 'string', enum: Object.values(PaymentMethod) }),
    customerName: text,
    taxNumber: text,
    crNumber: text,
  },
};

const SYSTEM_PROMPT = `You read invoices that small businesses in Saudi Arabia receive from their vendors. Invoices may be in Arabic, English or both, and may be PDFs, scans or phone photos.

Return the fields of the first invoice in the file exactly as printed on it. Use null for any field that is not printed or that you cannot read with confidence; never guess or calculate a missing value.

- vendorName: the seller's name. customerName: the buyer's name, as printed.
- invoiceNumber: as printed, including letters and dashes.
- invoiceDate, dueDate: Gregorian dates as YYYY-MM-DD. If only a Hijri date is printed, use null.
- totalAmount: the grand total including VAT. taxAmount: the total VAT. Write amounts with ASCII digits and a dot for decimals, without thousands separators or currency symbols (for example 1150.00), converting Arabic-Indic digits and the Arabic decimal separator.
- currency: the currency code (ر.س and ريال سعودي are SAR); null if it is not one of the allowed codes.
- paymentStatus and paymentMethod: only when the invoice clearly states them; otherwise null.
- taxNumber: the seller's VAT registration number, digits only. crNumber: the seller's commercial registration number, digits only.
- invoiceCount: how many separate invoices the file contains.
- isInvoice: false only if the file is clearly not an invoice (for example a photo, a contract or a blank page).`;

const REQUEST_TIMEOUT_MS = 120_000;
// Output is a short JSON object; the headroom covers adaptive thinking.
const MAX_TOKENS = 16_000;

type MessagesClient = Pick<Anthropic, 'beta'>;

/**
 * One Claude call per invoice file with a fixed JSON schema for all 12 fields (decisions
 * A1, A2). Values decoded from the ZATCA QR are passed in as known (B7). Cost comes from
 * the response usage (E17); the raw response is not kept.
 */
export class ClaudeInvoiceModel {
  constructor(
    private readonly model: ExtractionModel,
    private readonly client: MessagesClient = new Anthropic({ timeout: REQUEST_TIMEOUT_MS, maxRetries: 2 }),
  ) {}

  async extract(content: Buffer, contentType: string, knownQr: ZatcaQr | null): Promise<ModelExtraction> {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        // Extraction is a simple, high-volume route: adaptive thinking at low effort keeps cost down.
        output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [fileBlock(content, contentType), { type: 'text', text: userText(knownQr) }] }],
        // Server-side fallback reruns cyber and frontier_llm declines on Claude Sonnet 5;
        // Claude Haiku 5.5 has no server-side fallback.
        ...(this.model === 'claude-sonnet-5-5'
          ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      });
    } catch (error) {
      throw toExtractionError(error);
    }

    const costUsd = costOf(response, this.model);
    if (response.stop_reason === 'refusal') {
      const category = response.stop_details?.category ?? 'unknown';
      throw new ExtractionError(`Model declined the request (${category})`, { permanent: true, costUsd });
    }
    if (response.stop_reason === 'max_tokens') {
      throw new ExtractionError('Model output was cut off at max_tokens', { costUsd });
    }

    const answer = parseAnswer(response);
    if (!answer) throw new ExtractionError('Model returned no valid JSON answer', { costUsd });
    const { isInvoice, invoiceCount, ...fields } = answer;
    return { isInvoice, invoiceCount: Math.max(1, invoiceCount), fields, model: response.model, costUsd };
  }
}

function fileBlock(content: Buffer, contentType: string): Anthropic.Beta.BetaContentBlockParam {
  const data = content.toString('base64');
  if (contentType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } };
  }
  if (contentType === 'image/jpeg' || contentType === 'image/png') {
    return { type: 'image', source: { type: 'base64', media_type: contentType, data } };
  }
  throw new ExtractionError(`Unsupported file type ${contentType}`, { permanent: true });
}

function userText(qr: ZatcaQr | null): string {
  if (!qr) return 'Extract the invoice fields.';
  return [
    'Extract the invoice fields. These values were decoded from the invoice\'s ZATCA QR code and are exact:',
    `- seller name: ${qr.sellerName}`,
    `- seller VAT number: ${qr.vatNumber}`,
    `- invoice time stamp: ${qr.timestamp}`,
    `- total including VAT: ${qr.totalWithVat}`,
    `- VAT total: ${qr.vatTotal}`,
  ].join('\n');
}

function parseAnswer(response: Anthropic.Beta.BetaMessage): (ModelInvoiceFields & {
  isInvoice: boolean; invoiceCount: number;
}) | null {
  const block = response.content.find(item => item.type === 'text');
  if (!block || block.type !== 'text') return null;
  try {
    const value: unknown = JSON.parse(block.text);
    if (typeof value !== 'object' || value === null) return null;
    const answer = value as Record<string, unknown>;
    if (typeof answer.isInvoice !== 'boolean' || typeof answer.invoiceCount !== 'number') return null;
    return answer as unknown as ModelInvoiceFields & { isInvoice: boolean; invoiceCount: number };
  } catch {
    return null;
  }
}

/**
 * Sums every model that ran in the turn: the requested model and any fallback. An iteration
 * without a model is the requested one; `response.model` names the model that answered last.
 */
export function costOf(
  response: Pick<Anthropic.Beta.BetaMessage, 'model' | 'usage'>,
  requestedModel: string = response.model,
): number {
  const usage = response.usage;
  const parts = usage.iterations?.length
    ? usage.iterations.map(item => ({ ...item, model: ('model' in item && item.model) || requestedModel }))
    : [{ ...usage, model: response.model }];

  let total = 0;
  for (const part of parts) {
    const price = MODEL_PRICES[part.model];
    if (!price) throw new ExtractionError(`No price known for model ${part.model}`);
    const input = part.input_tokens ?? 0;
    const rates = price.longPrompt && input > price.longPrompt.aboveInputTokens
      ? { ...price, ...price.longPrompt } : price;
    total += (input * rates.input
      + (part.output_tokens ?? 0) * rates.output
      + (part.cache_creation_input_tokens ?? 0) * price.cacheWrite
      + (part.cache_read_input_tokens ?? 0) * price.cacheRead) / 1_000_000;
  }
  return Math.round(total * 1_000_000) / 1_000_000;
}

/** API failures after the SDK's own retries: 4xx request problems are permanent, the rest retry. */
function toExtractionError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) return error;
  if (error instanceof Anthropic.BadRequestError
    || error instanceof Anthropic.NotFoundError
    || error instanceof Anthropic.UnprocessableEntityError) {
    return new ExtractionError(`Model request rejected: ${error.message}`, { permanent: true });
  }
  if (error instanceof Anthropic.APIError) {
    return new ExtractionError(`Model API error ${error.status ?? ''}: ${error.message}`.trim());
  }
  return new ExtractionError(`Model call failed: ${error instanceof Error ? error.message : String(error)}`);
}
