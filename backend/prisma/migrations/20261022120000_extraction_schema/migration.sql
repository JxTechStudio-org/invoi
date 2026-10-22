-- CreateEnum
CREATE TYPE "JobState" AS ENUM ('queued', 'running', 'done', 'failed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Currency" ADD VALUE 'EUR';
ALTER TYPE "Currency" ADD VALUE 'GBP';
ALTER TYPE "Currency" ADD VALUE 'KWD';
ALTER TYPE "Currency" ADD VALUE 'QAR';
ALTER TYPE "Currency" ADD VALUE 'BHD';
ALTER TYPE "Currency" ADD VALUE 'OMR';
ALTER TYPE "Currency" ADD VALUE 'EGP';
ALTER TYPE "Currency" ADD VALUE 'JOD';
ALTER TYPE "Currency" ADD VALUE 'CNY';
ALTER TYPE "Currency" ADD VALUE 'INR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessNameEn" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "editedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "extractionCostUsd" DECIMAL(10,6),
ADD COLUMN     "extractionDurationMs" INTEGER,
ADD COLUMN     "extractionModel" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "state" "JobState" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" "JobState" NOT NULL DEFAULT 'queued',
    "result" JSONB,
    "costUsd" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractionJob_state_runAfter_idx" ON "ExtractionJob"("state", "runAfter");

-- CreateIndex
CREATE INDEX "ExtractionJob_invoiceId_idx" ON "ExtractionJob"("invoiceId");

-- CreateIndex
CREATE INDEX "AnalysisJob_userId_type_createdAt_idx" ON "AnalysisJob"("userId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Data: mark the production demo account (decision H9). It is the account whose
-- invoices use seed:// file references; no other account has them, so this is a
-- no-op on local and test databases.
UPDATE "User" AS u
SET "isDemo" = true
WHERE EXISTS (
    SELECT 1 FROM "Invoice" AS i
    WHERE i."userId" = u."id" AND i."fileUrl" LIKE 'seed://%'
);

-- Data: one-time paidAt for demo invoices already marked paid, copied from
-- updatedAt (decision H7). Real accounts get paidAt from the app from now on.
UPDATE "Invoice" AS i
SET "paidAt" = i."updatedAt"
FROM "User" AS u
WHERE u."id" = i."userId"
  AND u."isDemo"
  AND i."paymentStatus" = 'paid'
  AND i."paidAt" IS NULL;
