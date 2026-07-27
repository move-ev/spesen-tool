-- A user must only be a member of an organization once. The application's
-- check-then-insert in the session-create hook is not transactional, so
-- concurrent logins may have created duplicate memberships.

-- Deduplicate first: keep the oldest row per (userId, organizationId),
-- tie-broken by id. Duplicate rows carry no additional data.
DELETE FROM "member" m
USING "member" k
WHERE m."userId" = k."userId"
  AND m."organizationId" = k."organizationId"
  AND (
    k."createdAt" < m."createdAt"
    OR (k."createdAt" = m."createdAt" AND k."id" < m."id")
  );

-- DropIndex (covered by the unique index below via its userId prefix)
DROP INDEX "member_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_organizationId_key" ON "member"("userId", "organizationId");

-- Rollback:
--   DROP INDEX "member_userId_organizationId_key";
--   CREATE INDEX "member_userId_idx" ON "member"("userId");
--   (deleted rows were redundant duplicate memberships and are not restored)
