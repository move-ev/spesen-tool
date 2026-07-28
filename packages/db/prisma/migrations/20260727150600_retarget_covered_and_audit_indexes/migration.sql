-- Second round of index cleanup: drop indexes fully covered by an existing
-- composite/unique prefix, and retarget the audit entity index at the
-- queries the module actually runs (both audit read paths filter by
-- organizationId first; nothing queries entityType without it).

-- DropIndex (covered by legal_acceptance_userId_releaseVersion_key)
DROP INDEX "legal_acceptance_userId_idx";

-- DropIndex (covered by report_organizationId_status_idx)
DROP INDEX "report_organizationId_idx";

-- DropIndex (covered by cost_unit_group_organizationId_title_key)
DROP INDEX "cost_unit_group_organizationId_idx";

-- DropIndex (replaced by the org-leading composite below)
DROP INDEX "audit_event_entityType_entityId_createdAt_idx";

-- CreateIndex
CREATE INDEX "audit_event_organizationId_entityId_createdAt_idx" ON "audit_event"("organizationId", "entityId", "createdAt");

-- Rollback:
--   DROP INDEX "audit_event_organizationId_entityId_createdAt_idx";
--   CREATE INDEX "audit_event_entityType_entityId_createdAt_idx" ON "audit_event"("entityType", "entityId", "createdAt");
--   CREATE INDEX "legal_acceptance_userId_idx" ON "legal_acceptance"("userId");
--   CREATE INDEX "report_organizationId_idx" ON "report"("organizationId");
--   CREATE INDEX "cost_unit_group_organizationId_idx" ON "cost_unit_group"("organizationId");
