import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PendingFileRemoval, StorageService, StoredFile } from './storage.service';

export interface RustFsStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

const requiredConfiguration = {
  RUSTFS_ENDPOINT: 'endpoint',
  RUSTFS_REGION: 'region',
  RUSTFS_BUCKET: 'bucket',
  RUSTFS_ACCESS_KEY: 'accessKey',
  RUSTFS_SECRET_KEY: 'secretKey',
} as const;

export function rustFsConfigFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): RustFsStorageConfig {
  const missing = Object.keys(requiredConfiguration)
    .filter(name => !environment[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required RustFS configuration: ${missing.join(', ')}`);
  }

  const values = Object.fromEntries(Object.entries(requiredConfiguration)
    .map(([name, property]) => [property, environment[name]!])) as unknown as RustFsStorageConfig;
  let endpoint: URL;
  try {
    endpoint = new URL(values.endpoint);
  } catch {
    throw new Error('RUSTFS_ENDPOINT must be a valid HTTP or HTTPS URL');
  }
  if (!['http:', 'https:'].includes(endpoint.protocol)) {
    throw new Error('RUSTFS_ENDPOINT must be a valid HTTP or HTTPS URL');
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(values.bucket)) {
    throw new Error('RUSTFS_BUCKET must be a valid S3 bucket name');
  }

  return { ...values, endpoint: endpoint.toString().replace(/\/$/, '') };
}

@Injectable()
export class RustFsStorageService implements StorageService {
  private readonly logger = new Logger(RustFsStorageService.name);
  private bucketInitialization?: Promise<void>;

  constructor(
    private readonly config: RustFsStorageConfig,
    private readonly client: S3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    }),
  ) {}

  async initialize(): Promise<void> {
    if (!this.bucketInitialization) {
      this.bucketInitialization = this.ensureBucket();
    }
    try {
      await this.bucketInitialization;
    } catch (error) {
      this.bucketInitialization = undefined;
      throw error;
    }
  }

  async upload(file: Express.Multer.File): Promise<StoredFile> {
    await this.initialize();
    const key = `invoices/${randomUUID()}${this.safeExtension(file)}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: file.buffer,
      ContentLength: file.buffer.length,
      ContentType: file.mimetype,
    }));
    return { fileUrl: this.referenceFor(key) };
  }

  async remove(file: StoredFile): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: this.keyFromReference(file.fileUrl),
    }));
  }

  async stageRemoval(fileUrl: string): Promise<PendingFileRemoval> {
    const originalKey = this.keyFromReference(fileUrl);
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: originalKey,
      }));
    } catch (error) {
      if (isNotFound(error)) return noOpRemoval();
      throw error;
    }

    const stagedKey = `_deleting/${randomUUID()}`;
    let staged = false;
    try {
      await this.copy(originalKey, stagedKey);
      staged = true;
      await this.delete(originalKey);
    } catch (error) {
      if (staged) {
        try {
          await this.delete(stagedKey);
        } catch {
          this.logger.error('Failed to remove RustFS staging object after deletion staging failed');
        }
      }
      throw error;
    }

    return {
      finalize: () => this.delete(stagedKey),
      restore: async () => {
        await this.copy(stagedKey, originalKey);
        await this.delete(stagedKey);
      },
    };
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
      return;
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.config.bucket }));
    } catch (error) {
      if (!isConflict(error)) throw error;
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
    }
  }

  private async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const encodedSource = `${encodeURIComponent(this.config.bucket)}/${sourceKey
      .split('/').map(segment => encodeURIComponent(segment)).join('/')}`;
    await this.client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      Key: destinationKey,
      CopySource: encodedSource,
    }));
  }

  private async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  private referenceFor(key: string): string {
    return `s3://${this.config.bucket}/${key}`;
  }

  private keyFromReference(reference: string): string {
    const prefix = `s3://${this.config.bucket}/`;
    const key = reference.slice(prefix.length);
    if (!reference.startsWith(prefix) || !key || key.startsWith('/') || key.includes('\\')
      || key.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
      throw new Error('Invalid RustFS storage reference');
    }
    return key;
  }

  private safeExtension(file: Express.Multer.File): string {
    const extension = extname(file.originalname).toLowerCase();
    const allowed: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    };
    const candidates = allowed[file.mimetype] ?? [];
    return candidates.includes(extension) ? extension : (candidates[0] ?? '');
  }
}

function noOpRemoval(): PendingFileRemoval {
  return { finalize: async () => {}, restore: async () => {} };
}

function isNotFound(error: unknown): boolean {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.$metadata?.httpStatusCode === 404
    || ['NotFound', 'NoSuchBucket', 'NoSuchKey'].includes(candidate.name ?? '');
}

function isConflict(error: unknown): boolean {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.$metadata?.httpStatusCode === 409
    || ['BucketAlreadyExists', 'BucketAlreadyOwnedByYou'].includes(candidate.name ?? '');
}
