import { createReadStream } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { listKnowledgeDocuments, searchKnowledge } from '../lib/knowledgeSearch.js';
import { resolveKnowledgeDir, resolveKnowledgeFile } from '../lib/knowledgePath.js';
import { RDA_ANEXO_V_FIELDS } from '../lib/rdTemplate.js';
import { SUFRAMA_RULES } from '../lib/suframaRules.js';
import { SAGAT_PLAYBOOK } from '../lib/sagatPlaybook.js';

export async function registerKnowledgeRoutes(app: FastifyInstance) {
  app.get('/knowledge', async () => {
    const docs = await listKnowledgeDocuments();
    return {
      livePortal: false,
      folder: 'knowledge/suframa',
      path: resolveKnowledgeDir(),
      sagatPlaybook: SAGAT_PLAYBOOK,
      rules: {
        pdiAliquot: SUFRAMA_RULES.pdiAliquot,
        paragraph4Aliquot: SUFRAMA_RULES.paragraph4Aliquot,
        minIctOfBase: SUFRAMA_RULES.minIctOfBase,
        minFndctOfBase: SUFRAMA_RULES.minFndctOfBase,
        sources: SUFRAMA_RULES.sources,
      },
      rdTemplate: RDA_ANEXO_V_FIELDS.map(({ id, label }) => ({ id, label })),
      documents: docs.map((d) => ({
        slug: d.slug,
        title: d.title,
        kind: d.kind,
        filename: d.filename,
        extractable: d.extractable,
        summary: d.summary,
        charCount: d.charCount,
        chunks: d._count.chunks,
        indexedAt: d.indexedAt.toISOString(),
      })),
    };
  });

  app.get('/knowledge/search', async (req, reply) => {
    const { q, limit } = req.query as { q?: string; limit?: string };
    if (!q?.trim()) return reply.status(400).send({ error: 'Parametro q obrigatorio' });
    const hits = await searchKnowledge(q.trim(), Math.min(20, Number(limit) || 8));
    return { query: q.trim(), livePortal: false, hits };
  });

  app.get('/knowledge/:slug/file', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const doc = await prisma.knowledgeDocument.findUnique({ where: { slug } });
    if (!doc) return reply.status(404).send({ error: 'Documento nao encontrado' });
    const full = resolveKnowledgeFile(doc.filename);
    if (!full) return reply.status(404).send({ error: 'Arquivo nao encontrado na pasta da biblioteca' });
    const mime = doc.filename.endsWith('.txt')
      ? 'text/plain; charset=utf-8'
      : 'application/pdf';
    return reply
      .type(mime)
      .header('Content-Disposition', `inline; filename="${doc.filename}"`)
      .send(createReadStream(full));
  });
}
