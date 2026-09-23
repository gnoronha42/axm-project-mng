import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma.js';
import { resolveKnowledgeDir } from './knowledgePath.js';

type CatalogDoc = {
  slug: string;
  title: string;
  kind: string;
  filename: string;
  textFile: string;
  extractable: boolean;
  summary: string;
};

const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 180;

function splitChunks(text: string): { heading: string | null; content: string }[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
  if (!normalized) return [];

  const parts: { heading: string | null; content: string }[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + CHUNK_SIZE);
    let slice = normalized.slice(start, end);
    if (end < normalized.length) {
      const lastBreak = slice.lastIndexOf('\n');
      if (lastBreak > CHUNK_SIZE / 2) slice = slice.slice(0, lastBreak);
    }
    const headingMatch = slice.match(/^(?:Art(?:igo)?\.?\s*\d+|�\s*\d+|CAP�TULO\s+[IVX]+|[0-9]+\.\s+[A-Z�����].{0,80})/m);
    parts.push({
      heading: headingMatch?.[0]?.slice(0, 120) ?? null,
      content: slice.trim(),
    });
    if (start + slice.length >= normalized.length) break;
    start += Math.max(1, slice.length - CHUNK_OVERLAP);
  }
  return parts.filter((p) => p.content.length > 40);
}

export async function ensureKnowledgeIndex() {
  const dir = resolveKnowledgeDir();
  const catalogRaw = await readFile(path.join(dir, 'catalog.json'), 'utf8').catch(() => null);
  if (!catalogRaw) {
    console.warn(`[knowledge] cat�logo n�o encontrado em ${dir}`);
    return { indexed: 0, dir };
  }

  const catalog = JSON.parse(catalogRaw) as { documents: CatalogDoc[] };
  let indexed = 0;

  for (const doc of catalog.documents) {
    const textPath = path.join(dir, doc.textFile);
    const text = await readFile(textPath, 'utf8').catch(() => '');
    const chunks = splitChunks(text);

    const row = await prisma.knowledgeDocument.upsert({
      where: { slug: doc.slug },
      create: {
        slug: doc.slug,
        title: doc.title,
        kind: doc.kind,
        filename: doc.filename,
        extractable: doc.extractable,
        summary: doc.summary,
        charCount: text.length,
      },
      update: {
        title: doc.title,
        kind: doc.kind,
        filename: doc.filename,
        extractable: doc.extractable,
        summary: doc.summary,
        charCount: text.length,
        indexedAt: new Date(),
      },
    });

    await prisma.knowledgeChunk.deleteMany({ where: { documentId: row.id } });
    if (chunks.length) {
      await prisma.knowledgeChunk.createMany({
        data: chunks.map((chunk, ordinal) => ({
          documentId: row.id,
          ordinal,
          heading: chunk.heading,
          content: chunk.content,
        })),
      });
    }
    indexed += 1;
  }

  console.log(`[knowledge] ${indexed} documentos indexados a partir de ${dir}`);
  return { indexed, dir };
}
