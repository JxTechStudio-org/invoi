-- DropForeignKey
ALTER TABLE "ExtractionJob" DROP CONSTRAINT "ExtractionJob_invoiceId_fkey";

-- AlterTable
ALTER TABLE "ExtractionJob" ADD COLUMN     "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ExtractionJob_createdAt_idx" ON "ExtractionJob"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisJob_createdAt_idx" ON "AnalysisJob"("createdAt");

-- AddForeignKey
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

