/**
 * The five ZATCA e-invoice QR fields (tags 1–5 of the Base64 TLV payload). Values are
 * returned as printed; normalisation and checks happen later (decisions B6, B7).
 */
export interface ZatcaQr {
  sellerName: string;
  vatNumber: string;
  /** Invoice time stamp as encoded, e.g. `2026-09-14T10:12:00Z`. */
  timestamp: string;
  /** Invoice total including VAT. */
  totalWithVat: string;
  vatTotal: string;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const utf8 = new TextDecoder('utf-8', { fatal: true });

/**
 * Decodes a ZATCA QR payload: Base64 of tag (1 byte), length, value. Phase 2 codes add
 * tags 6–9 (hash, signature, keys), which are skipped. Returns null for anything that is
 * not a complete ZATCA payload, such as a payment link QR printed on the same invoice.
 */
export function decodeZatcaQr(text: string): ZatcaQr | null {
  const payload = text.trim();
  if (payload.length < 8 || payload.length % 4 !== 0 || !BASE64.test(payload)) return null;

  const bytes = Buffer.from(payload, 'base64');
  const values = new Map<number, string>();
  let offset = 0;
  while (offset < bytes.length) {
    const tag = bytes[offset];
    const header = readLength(bytes, offset + 1);
    if (!header) return null;
    const start = header.next;
    const end = start + header.length;
    if (tag === 0 || end > bytes.length) return null;
    if (tag >= 1 && tag <= 5) {
      try {
        values.set(tag, utf8.decode(bytes.subarray(start, end)).trim());
      } catch {
        return null;
      }
    }
    offset = end;
  }

  const [sellerName, vatNumber, timestamp, totalWithVat, vatTotal] = [1, 2, 3, 4, 5].map(tag => values.get(tag));
  if (!sellerName || !vatNumber || !timestamp || !totalWithVat || !vatTotal) return null;
  return { sellerName, vatNumber, timestamp, totalWithVat, vatTotal };
}

/** One length byte per the ZATCA spec; some encoders use BER long form (0x81, 0x82) above 127. */
function readLength(bytes: Buffer, at: number): { length: number; next: number } | null {
  if (at >= bytes.length) return null;
  const first = bytes[at];
  if (first < 0x80) return { length: first, next: at + 1 };
  if (first === 0x81 && at + 1 < bytes.length) return { length: bytes[at + 1], next: at + 2 };
  if (first === 0x82 && at + 2 < bytes.length) return { length: bytes.readUInt16BE(at + 1), next: at + 3 };
  // ZATCA lengths fit in one byte; a value of 0x80 or more without a long-form prefix is malformed.
  return null;
}
