import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { prisma } from './lib/prisma.js';
import { advanceProjectPhase } from './lib/advancePhase.js';
import { mapComment, mapDocument, mapProject, mapReport } from './lib/mappers.js';

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
