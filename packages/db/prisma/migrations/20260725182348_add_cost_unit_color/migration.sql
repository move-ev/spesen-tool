-- CreateEnum
CREATE TYPE "CostUnitColor" AS ENUM ('GRAY', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'RED', 'PINK', 'PURPLE');

-- AlterTable
ALTER TABLE "cost_unit" ADD COLUMN     "color" "CostUnitColor" NOT NULL DEFAULT 'GRAY';
