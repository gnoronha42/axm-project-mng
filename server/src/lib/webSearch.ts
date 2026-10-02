import { searchKnowledge } from './knowledgeSearch.js';

export type ResearchHit = {
  sourceType: 'knowledge' | 'web';
  sourceId: string;
  title: string;
  excerpt: string;
  url?: string;
};

function braveConfigured() {
  return Boolean(process.env.BRAVE_API_KEY?.trim());
}

async function searchBrave(query: string, limit: number): Promise<ResearchHit[]> {
  const key = process.env.BRAVE_API_KEY?.trim();
  if (!key) return [];

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(8, limit)));
  url.searchParams.set('country', 'BR');
  url.searchParams.set('search_lang', 'pt');

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    web?: { results?: { title?: string; url?: string; description?: string }[] };
  };
  return (data.web?.results ?? []).map((r) => ({
    sourceType: 'web' as const,
    sourceId: `web:${r.url ?? ''}`,
    title: r.title ?? r.url ?? 'Resultado web',
    excerpt: r.description ?? '',
    url: r.url,
  }));
}

export async function researchSources(query: string, limit = 8): Promise<{
  query: string;
  webEnabled: boolean;
  hits: ResearchHit[];
}> {
  const q = query.trim();
  const [knowledge, web] = await Promise.all([
    searchKnowledge(q, Math.min(8, limit)),
    searchBrave(q, Math.min(6, limit)),
  ]);

  const hits: ResearchHit[] = [
    ...knowledge.map((h) => ({
      sourceType: 'knowledge' as const,
      sourceId: `knowledge:${h.slug}`,
      title: h.title,
      excerpt: h.excerpt,
      url: undefined,
    })),
    ...web,
  ];

  return { query: q, webEnabled: braveConfigured(), hits };
}

export function researchForPrompt(hits: ResearchHit[]): string {
  if (!hits.length) return 'Nenhum resultado de pesquisa.';
  return hits
    .map((h) => `[${h.sourceId}] ${h.title}\n${h.excerpt}${h.url ? `\n${h.url}` : ''}`)
    .join('\n\n');
}
