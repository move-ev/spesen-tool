-- Report.tag was backed by a single global sequence, so every organization
-- shared one counter. Replace it with a per-organization counter column and
-- scope the uniqueness constraint to the organization.
--
-- Existing tags are preserved: each organization's counter is seeded from the
-- highest tag it has already issued, so previously exported PDFs, emails and
-- payment references stay accurate. Old numbering gaps remain by design.

-- AlterTable
ALTER TABLE "report" ALTER COLUMN "tag" DROP DEFAULT;

-- DropSequence
DROP SEQUENCE IF EXISTS "report_tag_seq";

-- DropIndex
DROP INDEX IF EXISTS "report_tag_key";

-- AlterTable
ALTER TABLE "organization" ADD COLUMN "reportCounter" INTEGER NOT NULL DEFAULT 0;

-- Seed each organization's counter from the tags it already has.
UPDATE "organization" o
SET "reportCounter" = COALESCE(
    (SELECT MAX(r."tag") FROM "report" r WHERE r."organizationId" = o."id"),
    0
);

-- CreateIndex
CREATE UNIQUE INDEX "report_organizationId_tag_key" ON "report"("organizationId", "tag");
