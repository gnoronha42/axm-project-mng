import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { prisma } from './lib/prisma.js';
import { advanceProjectPhase } from './lib/advancePhase.js';
import { mapChecklistItem, mapComment, mapDocument, mapProject, mapReport } from './lib/mappers.js';
import { PHASE_ORDER, type ProjectPhase } from './lib/phases.js';
import { CHECKLIST_DEFAULTS } from './lib/checklistDefaults.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(__dirname, '../uploads'));
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

await mkdir(UPLOAD_DIR, { recursive: true });

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
});

await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

app.get('/health', async () => ({ ok: true }));

app.get('/projects', async () => {
  const rows = await prisma.project.findMany({
    include: { phases: true },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapProject);
});

app.get('/projects/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const row = await prisma.project.findUnique({
    where: { id },
    include: { phases: true },
  });
  if (!row) return reply.status(404).send({ error: 'Projeto não encontrado' });
  return mapProject(row);
});

app.post('/projects', async (req, reply) => {
  const body = req.body as {
    title?: string;
    description?: string;
    client?: string;
    investor?: string;
    budget?: number;
    tags?: string[];
  };

  if (!body?.title?.trim()) {
    return reply.status(400).send({ error: 'Título obrigatório' });
  }
  if (!body?.client?.trim()) {
    return reply.status(400).send({ error: 'Cliente obrigatório' });
  }

  const now = new Date();
  const id = `p${Date.now()}`;

  const created = await prisma.project.create({
    data: {
      id,
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      client: body.client.trim(),
      investor: body.investor?.trim() || null,
      currentPhase: PHASE_ORDER[0],
      budget: typeof body.budget === 'number' && Number.isFinite(body.budget) ? body.budget : null,
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
      createdAt: now,
      updatedAt: now,
      phases: {
        create: PHASE_ORDER.map((phaseKey, idx) => ({
          phase: phaseKey,
          status: idx === 0 ? 'in_progress' : 'pending',
          sortOrder: idx,
          startedAt: idx === 0 ? now : null,
        })),
      },
    },
    include: { phases: true },
  });

  // Pré-popula checklist padrão de todas as fases
  const checklistData = PHASE_ORDER.flatMap((phaseKey) =>
    (CHECKLIST_DEFAULTS[phaseKey] ?? []).map((label, idx) => ({
      projectId: created.id,
      phase: phaseKey,
      label,
      sortOrder: idx,
    })),
  );
  if (checklistData.length) {
    await prisma.phaseChecklistItem.createMany({ data: checklistData });
  }

  return reply.status(201).send(mapProject(created));
});

app.patch('/projects/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as {
    title?: string;
    description?: string;
    client?: string;
    investor?: string;
    budget?: number | null;
    tags?: string[];
  };

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ error: 'Projeto não encontrado' });

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title?.trim() ?? undefined,
      description: body.description?.trim() ?? undefined,
      client: body.client?.trim() ?? undefined,
      investor: body.investor === undefined ? undefined : (body.investor?.trim() || null),
      budget: body.budget === undefined ? undefined : body.budget,
      tags: body.tags === undefined ? undefined : body.tags.filter(Boolean),
      updatedAt: new Date(),
    },
    include: { phases: true },
  });

  return mapProject(updated);
});

app.delete('/projects/:id', async (req, reply) => {
  const { id } = req.params as { id: string };

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ error: 'Projeto não encontrado' });

  await prisma.phaseChecklistItem.deleteMany({ where: { projectId: id } });
  await prisma.comment.deleteMany({ where: { projectId: id } });
  await prisma.monthlyReport.deleteMany({ where: { projectId: id } });
  await prisma.document.deleteMany({ where: { projectId: id } });
  await prisma.projectPhaseRecord.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });

  return reply.status(204).send();
});

app.post('/projects/:id/advance-phase', async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const updated = await advanceProjectPhase(id);
    if (!updated) return reply.status(404).send({ error: 'Projeto não encontrado' });
    return mapProject(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao avançar fase';
    return reply.status(400).send({ error: msg });
  }
});

app.get('/projects/:id/documents', async (req) => {
  const { id } = req.params as { id: string };
  const rows = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { uploadedAt: 'desc' },
  });
  return rows.map(mapDocument);
});

app.get('/documents', async () => {
  const rows = await prisma.document.findMany({ orderBy: { uploadedAt: 'desc' } });
  return rows.map(mapDocument);
});

