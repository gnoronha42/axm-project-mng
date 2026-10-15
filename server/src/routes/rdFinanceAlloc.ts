import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { consolidate } from '../lib/rhCalc.js';
import {
  getValorHora,
  loadAllocationRaw,
  mapAllocation,
  recomputeAndReconcile,
  validateAllocation,
} from '../lib/rhService.js';
import { valorAlocacao } from '../lib/rhCalc.js';
import { buildFinanceWorkbook } from '../lib/financeExport.js';

/** Rotas de lançamentos de RH, conciliação de comprovantes, resumo e export. */
export async function registerRdFinanceAllocRoutes(app: FastifyInstance) {
  // -------------------------------------------------------- Lançamentos (RH)
  app.get('/projects/:id/rh-allocations', async (req) => {
    const { id } = req.params as { id: string };
    const { year, month } = req.query as { year?: string; month?: string };
    const rows = await prisma.rhAllocation.findMany({
      where: {
        projectId: id,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
      },
      include: { collaborator: true, activity: { include: { plannedRoles: true } }, evidences: true },
      orderBy: [{ month: 'asc' }, { collaborator: { name: 'asc' } }],
    });
    const out = [];
    for (const row of rows) out.push(mapAllocation(row, await validateAllocation(row)));
    return out;
  });

  app.post('/projects/:id/rh-allocations', async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = req.body as Record<string, unknown>;
    if (!b.activityId || !b.collaboratorId || !b.year || !b.month) {
      return reply.status(400).send({ error: 'Atividade, colaborador, ano e mês são obrigatórios' });
    }
    const year = Number(b.year);
    const horas = Number(b.horas ?? 0);
    const vHora = await getValorHora(String(b.collaboratorId), year);
    const created = await prisma.rhAllocation.create({
      data: {
        projectId: id,
        activityId: String(b.activityId),
        collaboratorId: String(b.collaboratorId),
        year,
        month: Number(b.month),
        horas,
        valorHora: vHora,
        valorTotal: valorAlocacao(horas, vHora),
        justificativa: String(b.justificativa ?? '').trim(),
        claimId: (b.claimId as string) || null,
      },
    });
    return reply.status(201).send(await recomputeAndReconcile(created.id));
  });

  app.patch('/rh-allocations/:allocId', async (req, reply) => {
    const { allocId } = req.params as { allocId: string };
    const b = req.body as Record<string, unknown>;
    const exists = await prisma.rhAllocation.findUnique({ where: { id: allocId } });
    if (!exists) return reply.status(404).send({ error: 'Lançamento não encontrado' });
    await prisma.rhAllocation.update({
      where: { id: allocId },
      data: {
        horas: b.horas !== undefined ? Number(b.horas) : undefined,
        month: b.month !== undefined ? Number(b.month) : undefined,
        activityId: b.activityId !== undefined ? String(b.activityId) : undefined,
        justificativa: b.justificativa !== undefined ? String(b.justificativa).trim() : undefined,
        claimId: b.claimId !== undefined ? ((b.claimId as string) || null) : undefined,
      },
    });
    return recomputeAndReconcile(allocId);
  });

  app.delete('/rh-allocations/:allocId', async (req) => {
    const { allocId } = req.params as { allocId: string };
    await prisma.rhAllocation.delete({ where: { id: allocId } }).catch(() => null);
    return { ok: true };
  });

  // ------------------------------------------- Comprovantes / conciliação
  app.post('/rh-allocations/:allocId/evidence', async (req, reply) => {
    const { allocId } = req.params as { allocId: string };
    const b = req.body as Record<string, unknown>;
    if (!b.documentId) return reply.status(400).send({ error: 'documentId obrigatório' });
    await prisma.financialEvidence.create({
      data: {
        allocationId: allocId,
        documentId: String(b.documentId),
        kind: String(b.kind ?? 'comprovante_pagamento'),
        valorComprovado: b.valorComprovado !== undefined ? Number(b.valorComprovado) : null,
        conferido: Boolean(b.conferido),
        observacao: String(b.observacao ?? '').trim(),
      },
    });
    return reply.status(201).send(await recomputeAndReconcile(allocId));
  });

  app.patch('/evidence/:evId', async (req, reply) => {
    const { evId } = req.params as { evId: string };
    const b = req.body as Record<string, unknown>;
    const ev = await prisma.financialEvidence.findUnique({ where: { id: evId } });
    if (!ev) return reply.status(404).send({ error: 'Evidência não encontrada' });
    await prisma.financialEvidence.update({
      where: { id: evId },
      data: {
        valorComprovado: b.valorComprovado !== undefined ? Number(b.valorComprovado) : undefined,
        conferido: b.conferido !== undefined ? Boolean(b.conferido) : undefined,
        observacao: b.observacao !== undefined ? String(b.observacao).trim() : undefined,
      },
    });
    return recomputeAndReconcile(ev.allocationId);
  });

  app.delete('/evidence/:evId', async (req) => {
    const { evId } = req.params as { evId: string };
    const ev = await prisma.financialEvidence.findUnique({ where: { id: evId } });
    await prisma.financialEvidence.delete({ where: { id: evId } }).catch(() => null);
    if (ev) return recomputeAndReconcile(ev.allocationId);
    return { ok: true };
  });

  // -------------------------------------------------------- Resumo consolidado
  app.get('/projects/:id/rd-finance/:year/summary', async (req) => {
    const { id, year } = req.params as { id: string; year: string };
    const rows = await prisma.rhAllocation.findMany({
      where: { projectId: id, year: Number(year) },
      include: { collaborator: true, activity: { include: { plannedRoles: true } }, evidences: true },
    });
    const mapped = [];
    for (const row of rows) mapped.push(mapAllocation(row, await validateAllocation(row)));

    const consolidation = consolidate(
      rows.map((r) => ({
        vinculo: r.activity.vinculo,
        activityId: r.activityId,
        activityName: r.activity.name,
        collaboratorId: r.collaboratorId,
        horas: r.horas,
        valorTotal: r.valorTotal,
      })),
    );

    const errors = mapped.flatMap((m) => m.validation.findings.filter((f) => f.severity === 'error'));
    const warnings = mapped.flatMap((m) => m.validation.findings.filter((f) => f.severity === 'warning'));
    const comprovados = mapped.filter((m) => m.validation.nivel === 'COMPROVADO');
    const cobertura = mapped.length ? Math.round((comprovados.length / mapped.length) * 100) : 0;

    return {
      year: Number(year),
      consolidation,
      totals: {
        lancamentos: mapped.length,
        erros: errors.length,
        alertas: warnings.length,
        comprovados: comprovados.length,
        coberturaEvidencia: cobertura,
      },
      findings: { errors, warnings },
    };
  });

  // ----------------------------------------------------------------- Export
  app.get('/projects/:id/rd-finance/:year/export', async (req, reply) => {
    const { id, year } = req.params as { id: string; year: string };
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return reply.status(404).send({ error: 'Projeto não encontrado' });
    const buffer = await buildFinanceWorkbook(id, Number(year));
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="RD-Financeiro-${year}.xlsx"`);
    return reply.send(buffer);
  });
}
