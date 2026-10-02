import { prisma } from './prisma.js';
import type { EvidenceChunk, ProjectDossier } from './rdEvidence.js';
import { CLAIM_LEVELS, type ClaimLevel, type RdStep } from './rdPrompts.js';

type IncomingSource = { sourceId?: string; excerpt?: string; title?: string; url?: string };
type IncomingClaim = {
  text?: string;
  nome?: string;
  objetivoTecnico?: string;
  metodo?: string;
  dificuldade?: string;
  alternativas?: string;
  resultado?: string;
  level?: string;
  question?: string;
  sources?: IncomingSource[];
};

function asLevel(raw?: string): ClaimLevel {
  const up = (raw ?? '').toUpperCase();
  return (CLAIM_LEVELS as readonly string[]).includes(up) ? (up as ClaimLevel) : 'LACUNA';
}

function activityText(c: IncomingClaim): string {
  if (c.text?.trim()) return c.text.trim();
  const parts = [
    c.nome ? `Atividade: ${c.nome}` : '',
    c.objetivoTecnico ? `Objetivo técnico: ${c.objetivoTecnico}` : '',
    c.metodo ? `Método: ${c.metodo}` : '',
    c.dificuldade ? `Dificuldade investigada: ${c.dificuldade}` : '',
    c.alternativas ? `Alternativas avaliadas: ${c.alternativas}` : '',
    c.resultado ? `Resultado/aprendizado: ${c.resultado}` : '',
  ].filter(Boolean);
  return parts.join('\n') || 'Afirmação sem texto.';
}

function findChunk(dossier: ProjectDossier, sourceId: string): EvidenceChunk | undefined {
  const cleaned = sourceId.replace(/^\[|\]$/g, '').split('|').pop()?.trim() ?? sourceId;
  const hash = cleaned.includes('#') ? cleaned.split('#').pop() : undefined;
  if (hash) {
    const byHash = dossier.chunks.find((c) => c.hash === hash);
    if (byHash) return byHash;
  }
  const idPart = cleaned.includes(':') ? cleaned.split(':').pop()?.split('#')[0] : cleaned.split('#')[0];
  return dossier.chunks.find((c) => c.sourceId === idPart);
}

function resolveSources(incoming: IncomingSource[] | undefined, dossier: ProjectDossier) {
  const out: {
    sourceType: string;
    refId?: string;
    title: string;
    excerpt: string;
    url?: string;
    hash?: string;
  }[] = [];

  for (const src of incoming ?? []) {
    const id = src.sourceId?.trim();
    if (!id) continue;
    if (id.startsWith('knowledge:')) {
      out.push({
        sourceType: 'knowledge',
        refId: id.slice('knowledge:'.length),
        title: src.title ?? id,
        excerpt: src.excerpt ?? '',
        url: src.url,
      });
      continue;
    }
    if (id.startsWith('web:') || /^https?:\/\//i.test(id)) {
      const url = src.url ?? id.replace(/^web:/, '');
      out.push({
        sourceType: 'web',
        title: src.title ?? url,
        excerpt: src.excerpt ?? '',
        url,
      });
      continue;
    }
    const chunk = findChunk(dossier, id);
    if (chunk) {
      out.push({
        sourceType: chunk.sourceType,
        refId: chunk.sourceId,
        title: chunk.title,
        excerpt: src.excerpt?.trim() || chunk.excerpt.slice(0, 400),
        hash: chunk.hash,
      });
    }
  }
  return out;
}

export async function audit(reportId: string, action: string, actorId?: string, target?: { type: string; id?: string; payload?: unknown }) {
  await prisma.rdAuditLog.create({
    data: {
      reportId,
      actorId,
      action,
      targetType: target?.type ?? 'report',
      targetId: target?.id,
      payload: JSON.stringify(target?.payload ?? {}),
    },
  });
}

export async function persistStepClaims(opts: {
  reportId: string;
  step: RdStep;
  parsed: unknown;
  dossier: ProjectDossier;
  summary?: string;
}) {
  const parsed = (opts.parsed ?? {}) as {
    summary?: string;
    claims?: IncomingClaim[];
    activities?: IncomingClaim[];
  };
  const incoming = parsed.activities?.length ? parsed.activities : (parsed.claims ?? []);
  const section = await prisma.rdSection.findUnique({
    where: { reportId_step: { reportId: opts.reportId, step: opts.step } },
  });
  if (!section) throw new Error('Seção não encontrada');

  await prisma.rdClaim.deleteMany({ where: { sectionId: section.id } });

  const created = [];
  for (const [idx, raw] of incoming.entries()) {
    const sources = resolveSources(raw.sources, opts.dossier);
    let level = asLevel(raw.level);
    const text = activityText(raw);
    let question = raw.question?.trim() || null;
    if (level === 'COMPROVADO' && sources.length === 0) {
      level = 'LACUNA';
      question = question ?? 'Não há evidência citável para sustentar esta afirmação. Qual documento comprova?';
    }
    const claim = await prisma.rdClaim.create({
      data: {
        reportId: opts.reportId,
        sectionId: section.id,
        ordinal: idx,
        text,
        level,
        question,
        sources: { create: sources.map((s) => ({
          sourceType: s.sourceType,
          refId: s.refId ?? null,
          title: s.title,
          excerpt: s.excerpt,
          url: s.url ?? null,
          hash: s.hash ?? null,
        })) },
      },
      include: { sources: true },
    });
    created.push(claim);
  }

  await prisma.rdSection.update({
    where: { id: section.id },
    data: {
      summary: parsed.summary?.trim() || opts.summary || section.summary,
      status: created.length ? 'generated' : 'empty',
    },
  });
  await prisma.rdReport.update({ where: { id: opts.reportId }, data: { updatedAt: new Date() } });
  return created;
}

export function mapClaim(c: {
  id: string;
  ordinal: number;
  text: string;
  level: string;
  question: string | null;
  approved: boolean;
  sources: {
    id: string;
    sourceType: string;
    refId: string | null;
    title: string;
    excerpt: string;
    url: string | null;
    hash: string | null;
  }[];
}) {
  return {
    id: c.id,
    ordinal: c.ordinal,
    text: c.text,
    level: c.level,
    question: c.question,
    approved: c.approved,
    sources: c.sources.map((s) => ({
      id: s.id,
      sourceType: s.sourceType,
      refId: s.refId,
      title: s.title,
      excerpt: s.excerpt,
      url: s.url,
      hash: s.hash,
    })),
  };
}

export async function loadReport(id: string) {
  const report = await prisma.rdReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true, client: true } },
      sections: {
        orderBy: { ordinal: 'asc' },
        include: { claims: { orderBy: { ordinal: 'asc' }, include: { sources: true } } },
      },
    },
  });
  if (!report) return null;
  return {
    id: report.id,
    projectId: report.projectId,
    project: report.project,
    authorId: report.authorId,
    title: report.title,
    enquadramento: report.enquadramento,
    status: report.status,
    version: report.version,
    parentId: report.parentId,
    finalizedAt: report.finalizedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    sections: report.sections.map((s) => ({
      id: s.id,
      step: s.step,
      title: s.title,
      ordinal: s.ordinal,
      summary: s.summary,
      status: s.status,
      claims: s.claims.map(mapClaim),
    })),
  };
}
