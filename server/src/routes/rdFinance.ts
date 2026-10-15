import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { custoTotal, valorHora } from '../lib/rhCalc.js';

const VINCULOS = ['interno', 'externo', 'intercambio'];

function parseDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Rotas de cadastro: atividades, colaboradores, custos de folha e planejamento. */
export async function registerRdFinanceRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------- Atividades
  app.get('/projects/:id/activities', async (req) => {
    const { id } = req.params as { id: string };
    const { year } = req.query as { year?: string };
    return prisma.rdActivity.findMany({
      where: { projectId: id, year: year ? Number(year) : undefined },
      include: { plannedRoles: true },
      orderBy: [{ year: 'desc' }, { ordinal: 'asc' }],
    });
  });

  app.post('/projects/:id/activities', async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = req.body as Record<string, unknown>;
    if (!b.name || !b.year) return reply.status(400).send({ error: 'Nome e ano-base são obrigatórios' });
    const count = await prisma.rdActivity.count({ where: { projectId: id, year: Number(b.year) } });
    const created = await prisma.rdActivity.create({
      data: {
        projectId: id,
        year: Number(b.year),
        ordinal: count + 1,
        name: String(b.name).trim(),
        purpose: String(b.purpose ?? '').trim(),
        vinculo: VINCULOS.includes(String(b.vinculo)) ? String(b.vinculo) : 'externo',
        startDate: parseDate(b.startDate as string),
        endDate: parseDate(b.endDate as string),
        sectionId: (b.sectionId as string) || null,
      },
    });
    return reply.status(201).send(created);
  });

  app.patch('/activities/:actId', async (req, reply) => {
    const { actId } = req.params as { actId: string };
    const b = req.body as Record<string, unknown>;
    const exists = await prisma.rdActivity.findUnique({ where: { id: actId } });
    if (!exists) return reply.status(404).send({ error: 'Atividade não encontrada' });
    return prisma.rdActivity.update({
      where: { id: actId },
      data: {
        name: b.name !== undefined ? String(b.name).trim() : undefined,
        purpose: b.purpose !== undefined ? String(b.purpose).trim() : undefined,
        vinculo: VINCULOS.includes(String(b.vinculo)) ? String(b.vinculo) : undefined,
        startDate: b.startDate !== undefined ? parseDate(b.startDate as string) : undefined,
        endDate: b.endDate !== undefined ? parseDate(b.endDate as string) : undefined,
        sectionId: b.sectionId !== undefined ? ((b.sectionId as string) || null) : undefined,
      },
    });
  });

  app.delete('/activities/:actId', async (req) => {
    const { actId } = req.params as { actId: string };
    await prisma.rdActivity.delete({ where: { id: actId } }).catch(() => null);
    return { ok: true };
  });

  // ------------------------------------------------------------- Colaboradores
  app.get('/projects/:id/collaborators', async (req) => {
    const { id } = req.params as { id: string };
    const rows = await prisma.collaborator.findMany({
      where: { projectId: id },
      include: { costs: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((c) => ({
      ...c,
      costs: c.costs.map((cost) => ({
        ...cost,
        custoTotal: custoTotal(cost),
        valorHora: valorHora(cost),
      })),
    }));
  });

  app.post('/projects/:id/collaborators', async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = req.body as Record<string, unknown>;
    if (!b.name || !b.cpf) return reply.status(400).send({ error: 'Nome e CPF são obrigatórios' });
    const created = await prisma.collaborator.create({
      data: {
        projectId: id,
        name: String(b.name).trim(),
        cpf: String(b.cpf).trim(),
        cargoRais: (b.cargoRais as string)?.trim() || null,
        cargoProjeto: (b.cargoProjeto as string)?.trim() || null,
        miniCv: String(b.miniCv ?? '').trim(),
        vinculo: VINCULOS.includes(String(b.vinculo)) ? String(b.vinculo) : 'externo',
        dirInd: String(b.dirInd) === 'indireto' ? 'indireto' : 'direto',
        admissao: parseDate(b.admissao as string),
        rescisao: parseDate(b.rescisao as string),
        planned: Boolean(b.planned),
      },
    });
    return reply.status(201).send(created);
  });

  app.patch('/collaborators/:cid', async (req, reply) => {
    const { cid } = req.params as { cid: string };
    const b = req.body as Record<string, unknown>;
    const exists = await prisma.collaborator.findUnique({ where: { id: cid } });
    if (!exists) return reply.status(404).send({ error: 'Colaborador não encontrado' });
    return prisma.collaborator.update({
      where: { id: cid },
      data: {
        name: b.name !== undefined ? String(b.name).trim() : undefined,
        cpf: b.cpf !== undefined ? String(b.cpf).trim() : undefined,
        cargoRais: b.cargoRais !== undefined ? ((b.cargoRais as string)?.trim() || null) : undefined,
        cargoProjeto: b.cargoProjeto !== undefined ? ((b.cargoProjeto as string)?.trim() || null) : undefined,
        miniCv: b.miniCv !== undefined ? String(b.miniCv).trim() : undefined,
        vinculo: VINCULOS.includes(String(b.vinculo)) ? String(b.vinculo) : undefined,
        dirInd: b.dirInd !== undefined ? (String(b.dirInd) === 'indireto' ? 'indireto' : 'direto') : undefined,
        admissao: b.admissao !== undefined ? parseDate(b.admissao as string) : undefined,
        rescisao: b.rescisao !== undefined ? parseDate(b.rescisao as string) : undefined,
        planned: b.planned !== undefined ? Boolean(b.planned) : undefined,
      },
    });
  });

  app.delete('/collaborators/:cid', async (req) => {
    const { cid } = req.params as { cid: string };
    await prisma.collaborator.delete({ where: { id: cid } }).catch(() => null);
    return { ok: true };
  });

  // ------------------------------------------------- Custos de folha (por ano)
  app.put('/collaborators/:cid/cost/:year', async (req, reply) => {
    const { cid, year } = req.params as { cid: string; year: string };
    const b = req.body as Record<string, number>;
    const data = {
      salarioTotal: Number(b.salarioTotal ?? 0),
      encargosTotal: Number(b.encargosTotal ?? 0),
      beneficiosTotal: Number(b.beneficiosTotal ?? 0),
      horasAno: Number(b.horasAno ?? 0),
      horasUteis: Number(b.horasUteis ?? 0),
    };
    const cost = await prisma.collaboratorCost.upsert({
      where: { collaboratorId_year: { collaboratorId: cid, year: Number(year) } },
      create: { collaboratorId: cid, year: Number(year), ...data },
      update: data,
    });
    return reply.send({ ...cost, custoTotal: custoTotal(cost), valorHora: valorHora(cost) });
  });

  // ------------------------------------------- Planejamento (Plano de Trabalho)
  app.post('/activities/:actId/planned', async (req, reply) => {
    const { actId } = req.params as { actId: string };
    const b = req.body as Record<string, unknown>;
    if (!b.collaboratorId) return reply.status(400).send({ error: 'Colaborador obrigatório' });
    const planned = await prisma.plannedAllocation.upsert({
      where: { activityId_collaboratorId: { activityId: actId, collaboratorId: String(b.collaboratorId) } },
      create: {
        activityId: actId,
        collaboratorId: String(b.collaboratorId),
        funcao: String(b.funcao ?? '').trim(),
        horasPrevistas: Number(b.horasPrevistas ?? 0),
        valorPrevisto: Number(b.valorPrevisto ?? 0),
      },
      update: {
        funcao: String(b.funcao ?? '').trim(),
        horasPrevistas: Number(b.horasPrevistas ?? 0),
        valorPrevisto: Number(b.valorPrevisto ?? 0),
      },
    });
    return reply.status(201).send(planned);
  });

  app.delete('/planned/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.plannedAllocation.delete({ where: { id } }).catch(() => null);
    return { ok: true };
  });
}