app.post('/projects/:id/documents', async (req, reply) => {
  const { id: projectId } = req.params as { id: string };
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return reply.status(404).send({ error: 'Projeto não encontrado' });

  const data = await req.file();
  if (!data) return reply.status(400).send({ error: 'Arquivo obrigatório' });

  const fields = data.fields as Record<string, { value?: string } | undefined>;
  const category = fields.category?.value ?? 'outro';
  const phase = fields.phase?.value ?? project.currentPhase;
  const uploadedBy = fields.uploadedBy?.value ?? 'Usuário';

  const buffer = await data.toBuffer();
  const docId = `d${Date.now()}`;
  const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = path.join(projectId, `${docId}-${safeName}`);
  const fullPath = path.join(UPLOAD_DIR, storagePath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(fullPath, buffer);

  const row = await prisma.document.create({
    data: {
      id: docId,
      projectId,
      name: data.filename,
      category,
      phase,
      uploadedAt: new Date(),
      uploadedBy,
      size: buffer.length,
      mimeType: data.mimetype,
      storagePath,
      version: 1,
    },
  });

  return mapDocument(row);
});

app.get('/files/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return reply.status(404).send({ error: 'Arquivo não encontrado' });

  const fullPath = path.join(UPLOAD_DIR, doc.storagePath);
  const { access } = await import('node:fs/promises');
  try {
    await access(fullPath);
  } catch {
    return reply.status(404).send({ error: 'Arquivo físico não encontrado (seed sem binário)' });
  }

  return reply
    .header('Content-Type', doc.mimeType)
    .header('Content-Disposition', `inline; filename="${doc.name}"`)
    .send(await import('node:fs/promises').then((fs) => fs.readFile(fullPath)));
});

app.get('/projects/:id/comments', async (req) => {
  const { id } = req.params as { id: string };
  const rows = await prisma.comment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapComment);
});

app.post('/projects/:id/comments', async (req, reply) => {
  const { id: projectId } = req.params as { id: string };
  const body = req.body as {
    author: string;
    content: string;
    phase: string;
    parentId?: string;
  };

  if (!body?.content?.trim()) {
    return reply.status(400).send({ error: 'Conteúdo obrigatório' });
  }

  const row = await prisma.comment.create({
    data: {
      id: `c${Date.now()}`,
      projectId,
      author: body.author ?? 'Usuário',
      content: body.content.trim(),
      phase: body.phase,
      parentId: body.parentId,
      createdAt: new Date(),
    },
  });

  return mapComment(row);
});

app.get('/projects/:id/reports', async (req) => {
  const { id } = req.params as { id: string };
  const rows = await prisma.monthlyReport.findMany({
    where: { projectId: id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return rows.map(mapReport);
});

app.get('/projects/:id/checklist', async (req, reply) => {
  const { id } = req.params as { id: string };
  const { phase } = req.query as { phase?: string };

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return reply.status(404).send({ error: 'Projeto não encontrado' });

  if (phase) {
    const existing = await prisma.phaseChecklistItem.findMany({
      where: { projectId: id, phase },
      orderBy: { sortOrder: 'asc' },
    });

    if (existing.length === 0) {
      const defaults = CHECKLIST_DEFAULTS[phase as ProjectPhase];
      if (defaults?.length) {
        await prisma.phaseChecklistItem.createMany({
          data: defaults.map((label, idx) => ({
            projectId: id,
            phase,
            label,
            sortOrder: idx,
          })),
        });

        const seeded = await prisma.phaseChecklistItem.findMany({
          where: { projectId: id, phase },
          orderBy: { sortOrder: 'asc' },
        });
        return seeded.map(mapChecklistItem);
      }
    }

    return existing.map(mapChecklistItem);
  }

  const all = await prisma.phaseChecklistItem.findMany({
    where: { projectId: id },
    orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }],
  });
  return all.map(mapChecklistItem);
});

app.post('/projects/:id/checklist', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { phase?: string; label?: string };

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return reply.status(404).send({ error: 'Projeto não encontrado' });

  if (!body?.phase || !PHASE_ORDER.includes(body.phase as ProjectPhase)) {
    return reply.status(400).send({ error: 'Fase inválida' });
  }
  if (!body?.label?.trim()) {
    return reply.status(400).send({ error: 'Texto do item obrigatório' });
  }

  const max = await prisma.phaseChecklistItem.aggregate({
    where: { projectId: id, phase: body.phase },
    _max: { sortOrder: true },
  });

  const created = await prisma.phaseChecklistItem.create({
    data: {
      projectId: id,
      phase: body.phase,
      label: body.label.trim(),
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  return reply.status(201).send(mapChecklistItem(created));
});

app.patch('/checklist/:itemId', async (req, reply) => {
  const { itemId } = req.params as { itemId: string };
  const body = req.body as { done?: boolean; label?: string };

  const existing = await prisma.phaseChecklistItem.findUnique({ where: { id: itemId } });
  if (!existing) return reply.status(404).send({ error: 'Item não encontrado' });

  const updated = await prisma.phaseChecklistItem.update({
    where: { id: itemId },
    data: {
      done: body.done ?? undefined,
      label: body.label?.trim() ?? undefined,
    },
  });

  return mapChecklistItem(updated);
});

app.delete('/checklist/:itemId', async (req, reply) => {
  const { itemId } = req.params as { itemId: string };
  const existing = await prisma.phaseChecklistItem.findUnique({ where: { id: itemId } });
  if (!existing) return reply.status(404).send({ error: 'Item não encontrado' });

  await prisma.phaseChecklistItem.delete({ where: { id: itemId } });
  return reply.status(204).send();
});

app.patch('/reports/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { status?: string };

  const row = await prisma.monthlyReport.update({
    where: { id },
    data: {
      status: body.status,
      submittedAt: body.status === 'submitted' ? new Date() : undefined,
    },
  });

  return mapReport(row);
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API AXM rodando em http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
