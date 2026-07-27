# Database Schema Audit & Normalization (ZEM-17)

Audit of the Prisma schema for denormalization patterns, integrity gaps and
constraints blocking future work, together with the migration strategy that
fixes them. This is the prerequisite for the tRPC routes rebuild. Related
docs: [audit-trail.md](./audit-trail.md),
[multi-tenancy-migration.md](./multi-tenancy-migration.md),
[deployment.md](./deployment.md).

---

## Audit findings

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | `Expense.meta` stored type-specific data as untyped Json; three divergent shape definitions existed (`apps/web` client validators, server validators, `apps/api` PDF parser — the last silently dropped food deduction fields) | High | **Fixed** — typed `travel_expense_detail` / `food_expense_detail` tables |
| 2 | Reports referenced live, mutable `BankingDetails` (`ON DELETE RESTRICT`): editing them silently changed finalized reports; deletion was permanently blocked once referenced | High | **Fixed** — `report_banking_snapshot` written at submission; live FK relaxed to nullable + `SET NULL` |
| 3 | `Member` had no `(userId, organizationId)` unique constraint; the session-create hook's check-then-insert is not transactional, so concurrent logins could create duplicate memberships | High | **Fixed** — dedupe + unique constraint |
| 4 | Money columns used Prisma's implicit `DECIMAL(65,30)`; no scale validation anywhere | Medium | **Fixed** — `DECIMAL(12,2)` + `multipleOf(0.01)` input validation |
| 5 | Redundant indexes: `report(ownerId)` covered by `report(ownerId, organizationId)`; `cost_unit(organizationId)` covered by the `(organizationId, tag)` unique; low-selectivity `report(status)` | Low | **Fixed** — dropped / replaced with `report(organizationId, status)` |
| 6 | Monolithic 400-line `schema.prisma` | Low | **Fixed** — split into domain files under `prisma/schema/` |
| 7 | `Settings.costUnitInfoUrl` maps to a stale column name (`accountingUnitPdfUrl`) | Low | Deferred (see below) |
| 8 | Better Auth managed models use plain `String` roles/statuses (`User.role`, `Member.role`, `Invitation.status`); `Organization.metadata` is stringified JSON | Info | Accepted — shapes are owned by Better Auth |
| 9 | `Session.legalAcceptedAt` / `legalAcceptedReleaseVersion` duplicate `LegalAcceptance` | Info | Accepted — intentional per-session cache for the legal gate |
| 10 | `User.microsoftTenantId` duplicates `Organization.microsoftTenantId` | Info | Accepted — this is the auto-mapping mechanism, not accidental denormalization |
| 11 | Deleting a `CostUnitGroup` cascaded into its cost units and, transitively, every report tied to them — reachable from the ordinary group-delete endpoint | High | **Fixed** — relation relaxed to `SET NULL`; deleting a group now only ungroups its units |
| 12 | Cross-tenant references are representable at the DB level: `Report.costUnitId` and `CostUnit.costUnitGroupId` are single-column FKs, so a direct write could point at another org's row | Info | Accepted — tenancy is enforced at the write boundaries (loader procedures + service org checks), consistent with the declined scoped-client extension (see trpc-architecture.md); composite FKs would conflict with the `SET NULL` group relation (Postgres nulls *all* referencing columns) and row-level security remains the option if a hard guarantee is ever needed |
| 13 | The type/detail invariant (`TRAVEL`/`FOOD` ⇔ matching detail row, no mismatched rows) is not DB-enforced | Info | Accepted — cross-table CHECKs need triggers; writes create details atomically via nested writes, the post-deploy checks below verify completeness, and the app falls back to `meta` for deploy-window rows |
| 14 | Deleting an organization cascades into `audit_event` | Info | Accepted — org deletion is full tenant offboarding; the audit trail is org-scoped and does not outlive its tenant (see audit-trail.md) |

---

## Target structure (after this change)

- `Expense` type-specific data lives in typed 1:1 tables, one row per
  `TRAVEL` / `FOOD` expense (`RECEIPT` has none):
  - `travel_expense_detail(expenseId UNIQUE, from, to, distance DECIMAL(8,2))`
  - `food_expense_detail(expenseId UNIQUE, days INT, breakfast/lunch/dinnerDeduction DECIMAL(12,2))`
  - `Expense.meta` is nullable, no longer written, and kept only until the
    contract migration below.
- `report_banking_snapshot(reportId UNIQUE, iban, fullName)` holds the
  ciphertext copy of the banking details a report was submitted with,
  upserted inside the submit transaction. Reads prefer the snapshot for
  non-editable reports and the live relation for editable ones.
  `Report.bankingDetailsId` is nullable with `ON DELETE SET NULL`; submitting
  requires it to be set.
