-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('processing');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'processing',
    "sellerName" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "amount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");
