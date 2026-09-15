-- AXM SaaS Suframa PD&I — migração complementar ao Prisma schema.
-- Aplicada em produção via `prisma db push` no boot do container.
-- Este SQL documenta as novas relações de tenants/finanças/IA.

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "cnpj" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TenantMember" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  UNIQUE ("tenantId", "userId")
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT REFERENCES "Tenant"("id");
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "empresaTenantId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "institutoTenantId" TEXT;

CREATE TABLE IF NOT EXISTS "BillingPeriod" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "grossRevenue" DOUBLE PRECISION NOT NULL,
  "ipiDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "icmsDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netRevenue" DOUBLE PRECISION NOT NULL,
  "pdiObligation" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("tenantId", "year", "month")
);

CREATE TABLE IF NOT EXISTS "InvestmentAllocation" (
  "id" TEXT PRIMARY KEY,
  "billingPeriodId" TEXT NOT NULL REFERENCES "BillingPeriod"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DocumentExtraction" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL UNIQUE REFERENCES "Document"("id") ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "activitiesJson" TEXT NOT NULL DEFAULT '[]',
  "timesheetJson" TEXT NOT NULL DEFAULT '[]',
  "expensesJson" TEXT NOT NULL DEFAULT '[]',
  "rawPreview" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "GlosaRisk" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "documentId" TEXT REFERENCES "Document"("id") ON DELETE SET NULL,
  "billingPeriodId" TEXT REFERENCES "BillingPeriod"("id") ON DELETE SET NULL,
  "code" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "detailsJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SagatJob" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "billingPeriodId" TEXT REFERENCES "BillingPeriod"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'sandbox',
  "payloadJson" TEXT NOT NULL,
  "log" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