- `member` is unique per `(userId, organizationId)`.

---

## Migration strategy

Deployment runs `prisma migrate deploy` in the web container `CMD` on boot
(`canary` = staging, `master` = production; see
[deployment.md](./deployment.md)). Prisma has no down-migrations, so safety
comes from **expand/contract sequencing**: this release only adds tables,
relaxes constraints and backfills — nothing is dropped. Every migration file
carries a `-- Rollback:` block with the exact inverse SQL.

### Migrations in this release (expand)

| Migration | Purpose |
|---|---|
| `20260727150000_add_member_unique_constraint` | Reconcile duplicate members' roles (most privileged wins), dedupe (keep oldest per user/org), add unique constraint |
| `20260727150100_add_money_column_precision` | Money columns → `DECIMAL(12,2)` |
| `20260727150200_clean_up_redundant_indexes` | Drop covered indexes, add `report(organizationId, status)` |
| `20260727150300_add_expense_detail_tables` | Create + backfill typed expense detail tables (out-of-range meta values degrade to defaults), `meta` nullable |
| `20260727150400_add_report_banking_snapshot` | Create + backfill snapshots, relax `bankingDetailsId` FK |
| `20260727150500_detach_cost_units_on_group_delete` | Group-delete FK → `SET NULL` (finding 11) |
| `20260727150600_retarget_covered_and_audit_indexes` | Drop covered indexes on `legal_acceptance`, `report`, `cost_unit_group`; audit entity index → `(organizationId, entityId, createdAt)` |

Both backfills are **idempotent** (`ON CONFLICT DO NOTHING`) and can be
re-run to catch up rows written by an old app instance during the deploy
window. Malformed `meta` values — including syntactically numeric values
that do not fit the target columns — fall back to the same defaults the old
application code used. Until the contract migration drops `meta`, the app's
read and update paths additionally fall back to `meta` for deploy-window
rows whose detail row does not exist yet (`expense.meta.ts`), so nothing is
lost or overwritten with defaults in the meantime.

### Pre-deploy checks

```sql
-- Must return 0: amounts that would overflow DECIMAL(12,2), in either direction
SELECT count(*) FROM expense WHERE abs(amount) >= 1e10;

-- Must return 0: settings values that would overflow DECIMAL(12,2)
SELECT count(*) FROM settings
WHERE abs("kilometerRate") >= 1e10
   OR abs("dailyFoodAllowance") >= 1e10
   OR abs("breakfastDeduction") >= 1e10
   OR abs("lunchDeduction") >= 1e10
   OR abs("dinnerDeduction") >= 1e10;

-- Informational: duplicate memberships the dedupe will remove
SELECT "userId", "organizationId", count(*) FROM member
GROUP BY 1, 2 HAVING count(*) > 1;
```

### Post-deploy checks

```sql
-- All must return 0
SELECT count(*) FROM expense e LEFT JOIN travel_expense_detail t ON t."expenseId" = e.id
  WHERE e.type = 'TRAVEL' AND t.id IS NULL;
SELECT count(*) FROM expense e LEFT JOIN food_expense_detail f ON f."expenseId" = e.id
  WHERE e.type = 'FOOD' AND f.id IS NULL;
SELECT count(*) FROM report r LEFT JOIN report_banking_snapshot s ON s."reportId" = r.id
  WHERE r.status <> 'DRAFT' AND s.id IS NULL;
```

### Verification performed

The full migration chain was applied to a disposable Postgres 17 instance in
two phases: all pre-existing migrations first, then seeded legacy data
(duplicate members, expenses with valid and malformed `meta`, sub-cent
amounts, reports in every status), then the five new migrations. Verified:
dedupe kept the oldest membership and the constraint rejects new duplicates;
amounts rounded to cents; both backfills covered every row including
malformed-meta fallbacks; snapshots exist exactly for previously submitted
reports; deleting banking details detaches reports while their snapshots
survive; `meta` is byte-identical to before; and
`prisma migrate diff` between the migrated database and `prisma/schema/`
reports no drift.

---

## Deferred follow-ups (contract phase)

Run these only after the release has soaked in staging and production:

1. **Drop `expense.meta`** — re-run both backfill INSERTs first (to catch
   deploy-window rows), then
   `ALTER TABLE "expense" DROP COLUMN "meta";` and remove the field from
   `prisma/schema/report.prisma`.
2. **Rename `settings."accountingUnitPdfUrl"` → `"costUnitInfoUrl"`** and
   drop the `@map` — needs its own release because the running old app still
   selects the old column name during deploys.
3. **Remove `apps/web/src/generated/prisma`** — unused residual generated
   client; both apps import from `@zemio/db`.
