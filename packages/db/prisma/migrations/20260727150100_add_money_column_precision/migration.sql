-- Money columns previously used Prisma's default DECIMAL(65,30). Constrain
-- them to DECIMAL(12,2). Postgres rounds existing values to 2 fractional
-- digits; application inputs are validated with multipleOf(0.01), so stored
-- values already have at most 2 fractional digits except for computed travel
-- amounts (distance * kilometerRate), where rounding to cents is the
-- intended behavior.
--
-- Pre-deploy check (must return 0 rows; would indicate values that exceed
-- 10 integer digits and would make the ALTER fail):
--   SELECT id, amount FROM expense WHERE amount >= 1e10;

-- AlterTable
ALTER TABLE "expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "kilometerRate" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "dailyFoodAllowance" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "breakfastDeduction" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "lunchDeduction" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "dinnerDeduction" SET DATA TYPE DECIMAL(12,2);

-- Rollback:
--   ALTER TABLE "expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
--   ALTER TABLE "settings" ALTER COLUMN "kilometerRate" SET DATA TYPE DECIMAL(65,30),
--     ALTER COLUMN "dailyFoodAllowance" SET DATA TYPE DECIMAL(65,30),
--     ALTER COLUMN "breakfastDeduction" SET DATA TYPE DECIMAL(65,30),
--     ALTER COLUMN "lunchDeduction" SET DATA TYPE DECIMAL(65,30),
--     ALTER COLUMN "dinnerDeduction" SET DATA TYPE DECIMAL(65,30);
--   (widening again is lossless; digits rounded away by this migration are
--   not recoverable, which is acceptable for sub-cent noise)
