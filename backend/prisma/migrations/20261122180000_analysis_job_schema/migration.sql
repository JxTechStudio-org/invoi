-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('pending', 'completed', 'failed');

-- AlterTable
ALTER TABLE "AnalysisJob" DROP COLUMN "state",
ADD COLUMN "question" TEXT,
ADD COLUMN "status" "AnalysisJobStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "error" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX IF EXISTS "AnalysisJob_userId_type_createdAt_idx";
DROP INDEX IF EXISTS "AnalysisJob_createdAt_idx";

-- CreateIndex
CREATE INDEX "AnalysisJob_userId_createdAt_idx" ON "AnalysisJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisJob_userId_type_status_idx" ON "AnalysisJob"("userId", "type", "status");
