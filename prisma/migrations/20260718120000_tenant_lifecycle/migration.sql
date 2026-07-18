ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scheduledDeletionAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Tenant_status_scheduledDeletionAt_idx"
  ON "Tenant"("status", "scheduledDeletionAt");
