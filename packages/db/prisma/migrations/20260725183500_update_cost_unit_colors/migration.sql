-- AlterEnum
BEGIN;
CREATE TYPE "CostUnitColor_new" AS ENUM ('RED', 'ORANGE', 'AMBER', 'YELLOW', 'LIME', 'GREEN', 'EMERALD', 'TEAL', 'CYAN', 'SKY', 'BLUE', 'INDIGO', 'VIOLET', 'PURPLE', 'FUCHSIA', 'PINK', 'ROSE', 'BASE');
ALTER TABLE "cost_unit" ALTER COLUMN "color" DROP DEFAULT;
-- Remap removed values to the new default before switching types (GRAY existed in the previous enum)
ALTER TABLE "cost_unit" ALTER COLUMN "color" TYPE "CostUnitColor_new" USING (
  CASE "color"::text
    WHEN 'GRAY' THEN 'BASE'
    ELSE "color"::text
  END::"CostUnitColor_new"
);
ALTER TYPE "CostUnitColor" RENAME TO "CostUnitColor_old";
ALTER TYPE "CostUnitColor_new" RENAME TO "CostUnitColor";
DROP TYPE "CostUnitColor_old";
ALTER TABLE "cost_unit" ALTER COLUMN "color" SET DEFAULT 'BASE';
COMMIT;
