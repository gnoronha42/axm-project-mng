import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { canManageFinance, resolveUserTenantId } from '../lib/tenancy.js';
import { computeObligation, validateRepartition, type AllocationCategory } from '../lib/suframaRules.js';

const CATEGORIES: AllocationCategory[] = ['ict_amazonia', 'capda_priority', 'other'];

function mapPeriod(row: {
  id: string;
  tenantId: string;
  year: number;
  month: number;
  grossRevenue: number;
  ipiDeduction: number;
  icmsDeduction: number;
  netRevenue: number;
  pdiObligation: number;
  notes: string | null;
  allocations?: { id: string; category: string; amount: number; description: string }[];
}) {
  const allocations = (row.allocations ?? []).map((a) => ({
    id: a.id,
    category: a.category as AllocationCategory,
    amount: a.amount,
    description: a.description,
  }));
  return {
    ...row,
    allocations,
    validation: validateRepartition(row.pdiObligation, allocations),
  };
}

export async function registerFiscalRoutes(app: FastifyInstance) {
  app.get('/tenants', async (req) => {
    const tenantId = req.user ? await resolveUserTenantId(req.user) : null;
    if (!tenantId) return [];
    const mine = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const others = await prisma.tenant.findMany({
      where: { id: { not: tenantId } },
      orderBy: { name: 'asc' },
    });
    return mine ? [mine, ...others] : others;
  });

  app.post('/tenants', async (req, reply) => {
    if (!req.user || !['admin', 'consultoria'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'Sem permissão para criar tenant' });
    }
    const body = req.body as { name?: string; kind?: string; cnpj?: string };
    if (!body?.name?.trim()) return reply.status(400).send({ error: 'Nome obrigatório' });
    if (!body.kind || !['consultoria', 'empresa', 'instituto'].includes(body.kind)) {
      return reply.status(400).send({ error: 'Tipo inválido (consultoria|empresa|instituto)' });
    }
    const created = await prisma.tenant.create({
      data: { name: body.name.trim(), kind: body.kind, cnpj: body.cnpj?.trim() || null },
    });
    return reply.status(201).send(created);
  });

  app.get('/billing-periods', async (req, reply) => {
    if (!req.user || !canManageFinance(req.user)) {
      return reply.status(403).send({ error: 'Sem permissão fiscal' });
    }
    const { tenantId } = req.query as { tenantId?: string };
    const mine = await resolveUserTenantId(req.user);
    const filterTenant = tenantId || mine;
    if (!filterTenant) return [];
    const rows = await prisma.billingPeriod.findMany({
      where: { tenantId: filterTenant },
      include: { allocations: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return rows.map(mapPeriod);
  });

  app.post('/billing-periods', async (req, reply) => {
    if (!req.user || !canManageFinance(req.user)) {
      return reply.status(403).send({ error: 'Sem permissão fiscal' });
    }
    const body = req.body as {
      tenantId?: string;
      year?: number;
      month?: number;
      grossRevenue?: number;
      ipiDeduction?: number;
      icmsDeduction?: number;
      notes?: string;
    };
    const tenantId = body.tenantId || (await resolveUserTenantId(req.user));
    if (!tenantId) return reply.status(400).send({ error: 'Tenant obrigatório' });
    if (!body.year || !body.month || body.month < 1 || body.month > 12) {
      return reply.status(400).send({ error: 'Ano/mês inválidos' });
    }
    if (typeof body.grossRevenue !== 'number' || body.grossRevenue < 0) {
      return reply.status(400).send({ error: 'Faturamento bruto obrigatório' });
    }

    const computed = computeObligation({
      grossRevenue: body.grossRevenue,
      ipiDeduction: body.ipiDeduction,
      icmsDeduction: body.icmsDeduction,
    });

    const row = await prisma.billingPeriod.upsert({
      where: { tenantId_year_month: { tenantId, year: body.year, month: body.month } },
      create: {
        tenantId,
        year: body.year,
        month: body.month,
        grossRevenue: body.grossRevenue,
        ipiDeduction: body.ipiDeduction ?? 0,
        icmsDeduction: body.icmsDeduction ?? 0,
        netRevenue: computed.netRevenue,
        pdiObligation: computed.pdiObligation,
        notes: body.notes?.trim() || null,
      },
      update: {
        grossRevenue: body.grossRevenue,
        ipiDeduction: body.ipiDeduction ?? 0,
        icmsDeduction: body.icmsDeduction ?? 0,
        netRevenue: computed.netRevenue,
        pdiObligation: computed.pdiObligation,
        notes: body.notes?.trim() || null,
      },
      include: { allocations: true },
    });

    return mapPeriod(row);
  });

  app.get('/billing-periods/:id/obligation', async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.billingPeriod.findUnique({
      where: { id },
      include: { allocations: true, tenant: true },
    });
    if (!row) return reply.status(404).send({ error: 'Período não encontrado' });
    return {
      tenant: { id: row.tenant.id, name: row.tenant.name, kind: row.tenant.kind, cnpj: row.tenant.cnpj },
      period: mapPeriod(row),
    };
  });

  app.post('/billing-periods/:id/allocations', async (req, reply) => {
    if (!req.user || !canManageFinance(req.user)) {
      return reply.status(403).send({ error: 'Sem permissão fiscal' });
    }
    const { id } = req.params as { id: string };
    const body = req.body as { category?: string; amount?: number; description?: string };
    const period = await prisma.billingPeriod.findUnique({ where: { id } });
    if (!period) return reply.status(404).send({ error: 'Período não encontrado' });
    if (!body.category || !CATEGORIES.includes(body.category as AllocationCategory)) {
      return reply.status(400).send({ error: 'Categoria inválida' });
    }
    if (typeof body.amount !== 'number' || body.amount < 0) {
      return reply.status(400).send({ error: 'Valor inválido' });
    }
    if (!body.description?.trim()) return reply.status(400).send({ error: 'Descrição obrigatória' });

    await prisma.investmentAllocation.create({
      data: {
        billingPeriodId: id,
        category: body.category,
        amount: body.amount,
        description: body.description.trim(),
      },
    });

    const updated = await prisma.billingPeriod.findUnique({
      where: { id },
      include: { allocations: true },
    });
    return mapPeriod(updated!);
  });
}
