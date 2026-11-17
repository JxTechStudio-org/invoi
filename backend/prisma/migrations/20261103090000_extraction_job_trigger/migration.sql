-- CreateEnum
CREATE TYPE "ExtractionTrigger" AS ENUM ('upload', 'reextract', 'backfill');

-- AlterTable: every existing job was queued by an upload.
ALTER TABLE "ExtractionJob" ADD COLUMN     "trigger" "ExtractionTrigger" NOT NULL DEFAULT 'upload';
