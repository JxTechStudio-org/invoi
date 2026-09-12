-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'completed';
ALTER TYPE "InvoiceStatus" ADD VALUE 'needs_review';

ALTER TABLE "Invoice" RENAME COLUMN "sellerName" TO "vendorName";
ALTER TABLE "Invoice" RENAME COLUMN "amount" TO "totalAmount";

-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "userId" TEXT NOT NULL,
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "taxAmount" DECIMAL(12,2),
ADD COLUMN "currency" TEXT,
ADD COLUMN "paymentStatus" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "customerName" TEXT,
ADD COLUMN "taxNumber" TEXT,
ADD COLUMN "crNumber" TEXT,
ADD COLUMN "extractionConfidence" JSONB,
ADD COLUMN "needsReviewReason" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
