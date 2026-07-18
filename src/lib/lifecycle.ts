import type { TenantStatus } from '@prisma/client';
import { db } from '@/lib/db';

export const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;
export const TRIAL_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export type TenantLifecycle = 'ACTIVE' | 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'SUSPENDED' | 'DELETED';

export type LifecycleTenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: Date;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  scheduledDeletionAt: Date | null;
  suspendedAt: Date | null;
};

export function createTrialWindow(now = new Date()) {
  const trialStartedAt = now;
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_MS);
  const scheduledDeletionAt = new Date(trialEndsAt.getTime() + TRIAL_GRACE_MS);
  return { trialStartedAt, trialEndsAt, scheduledDeletionAt, suspendedAt: null };
}

export function lifecycleDates(tenant: LifecycleTenant) {
  const trialEndsAt = tenant.trialEndsAt ?? new Date(tenant.createdAt.getTime() + TRIAL_DURATION_MS);
  const scheduledDeletionAt = tenant.scheduledDeletionAt ?? new Date(trialEndsAt.getTime() + TRIAL_GRACE_MS);
  return { trialEndsAt, scheduledDeletionAt };
}

export function resolveLifecycle(tenant: LifecycleTenant, now = new Date()): TenantLifecycle {
  if (tenant.status === 'SUSPENDED') return 'SUSPENDED';
  if (tenant.status === 'ACTIVE') return 'ACTIVE';
  const { trialEndsAt, scheduledDeletionAt } = lifecycleDates(tenant);
  if (now < trialEndsAt) return 'TRIAL_ACTIVE';
  if (now < scheduledDeletionAt) return 'TRIAL_EXPIRED';
  return 'DELETED';
}

export async function reapExpiredTrials(now = new Date()) {
  const candidates = await db.tenant.findMany({
    where: { status: 'TRIAL' },
    select: {
      id: true, name: true, slug: true, status: true, createdAt: true,
      trialStartedAt: true, trialEndsAt: true, scheduledDeletionAt: true, suspendedAt: true,
    },
  });
  const ids = candidates.filter((tenant) => resolveLifecycle(tenant, now) === 'DELETED').map((tenant) => tenant.id);
  if (!ids.length) return 0;
  const result = await db.tenant.deleteMany({ where: { id: { in: ids }, status: 'TRIAL' } });
  return result.count;
}

export async function tenantLifecycleBySlug(slug: string, now = new Date()) {
  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, status: true, createdAt: true,
      trialStartedAt: true, trialEndsAt: true, scheduledDeletionAt: true, suspendedAt: true,
    },
  });
  if (!tenant) return null;
  const lifecycle = resolveLifecycle(tenant, now);
  if (lifecycle === 'DELETED') {
    await db.tenant.deleteMany({ where: { id: tenant.id, status: 'TRIAL' } });
    return { tenant, lifecycle } as const;
  }
  return { tenant, lifecycle } as const;
}

export async function tenantLifecycleById(id: string, now = new Date()) {
  const tenant = await db.tenant.findUnique({
    where: { id },
    select: {
      id: true, name: true, slug: true, status: true, createdAt: true,
      trialStartedAt: true, trialEndsAt: true, scheduledDeletionAt: true, suspendedAt: true,
    },
  });
  if (!tenant) return null;
  return { tenant, lifecycle: resolveLifecycle(tenant, now), ...lifecycleDates(tenant) };
}

export function lifecycleUpdate(status: TenantStatus, currentStatus?: TenantStatus) {
  if (status === 'TRIAL') {
    return currentStatus === 'TRIAL'
      ? { status, suspendedAt: null }
      : { status, ...createTrialWindow() };
  }
  if (status === 'SUSPENDED') return { status, suspendedAt: new Date() };
  return { status, suspendedAt: null, trialStartedAt: null, trialEndsAt: null, scheduledDeletionAt: null };
}
