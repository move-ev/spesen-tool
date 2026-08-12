-- Billing state for organization subscriptions.
--
-- Purely additive: every column is nullable or defaulted, and both new tables
-- start empty. An existing deployment upgrading into this migration keeps
-- working unchanged — billing is off by default and enforcement is off per
-- organization, so nothing here alters behaviour until both are switched on
-- (ADR-0001).
--
-- No billing history is recorded. Stripe owns history; these rows are current
-- state, overwritten as events arrive (ADR-0003).

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "billingEnforced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "seatLimit" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_stripe_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One subscription per organization.
CREATE UNIQUE INDEX "subscription_organizationId_key" ON "subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
-- Unique so a Stripe customer resolves to exactly one organization from either
-- side of the integration. Nullable columns permit many NULLs in Postgres, so
-- organizations that never subscribe are unaffected.
CREATE UNIQUE INDEX "organization_stripeCustomerId_key" ON "organization"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
