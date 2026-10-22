import { Logger } from '@nestjs/common';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { decodeZatcaQr, ZatcaQr } from './zatca-qr';

const SCAN_TIMEOUT_MS = 30_000;
const logger = new Logger('ZatcaQrReader');

/**
 * Finds and decodes the ZATCA QR code on an invoice file (decision B7): the image itself
 * for JPEG/PNG; for PDFs, embedded images first and rendered pages as the fallback.
 * Returns null when there is no readable ZATCA QR; extraction then continues without it.
 */
export async function readZatcaQr(
  content: Buffer,
  contentType: string,
  timeoutMs = SCAN_TIMEOUT_MS,
): Promise<ZatcaQr | null> {
  let texts: string[];
  try {
    texts = await scan(content, contentType, timeoutMs);
  } catch (error) {
    logger.warn(`QR scan failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  for (const text of texts) {
    const qr = decodeZatcaQr(text);
    if (qr) return qr;
  }
  return null;
}

function scan(content: Buffer, contentType: string, timeoutMs: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, 'zatca-qr-scan.worker.mjs'), {
      workerData: { content, contentType },
      // A hostile or huge file must not take the API process down with it.
      resourceLimits: { maxOldGenerationSizeMb: 512 },
    });
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error(`timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    worker.once('message', (message: { texts?: string[]; error?: string }) => {
      clearTimeout(timer);
      void worker.terminate();
      if (message.error !== undefined) reject(new Error(message.error));
      else resolve(message.texts ?? []);
    });
    worker.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    worker.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`worker exited with code ${code}`));
    });
  });
}
