-- Reports previously referenced live, mutable banking details forever
-- (ON DELETE RESTRICT): editing them silently changed finalized reports and
-- deleting them was impossible once referenced. Introduce an immutable
-- per-report snapshot written at submission, relax the live reference to
-- nullable + SET NULL, and backfill snapshots for all reports that are no
-- longer editable.

-- CreateTable
CREATE TABLE "report_banking_snapshot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_banking_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_banking_snapshot_reportId_key" ON "report_banking_snapshot"("reportId");

-- AddForeignKey
ALTER TABLE "report_banking_snapshot" ADD CONSTRAINT "report_banking_snapshot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: snapshot the current live details for every report that has
-- ever been submitted (everything except never-submitted drafts — there is
-- no status path back to DRAFT). For those legacy reports the live values
-- are the best available approximation of what was submitted. Idempotent
-- via ON CONFLICT DO NOTHING.
INSERT INTO "report_banking_snapshot" ("id", "reportId", "iban", "fullName")
SELECT
  gen_random_uuid()::text,
  r."id",
  b."iban",
  b."fullName"
FROM "report" r
JOIN "banking_details" b ON b."id" = r."bankingDetailsId"
WHERE r."status" <> 'DRAFT'
ON CONFLICT ("reportId") DO NOTHING;

-- Relax the live reference: deleting banking details is now allowed and
-- detaches editable reports instead of being blocked forever.
-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_bankingDetailsId_fkey";

-- AlterTable
ALTER TABLE "report" ALTER COLUMN "bankingDetailsId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_bankingDetailsId_fkey" FOREIGN KEY ("bankingDetailsId") REFERENCES "banking_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback:
--   ALTER TABLE "report" DROP CONSTRAINT "report_bankingDetailsId_fkey";
--   -- reports orphaned by a deletion in the meantime block re-adding NOT
--   -- NULL; there is no way to restore their reference, so this must be
--   -- resolved manually (expected count: 0 shortly after deploy):
--   SELECT count(*) FROM "report" WHERE "bankingDetailsId" IS NULL;
--   ALTER TABLE "report" ALTER COLUMN "bankingDetailsId" SET NOT NULL;
--   ALTER TABLE "report" ADD CONSTRAINT "report_bankingDetailsId_fkey"
--     FOREIGN KEY ("bankingDetailsId") REFERENCES "banking_details"("id")
--     ON DELETE RESTRICT ON UPDATE CASCADE;
--   DROP TABLE "report_banking_snapshot";
