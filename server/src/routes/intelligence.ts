import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { canRunAudit, resolveUserTenantId } from '../lib/tenancy.js';
import { buildSagatPayload } from '../lib/sagatMapper.js';
import type { AllocationCategory } from '../lib/suframaRules.js';

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function registerIntelligenceRoutes(app: FastifyInstance) {
  app.get('/documents/:id/extraction', async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.documentExtraction.findUnique({ where: { documentId: id } });
    if (!row) return reply.status(404).send({ error: 'Extração não encontrada' });
    return {
      id: row.id,
      documentId: row.documentId,
      projectId: row.projectId,
      status: row.status,
      model: row.model,
      activities: parseJson(row.activitiesJson, []),
      timesheet: parseJson(row.timesheetJson, []),
      expenses: parseJson(row.expensesJson, []),
      rawPreview: row.rawPreview,
      error: row.error,
      createdAt: row.createdAt.toISOString(),
    };
  });

  app.get('/projects/:id/glosa-risks', async (req) => {
    const { id } = req.params as { id: string };
    const rows = await prisma.glosaRisk.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      severity: r.severity,
      message: r.message,
      details: parseJson(r.detailsJson, {}),
      documentId: r.documentId,
      createdAt: r.createdAt.toISOString(),
    }));
  });

  app.get('/glosa-risks', async (req) => {
    const rows = await prisma.glosaRisk.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      code: r.code,
      severity: r.severity,
      message: r.message,
      details: parseJson(r.detailsJson, {}),
      documentId: r.documentId,
      createdAt: r.createdAt.toISOString(),
    }));
  });

  app.post('/sagat/preview', async (req, reply) => {
    if (!req.user || !canRunAudit(req.user)) {
      return reply.status(403).send({ error: 'Apenas consultoria/admin dispara SAGAT' });
    }
    const body = req.body as { billingPeriodId?: string };
    if (!body.billingPeriodId) return reply.status(400).send({ error: 'billingPeriodId obrigatório' });

    const period = await prisma.billingPeriod.findUnique({
      where: { id: body.billingPeriodId },
      include: { allocations: true, tenant: true },
    });
    if (!period) return reply.status(404).send({ error: 'Período não encontrado' });

    const payload = buildSagatPayload({
      empresaName: period.tenant.name,
      cnpj: period.tenant.cnpj,
      year: period.year,
      month: period.month,
      grossRevenue: period.grossRevenue,
      ipiDeduction: period.ipiDeduction,
      icmsDeduction: period.icmsDeduction,
      netRevenue: period.netRevenue,
      pdiObligation: period.pdiObligation,
      allocations: period.allocations.map((a) => ({
        category: a.category as AllocationCategory,
        amount: a.amount,
        description: a.description,
      })),
    });

    return { mode: 'sandbox', payload };
  });

  app.post('/sagat/sandbox-run', async (req, reply) => {
    if (!req.user || !canRunAudit(req.user)) {
      return reply.status(403).send({ error: 'Apenas consultoria/admin dispara SAGAT' });
    }
    const body = req.body as { billingPeriodId?: string };
    if (!body.billingPeriodId) return reply.status(400).send({ error: 'billingPeriodId obrigatório' });

    const period = await prisma.billingPeriod.findUnique({
      where: { id: body.billingPeriodId },
      include: { allocations: true, tenant: true },
    });
    if (!period) return reply.status(404).send({ error: 'Período não encontrado' });

    const payload = buildSagatPayload({
      empresaName: period.tenant.name,
      cnpj: period.tenant.cnpj,
      year: period.year,
      month: period.month,
      grossRevenue: period.grossRevenue,
      ipiDeduction: period.ipiDeduction,
      icmsDeduction: period.icmsDeduction,
      netRevenue: period.netRevenue,
      pdiObligation: period.pdiObligation,
      allocations: period.allocations.map((a) => ({
        category: a.category as AllocationCategory,
        amount: a.amount,
        description: a.description,
      })),
    });

    const tenantId = (await resolveUserTenantId(req.user)) ?? period.tenantId;
    const status = payload.conciliacao.compliant ? 'sandbox_ok' : 'failed';
    const log = payload.conciliacao.compliant
      ? 'Sandbox SAGAT: payload conciliado. Declaração de Veracidade pronta para hash (não enviada ao portal real).'
      : `Sandbox bloqueado: ${payload.conciliacao.alerts.map((a) => a.code).join(', ')}`;

    const job = await prisma.sagatJob.create({
      data: {
        tenantId,
        billingPeriodId: period.id,
        status,
        mode: 'sandbox',
        payloadJson: JSON.stringify(payload),
        log,
      },
    });

    return reply.status(201).send({
      id: job.id,
      status: job.status,
      mode: job.mode,
      log: job.log,
      payload,
    });
  });

  app.get('/sagat/jobs', async (req) => {
    const rows = await prisma.sagatJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows.map((j) => ({
      id: j.id,
      status: j.status,
      mode: j.mode,
      log: j.log,
      createdAt: j.createdAt.toISOString(),
      payload: parseJson(j.payloadJson, {}),
    }));
  });
}
