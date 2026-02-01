-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED', 'DELETED');

-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadedById" TEXT,
ADD COLUMN     "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
ALTER COLUMN "expenseId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "attachment_organizationId_idx" ON "attachment"("organizationId");

-- CreateIndex
CREATE INDEX "attachment_uploadedById_idx" ON "attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "attachment_status_idx" ON "attachment"("status");

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
