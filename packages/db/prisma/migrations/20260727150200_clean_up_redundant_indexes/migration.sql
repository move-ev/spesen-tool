-- Remove indexes fully covered by an existing composite index prefix and
-- replace the low-selectivity status index with the composite the admin
-- review queries actually use (organizationId + status).

-- DropIndex (covered by report_ownerId_organizationId_idx)
DROP INDEX "report_ownerId_idx";

-- DropIndex (replaced by the composite below)
DROP INDEX "report_status_idx";

-- DropIndex (covered by cost_unit_organizationId_tag_key)
DROP INDEX "cost_unit_organizationId_idx";

-- CreateIndex
CREATE INDEX "report_organizationId_status_idx" ON "report"("organizationId", "status");

-- Rollback:
--   DROP INDEX "report_organizationId_status_idx";
--   CREATE INDEX "report_ownerId_idx" ON "report"("ownerId");
--   CREATE INDEX "report_status_idx" ON "report"("status");
--   CREATE INDEX "cost_unit_organizationId_idx" ON "cost_unit"("organizationId");
