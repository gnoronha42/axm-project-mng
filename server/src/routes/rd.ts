import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { buildProjectDossier, dossierForPrompt } from '../lib/rdEvidence.js';
import { RD_STEPS, buildStepPrompt, type RdStep } from '../lib/rdPrompts.js';
import { runRdLlm } from '../lib/rdLlm.js';
import { audit, loadReport, persistStepClaims } from '../lib/rdPersist.js';
import { researchForPrompt, researchSources } from '../lib/webSearch.js';
import { buildRdDocx } from '../lib/rdExport.js';

function isStep(v: string): v is RdStep {
  return RD_STEPS.some((s) => s.step === v);
}

async function previousJson(reportId: string) {
  const sections = await prisma.rdSection.findMany({
    where: { reportId },
    orderBy: { ordinal: 'asc' },
    include: { claims: { include: { sources: true }, orderBy: { ordinal: 'asc' } } },
  });
  return JSON.stringify(
    sections.map((s) => ({
      step: s.step,
      summary: s.summary,
      claims: s.claims.map((c) => ({ text: c.text, level: c.level, question: c.question })),
    })),
  );
}

export async function registerRdRoutes(app: FastifyInstance, uploadDir: string) {
  app.get('/rd', async (req) => {
    const { projectId } = req.query as { projectId?: string };
    const rows = await prisma.rdReport.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { project: { select: { id: true, title: true, client: true } }, _count: { select: { claims: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      project: r.project,
      title: r.title,
      enquadramento: r.enquadramento,
      status: r.status,
      version: r.version,
      claims: r._count.claims,
      updatedAt: r.updatedAt.toISOString(),
      finalizedAt: r.finalizedAt?.toISOString() ?? null,
    }));
  });

  app.post('/projects/:id/rd', async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    const body = req.body as { enquadramento?: string; title?: string };
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return reply.status(404).send({ error: 'Projeto não encontrado' });
    const enquadramento = body?.enquadramento === 'lei_informatica' ? 'lei_informatica' : 'suframa';
    const title = body?.title?.trim() || `RD técnico — ${project.title}`;

    const report = await prisma.rdReport.create({
      data: {
        projectId,
        authorId: req.user?.id,
        title,
        enquadramento,
        sections: {
          create: RD_STEPS.map((s) => ({ step: s.step, title: s.title, ordinal: s.ordinal })),
        },
      },
    });
    await audit(report.id, 'create', req.user?.id, { type: 'report', id: report.id, payload: { enquadramento } });
    return loadReport(report.id);
  });

  app.get('/rd/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const report = await loadReport(id);
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    return report;
  });

  app.post('/rd/:id/step/:step/generate', async (req, reply) => {
    const { id, step } = req.params as { id: string; step: string };
    if (!isStep(step)) return reply.status(400).send({ error: 'Passo inválido' });
    const report = await prisma.rdReport.findUnique({ where: { id } });
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    if (report.status === 'final') return reply.status(409).send({ error: 'RD finalizado — crie uma nova versão' });

    const body = req.body as { notes?: string; researchQuery?: string };
    const dossier = await buildProjectDossier(report.projectId, uploadDir);
    let research = '';
    if (body?.researchQuery?.trim()) {
      const found = await researchSources(body.researchQuery, 8);
      research = researchForPrompt(found.hits);
    }

    const prompt = buildStepPrompt(step, {
      dossier: dossierForPrompt(dossier),
      previousJson: await previousJson(id),
      research,
      userNotes: body?.notes,
    });

    try {
      const llm = await runRdLlm(prompt.system, prompt.user);
      if (!llm.parsed) return reply.status(502).send({ error: 'LLM não retornou JSON válido', raw: llm.raw.slice(0, 800) });
      await persistStepClaims({ reportId: id, step, parsed: llm.parsed, dossier });
      await audit(id, 'generate', req.user?.id, { type: 'section', id: step, payload: { model: llm.model } });
      return loadReport(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao gerar o passo';
      return reply.status(503).send({ error: message });
    }
  });

  app.patch('/rd/:id/claim/:claimId', async (req, reply) => {
    const { id, claimId } = req.params as { id: string; claimId: string };
    const report = await prisma.rdReport.findUnique({ where: { id } });
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    if (report.status === 'final') return reply.status(409).send({ error: 'RD finalizado' });
    const body = req.body as { text?: string; level?: string; question?: string | null; approved?: boolean };
    const claim = await prisma.rdClaim.findFirst({ where: { id: claimId, reportId: id } });
    if (!claim) return reply.status(404).send({ error: 'Afirmação não encontrada' });

    await prisma.rdClaim.update({
      where: { id: claimId },
      data: {
        ...(body.text !== undefined ? { text: body.text } : {}),
        ...(body.level !== undefined ? { level: body.level } : {}),
        ...(body.question !== undefined ? { question: body.question } : {}),
        ...(body.approved !== undefined ? { approved: body.approved } : {}),
      },
    });
    await audit(id, 'patch_claim', req.user?.id, { type: 'claim', id: claimId, payload: body });
    return loadReport(id);
  });

  app.post('/rd/:id/research', async (req, reply) => {
    const { id } = req.params as { id: string };
    const report = await prisma.rdReport.findUnique({ where: { id }, include: { project: true } });
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    const body = req.body as { q?: string };
    const q = body?.q?.trim() || `${report.project.title} P&D Suframa relatório demonstrativo`;
    return researchSources(q, 10);
  });

  app.post('/rd/:id/finalize', async (req, reply) => {
    const { id } = req.params as { id: string };
    const report = await prisma.rdReport.findUnique({ where: { id } });
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    if (report.status === 'final') return reply.status(409).send({ error: 'Já finalizado' });
    await prisma.rdReport.update({
      where: { id },
      data: { status: 'final', finalizedAt: new Date() },
    });
    await audit(id, 'finalize', req.user?.id, { type: 'report', id });
    return loadReport(id);
  });

  app.post('/rd/:id/version', async (req, reply) => {
    const { id } = req.params as { id: string };
    const source = await prisma.rdReport.findUnique({
      where: { id },
      include: { sections: { include: { claims: { include: { sources: true } } } } },
    });
    if (!source) return reply.status(404).send({ error: 'RD não encontrado' });

    const next = await prisma.rdReport.create({
      data: {
        projectId: source.projectId,
        authorId: req.user?.id,
        title: source.title,
        enquadramento: source.enquadramento,
        version: source.version + 1,
        parentId: source.id,
        sections: {
          create: RD_STEPS.map((s) => {
            const prev = source.sections.find((x) => x.step === s.step);
            return {
              step: s.step,
              title: s.title,
              ordinal: s.ordinal,
              summary: prev?.summary ?? '',
              status: prev?.status ?? 'pending',
            };
          }),
        },
      },
    });

    for (const section of source.sections) {
      const dest = await prisma.rdSection.findUnique({
        where: { reportId_step: { reportId: next.id, step: section.step } },
      });
      if (!dest) continue;
      for (const claim of section.claims) {
        await prisma.rdClaim.create({
          data: {
            reportId: next.id,
            sectionId: dest.id,
            ordinal: claim.ordinal,
            text: claim.text,
            level: claim.level,
            question: claim.question,
            approved: false,
            sources: {
              create: claim.sources.map((s) => ({
                sourceType: s.sourceType,
                refId: s.refId,
                title: s.title,
                excerpt: s.excerpt,
                url: s.url,
                hash: s.hash,
              })),
            },
          },
        });
      }
    }
    await audit(next.id, 'new_version', req.user?.id, { type: 'report', id: next.id, payload: { from: source.id } });
    return loadReport(next.id);
  });

  app.get('/rd/:id/export', async (req, reply) => {
    const { id } = req.params as { id: string };
    const report = await loadReport(id);
    if (!report) return reply.status(404).send({ error: 'RD não encontrado' });
    const buf = await buildRdDocx({
      title: report.title,
      enquadramento: report.enquadramento,
      version: report.version,
      projectTitle: report.project.title,
      projectClient: report.project.client,
      sections: report.sections,
    });
    const filename = `${report.title.replace(/[^\w\-]+/g, '_').slice(0, 60)}_v${report.version}.docx`;
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buf);
  });

  app.get('/rd/:id/logs', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.rdReport.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return reply.status(404).send({ error: 'RD não encontrado' });
    const logs = await prisma.rdAuditLog.findMany({ where: { reportId: id }, orderBy: { createdAt: 'desc' }, take: 80 });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      actorId: l.actorId,
      targetType: l.targetType,
      targetId: l.targetId,
      createdAt: l.createdAt.toISOString(),
    }));
  });
}
