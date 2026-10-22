// Finds QR codes in one invoice file. Runs in a worker thread because pdfjs-dist is
// ESM-only (the backend is CommonJS) and PDF parsing can be slow; the caller enforces a
// timeout and terminates the worker. Plain JavaScript: copied to dist as a Nest asset.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parentPort, workerData } from 'node:worker_threads';

const require = createRequire(import.meta.url);

const MAX_PDF_PAGES = 3;
// 2× is about 144 dpi: enough for a printed QR of 2 cm or more.
const RENDER_SCALE = 2;
const READER_OPTIONS = { formats: ['QRCode'], tryHarder: true, tryRotate: true, maxNumberOfSymbols: 4 };

const { prepareZXingModule, readBarcodes } = await import('zxing-wasm/reader');
// Load the WebAssembly binary from node_modules; by default zxing-wasm would fetch it from a CDN.
prepareZXingModule({
  overrides: { wasmBinary: await readFile(require.resolve('zxing-wasm/reader/zxing_reader.wasm')) },
});

/** A ZATCA payload is Base64 whose first TLV tag is 1 (seller name). */
function looksLikeZatca(text) {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(text.trim()) && Buffer.from(text.trim(), 'base64')[0] === 1;
}

async function read(input) {
  const results = await readBarcodes(input, READER_OPTIONS);
  return results.filter(result => result.isValid).map(result => result.text);
}

async function scanImageFile(content) {
  return read(new Uint8Array(content));
}

async function scanPdf(content) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas, ImageData } = require('@napi-rs/canvas');
  const loading = pdfjs.getDocument({
    data: new Uint8Array(content), isEvalSupported: false, disableFontFace: true, verbosity: 0,
  });
  const pdf = await loading.promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const found = [];

  try {
    // 1. QR codes embedded as images: cheap, no rendering.
    for (let number = 1; number <= pageCount; number++) {
      const page = await pdf.getPage(number);
      const operators = await page.getOperatorList();
      for (let index = 0; index < operators.fnArray.length; index++) {
        if (operators.fnArray[index] !== pdfjs.OPS.paintImageXObject) continue;
        const image = await new Promise(resolve => page.objs.get(operators.argsArray[index][0], resolve));
        const rgba = toRgba(image);
        if (!rgba) continue;
        found.push(...await read(new ImageData(rgba, image.width, image.height)));
        if (found.some(looksLikeZatca)) return found;
      }
    }

    // 2. QR codes drawn as vector shapes: render each page and scan it.
    for (let number = 1; number <= pageCount; number++) {
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      found.push(...await read(context.getImageData(0, 0, canvas.width, canvas.height)));
      if (found.some(looksLikeZatca)) return found;
    }
    return found;
  } finally {
    await loading.destroy();
  }
}

/** pdf.js decoded image data: kind 1 = 1-bit grey, 2 = RGB, 3 = RGBA. */
function toRgba(image) {
  if (!image?.data || !image.width || !image.height) return null;
  const pixels = image.width * image.height;
  if (image.kind === 3) return new Uint8ClampedArray(image.data);
  const rgba = new Uint8ClampedArray(pixels * 4);
  if (image.kind === 2) {
    for (let pixel = 0; pixel < pixels; pixel++) {
      rgba[pixel * 4] = image.data[pixel * 3];
      rgba[pixel * 4 + 1] = image.data[pixel * 3 + 1];
      rgba[pixel * 4 + 2] = image.data[pixel * 3 + 2];
      rgba[pixel * 4 + 3] = 255;
    }
    return rgba;
  }
  if (image.kind === 1) {
    const rowBytes = Math.ceil(image.width / 8);
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const bit = (image.data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        const value = bit ? 255 : 0;
        const at = (y * image.width + x) * 4;
        rgba[at] = rgba[at + 1] = rgba[at + 2] = value;
        rgba[at + 3] = 255;
      }
    }
    return rgba;
  }
  return null;
}

const { content, contentType } = workerData;
try {
  const texts = contentType === 'application/pdf' ? await scanPdf(content) : await scanImageFile(content);
  parentPort.postMessage({ texts });
} catch (error) {
  parentPort.postMessage({ error: error instanceof Error ? error.message : String(error) });
}
