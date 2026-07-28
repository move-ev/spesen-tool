-- Deleting a cost-unit group must only ungroup its cost units. The previous
-- CASCADE deleted the units and, transitively, every report (and its
-- expenses, attachments and banking snapshot) tied to them — reachable from
-- the ordinary group-delete endpoint.

-- DropForeignKey
ALTER TABLE "cost_unit" DROP CONSTRAINT "cost_unit_costUnitGroupId_fkey";

-- AddForeignKey
ALTER TABLE "cost_unit" ADD CONSTRAINT "cost_unit_costUnitGroupId_fkey" FOREIGN KEY ("costUnitGroupId") REFERENCES "cost_unit_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback:
--   ALTER TABLE "cost_unit" DROP CONSTRAINT "cost_unit_costUnitGroupId_fkey";
--   ALTER TABLE "cost_unit" ADD CONSTRAINT "cost_unit_costUnitGroupId_fkey"
--     FOREIGN KEY ("costUnitGroupId") REFERENCES "cost_unit_group"("id")
--     ON DELETE CASCADE ON UPDATE CASCADE;
