-- CreateTable
CREATE TABLE "organization_domain" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_domain_domain_key" ON "organization_domain"("domain");

-- CreateIndex
CREATE INDEX "organization_domain_organizationId_idx" ON "organization_domain"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_domain" ADD CONSTRAINT "organization_domain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
