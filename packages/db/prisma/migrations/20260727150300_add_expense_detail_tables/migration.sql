-- Normalize Expense.meta (untyped Json) into typed per-type detail tables.
-- Expand step: creates the tables and backfills them from meta. The meta
-- column is kept (now nullable) and dropped by a later contract migration
-- once the new read/write paths have soaked (see docs/schema-audit.md).

-- AlterTable
ALTER TABLE "expense" ALTER COLUMN "meta" DROP NOT NULL;

-- CreateTable
CREATE TABLE "travel_expense_detail" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "distance" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "travel_expense_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_expense_detail" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "breakfastDeduction" DECIMAL(12,2) NOT NULL,
    "lunchDeduction" DECIMAL(12,2) NOT NULL,
    "dinnerDeduction" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "food_expense_detail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "travel_expense_detail_expenseId_key" ON "travel_expense_detail"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "food_expense_detail_expenseId_key" ON "food_expense_detail"("expenseId");

-- AddForeignKey
ALTER TABLE "travel_expense_detail" ADD CONSTRAINT "travel_expense_detail_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_expense_detail" ADD CONSTRAINT "food_expense_detail_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: idempotent (ON CONFLICT DO NOTHING), re-runnable to catch up
-- rows written by an old app version during the deploy window. Malformed
-- meta values fall back to the same defaults the old update path used
-- (from/to '', distance 0; days 1, deductions 0).
INSERT INTO "travel_expense_detail" ("id", "expenseId", "from", "to", "distance")
SELECT
  gen_random_uuid()::text,
  e."id",
  COALESCE(e."meta" ->> 'from', ''),
  COALESCE(e."meta" ->> 'to', ''),
  COALESCE(
    CASE
      WHEN e."meta" ->> 'distance' ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN (e."meta" ->> 'distance')::numeric
    END,
    0
  )
FROM "expense" e
WHERE e."type" = 'TRAVEL'
ON CONFLICT ("expenseId") DO NOTHING;

INSERT INTO "food_expense_detail" ("id", "expenseId", "days", "breakfastDeduction", "lunchDeduction", "dinnerDeduction")
SELECT
  gen_random_uuid()::text,
  e."id",
  GREATEST(
    COALESCE(
      CASE
        WHEN e."meta" ->> 'days' ~ '^[0-9]+(\.[0-9]+)?$'
          THEN round((e."meta" ->> 'days')::numeric)::int
      END,
      1
    ),
    1
  ),
  COALESCE(
    CASE
      WHEN e."meta" ->> 'breakfastDeduction' ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN (e."meta" ->> 'breakfastDeduction')::numeric
    END,
    0
  ),
  COALESCE(
    CASE
      WHEN e."meta" ->> 'lunchDeduction' ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN (e."meta" ->> 'lunchDeduction')::numeric
    END,
    0
  ),
  COALESCE(
    CASE
      WHEN e."meta" ->> 'dinnerDeduction' ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN (e."meta" ->> 'dinnerDeduction')::numeric
    END,
    0
  )
FROM "expense" e
WHERE e."type" = 'FOOD'
ON CONFLICT ("expenseId") DO NOTHING;

-- Post-deploy check (expected: both counts are 0):
--   SELECT count(*) FROM expense e LEFT JOIN travel_expense_detail t ON t."expenseId" = e.id
--     WHERE e.type = 'TRAVEL' AND t.id IS NULL;
--   SELECT count(*) FROM expense e LEFT JOIN food_expense_detail f ON f."expenseId" = e.id
--     WHERE e.type = 'FOOD' AND f.id IS NULL;

-- Rollback (lossless — restores meta for rows created by the new app code
-- before dropping the detail tables):
--   UPDATE "expense" e
--     SET "meta" = jsonb_build_object('from', t."from", 'to', t."to", 'distance', t."distance")
--     FROM "travel_expense_detail" t
--     WHERE t."expenseId" = e."id" AND e."meta" IS NULL;
--   UPDATE "expense" e
--     SET "meta" = jsonb_build_object('days', f."days",
--       'breakfastDeduction', f."breakfastDeduction",
--       'lunchDeduction', f."lunchDeduction",
--       'dinnerDeduction', f."dinnerDeduction")
--     FROM "food_expense_detail" f
--     WHERE f."expenseId" = e."id" AND e."meta" IS NULL;
--   UPDATE "expense" SET "meta" = '{}' WHERE "meta" IS NULL;
--   ALTER TABLE "expense" ALTER COLUMN "meta" SET NOT NULL;
--   DROP TABLE "food_expense_detail";
--   DROP TABLE "travel_expense_detail";
