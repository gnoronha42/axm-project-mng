import { prisma } from './prisma.js';
import type { AuthUser } from './auth.js';

export const TENANT_KINDS = ['consultoria', 'empresa', 'instituto'] as const;
export type TenantKind = (typeof TENANT_KINDS)[number];

export async function ensureDefaultTenants() {
  const kinds: { kind: TenantKind; name: string }[] = [
    { kind: 'consultoria', name: 'AXM Consultoria' },
    { kind: 'empresa', name: 'Empresa Beneficiária (seed)' },
    { kind: 'instituto', name: 'Instituto / ICT (seed)' },
  ];

  const created: Record<string, string> = {};
  for (const item of kinds) {
    const existing = await prisma.tenant.findFirst({ where: { kind: item.kind } });
    if (existing) {
      created[item.kind] = existing.id;
      continue;
    }
    const row = await prisma.tenant.create({ data: { name: item.name, kind: item.kind } });
    created[item.kind] = row.id;
  }

  const users = await prisma.user.findMany({ where: { tenantId: null } });
  for (const user of users) {
    const kind = (['admin', 'consultoria'].includes(user.role) ? 'consultoria' : user.role) as TenantKind;
    const tenantId = created[TENANT_KINDS.includes(kind) ? kind : 'consultoria'];
    await prisma.user.update({ where: { id: user.id }, data: { tenantId } });
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      update: { role: user.role },
      create: { tenantId, userId: user.id, role: user.role },
    });
  }

  const consultoriaId = created.consultoria;
  await prisma.project.updateMany({
    where: { tenantId: null },
    data: {
      tenantId: consultoriaId,
      empresaTenantId: created.empresa,
      institutoTenantId: created.instituto,
    },
  });

  return created;
}

export function canManageFinance(user: AuthUser) {
  return ['admin', 'consultoria', 'empresa'].includes(user.role);
}

export function canRunAudit(user: AuthUser) {
  return ['admin', 'consultoria'].includes(user.role);
}

export async function resolveUserTenantId(user: AuthUser): Promise<string | null> {
  if (user.tenantId) return user.tenantId;
  const row = await prisma.user.findUnique({ where: { id: user.id } });
  return row?.tenantId ?? null;
}
