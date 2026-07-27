-- A user must only be a member of an organization once. The application's
-- check-then-insert in the session-create hook is not transactional, so
-- concurrent logins may have created duplicate memberships.

-- Duplicate rows carry a persisted "role" that may have diverged (e.g. one
-- of the duplicates was later promoted). Before deleting, give every row in
-- a duplicate group the most privileged role of the group so the surviving
-- row keeps it (owner > admin > member; LIKE covers comma-joined variants).
UPDATE "member" m
SET "role" = best."role"
FROM (
  SELECT DISTINCT ON ("userId", "organizationId")
    "userId", "organizationId", "role"
  FROM "member"
  ORDER BY "userId", "organizationId",
    CASE
      WHEN "role" LIKE '%owner%' THEN 0
      WHEN "role" LIKE '%admin%' THEN 1
      ELSE 2
    END
) best
WHERE m."userId" = best."userId"
  AND m."organizationId" = best."organizationId"
  AND m."role" <> best."role";

-- Deduplicate: keep the oldest row per (userId, organizationId),
-- tie-broken by id.
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
--   (deleted rows were redundant duplicate memberships and are not restored;
--   the role reconciliation is not reverted — the surviving row keeps the
--   most privileged role its duplicate group ever held)
