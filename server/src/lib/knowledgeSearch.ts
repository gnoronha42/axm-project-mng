import { prisma } from './prisma.js';

const STOP = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'os', 'as', 'para', 'com', 'no', 'na',
  'que', 'por', 'um', 'uma', 'ao', '', 'se', 'ou', 'art', 'n', 'n',
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9%]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

function score(content: string, terms: string[]): number {
  const hay = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let s = 0;
  for (const term of terms) {
    if (!hay.includes(term)) continue;
    const hits = hay.split(term).length - 1;
    s += hits * (term.length > 5 ? 2 : 1);
  }
  return s;
}

export type KnowledgeHit = {
  slug: string;
  title: string;
  kind: string;
  heading: string | null;
  excerpt: string;
  score: number;
};

export async function searchKnowledge(query: string, limit = 8): Promise<KnowledgeHit[]> {
  const terms = tokenize(query);
  if (!terms.length) return [];

  const or = terms.flatMap((term) => [
    { content: { contains: term, mode: 'insensitive' as const } },
  ]);

  const rows = await prisma.knowledgeChunk.findMany({
    where: { OR: or },
    include: { document: true },
    take: 80,
  });

  return rows
    .map((row) => ({
      slug: row.document.slug,
      title: row.document.title,
      kind: row.document.kind,
      heading: row.heading,
      excerpt: row.content.slice(0, 420).trim(),
      score: score(`${row.document.title} ${row.heading ?? ''} ${row.content}`, terms),
    }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function listKnowledgeDocuments() {
  return prisma.knowledgeDocument.findMany({
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { chunks: true } } },
  });
}
