import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';
import { PDFDocument, rgb } from 'pdf-lib';
import { prepareZXingModule, writeBarcode } from 'zxing-wasm/writer';
import { decodeZatcaQr } from '../src/extraction/zatca-qr';
import { readZatcaQr } from '../src/extraction/zatca-qr-reader';

/** Builds a ZATCA TLV payload; values above 127 bytes use the 0x81 long form. */
function tlv(entries: [number, string | Buffer][]): string {
  const parts = entries.map(([tag, value]) => {
    const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
    const length = bytes.length < 0x80 ? [bytes.length] : [0x81, bytes.length];
    return Buffer.concat([Buffer.from([tag, ...length]), bytes]);
  });
  return Buffer.concat(parts).toString('base64');
}

const sample = {
  sellerName: 'شركة المثال للتجارة',
  vatNumber: '300000000000003',
  timestamp: '2026-09-14T10:12:00Z',
  totalWithVat: '1150.00',
  vatTotal: '150.00',
};
const samplePayload = tlv([
  [1, sample.sellerName], [2, sample.vatNumber], [3, sample.timestamp],
  [4, sample.totalWithVat], [5, sample.vatTotal],
]);

describe('ZATCA QR payload', () => {
  it('decodes the five fields, including an Arabic seller name', () => {
    expect(decodeZatcaQr(samplePayload)).toEqual(sample);
  });

  it('skips the Phase 2 tags 6–9, including long-form lengths', () => {
    const phase2 = tlv([
      [1, sample.sellerName], [2, sample.vatNumber], [3, sample.timestamp],
      [4, sample.totalWithVat], [5, sample.vatTotal],
      [6, 'hash'.repeat(11)], [7, Buffer.alloc(150, 7)], [8, Buffer.alloc(88, 8)], [9, Buffer.alloc(72, 9)],
    ]);
    expect(decodeZatcaQr(` ${phase2}\n`)).toEqual(sample);
  });

  it.each([
    ['a payment link', 'https://pay.example.test/i/123'],
    ['a missing total (tag 4)', tlv([[1, 'Vendor'], [2, '300000000000003'], [3, '2026-09-14'], [5, '15.00']])],
    ['an empty seller name', tlv([[1, ' '], [2, '3'], [3, 't'], [4, '1'], [5, '1']])],
    ['a truncated payload', Buffer.from(Buffer.from(samplePayload, 'base64').subarray(0, 20)).toString('base64')],
    ['invalid UTF-8', tlv([[1, Buffer.from([0xff, 0xfe])], [2, '3'], [3, 't'], [4, '1'], [5, '1']])],
    ['plain text', 'not a qr payload'],
  ])('rejects %s', (_label, text) => {
    expect(decodeZatcaQr(text)).toBeNull();
  });
});

describe('ZATCA QR reader (images and PDFs)', () => {
  beforeAll(() => {
    prepareZXingModule({
      overrides: { wasmBinary: readFileSync(require.resolve('zxing-wasm/writer/zxing_writer.wasm')) as unknown as ArrayBuffer },
    });
  });

  async function qr(text: string) {
    const result = await writeBarcode(text, { format: 'QRCode', scale: 4 });
    if (result.error) throw new Error(result.error);
    return { png: Buffer.from(await result.image!.arrayBuffer()), symbol: result.symbol! };
  }

  /** A phone-photo stand-in: grey background, QR rotated 8 degrees, saved as JPEG. */
  async function photo(png: Buffer): Promise<Buffer> {
    const image = await loadImage(png);
    const canvas = createCanvas(900, 1200);
    const context = canvas.getContext('2d');
    context.fillStyle = '#e8e4dc';
    context.fillRect(0, 0, 900, 1200);
    context.translate(600, 300);
    context.rotate((8 * Math.PI) / 180);
    context.drawImage(image, -90, -90, 180, 180);
    return canvas.encode('jpeg', 80);
  }

  async function pdf(draw: (document: PDFDocument) => Promise<void>): Promise<Buffer> {
    const document = await PDFDocument.create();
    await draw(document);
    return Buffer.from(await document.save());
  }

  async function addImageQr(document: PDFDocument, text: string, pageIndex = 0) {
    while (document.getPageCount() <= pageIndex) document.addPage([595, 842]);
    const image = await document.embedPng((await qr(text)).png);
    document.getPage(pageIndex).drawImage(image, { x: 420, y: 660, width: 110, height: 110 });
  }

  it('reads a PNG image', async () => {
    expect(await readZatcaQr((await qr(samplePayload)).png, 'image/png')).toEqual(sample);
  });

  it('reads a rotated JPEG photo', async () => {
    expect(await readZatcaQr(await photo((await qr(samplePayload)).png), 'image/jpeg')).toEqual(sample);
  });

  it('reads a QR embedded as an image in a PDF', async () => {
    const file = await pdf(document => addImageQr(document, samplePayload));
    expect(await readZatcaQr(file, 'application/pdf')).toEqual(sample);
  });

  it('reads a QR drawn as vector shapes by rendering the page', async () => {
    const { symbol } = await qr(samplePayload);
    const file = await pdf(async document => {
      const page = document.addPage([595, 842]);
      const module = 3;
      for (let y = 0; y < symbol.height; y++) {
        for (let x = 0; x < symbol.width; x++) {
          if (symbol.data[y * symbol.width + x] === 0) {
            page.drawRectangle({ x: 420 + x * module, y: 780 - y * module, width: module, height: module, color: rgb(0, 0, 0) });
          }
        }
      }
    });
    expect(await readZatcaQr(file, 'application/pdf')).toEqual(sample);
  });

  it('finds the ZATCA QR next to another QR, and on a later page', async () => {
    const file = await pdf(async document => {
      await addImageQr(document, 'https://pay.example.test/i/123', 0);
      await addImageQr(document, samplePayload, 1);
    });
    expect(await readZatcaQr(file, 'application/pdf')).toEqual(sample);
  });

  it('returns null when there is no ZATCA QR', async () => {
    const file = await pdf(document => addImageQr(document, 'https://pay.example.test/i/123'));
    expect(await readZatcaQr(file, 'application/pdf')).toBeNull();
    expect(await readZatcaQr(await pdf(async document => { document.addPage(); }), 'application/pdf')).toBeNull();
  });

  it('returns null instead of failing on a broken file or a timeout', async () => {
    expect(await readZatcaQr(Buffer.from('%PDF-1.4 broken'), 'application/pdf')).toBeNull();
    expect(await readZatcaQr(Buffer.from('not an image'), 'image/png')).toBeNull();
    expect(await readZatcaQr((await qr(samplePayload)).png, 'image/png', 1)).toBeNull();
  });
});
