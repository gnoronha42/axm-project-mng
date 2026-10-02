import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { prisma } from './prisma.js';
import { bufferToText } from './ragExtract.js';

export type EvidenceChunk = {
  sourceType: 'document' | 'comment' | 'checklist' | 'phase_note';
  sourceId: string;
  title: string;
  excerpt: string;
  hash: string;
  author?: string;
  phase?: string;
  createdAt?: string;
};

export type ProjectDossier = {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  tags: string[];
  phases: { phase: string; status: string; notes?: string }[];
  chunks: EvidenceChunk[];
};

const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 180;

function hashOf(text: string) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= CHUNK_SIZE) return clean ? [clean] : [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const slice = clean.slice(i, i + CHUNK_SIZE);
    out.push(slice);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return out;
}

async function readDocumentText(doc: {
  id: string;
  name: string;
  mimeType: string;
  storagePath: string;
}, uploadDir: string): Promise<string> {
  try {
    const buf = await readFile(path.join(uploadDir, doc.storagePath));
    return bufferToText(buf, doc.mimeType, doc.name);
  } catch {
    return '';
  }
}

/**
 * Monta o dossiê auditável do projeto: cada evidência vira um chunk com
 * sourceType + sourceId + hash para o LLM poder citar como fonte.
 */
export async function buildProjectDossier(projectId: string, uploadDir: string): Promise<ProjectDossier> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phases: { orderBy: { sortOrder: 'asc' } },
      documents: true,
      comments: { orderBy: { createdAt: 'asc' } },
      checklist: { orderBy: { sortOrder: 'asc' } },
      extractions: true,
    },
  });
  if (!project) throw new Error('Projeto não encontrado');

  const chunks: EvidenceChunk[] = [];

  for (const doc of project.documents) {
    const extraction = project.extractions.find((e) => e.documentId === doc.id);
    const preview = extraction?.rawPreview ?? '';
    let text = preview;
    if (!text && /\.(pdf|txt|docx?)$/i.test(doc.name)) {
      text = await readDocumentText(doc, uploadDir);
    }
    if (!text.trim()) {
      chunks.push({
        sourceType: 'document',
        sourceId: doc.id,
        title: `${doc.name} (fase ${doc.phase})`,
        excerpt: `[documento sem texto extraível — categoria ${doc.category}, versão ${doc.version}]`,
        hash: hashOf(doc.id),
        phase: doc.phase,
        author: doc.uploadedBy,
        createdAt: doc.uploadedAt.toISOString(),
      });
      continue;
    }
    const parts = chunkText(text);
    parts.forEach((excerpt, idx) => {
      chunks.push({
        sourceType: 'document',
        sourceId: doc.id,
        title: `${doc.name} (fase ${doc.phase}, trecho ${idx + 1}/${parts.length})`,
        excerpt,
        hash: hashOf(`${doc.id}#${idx}:${excerpt}`),
        phase: doc.phase,
        author: doc.uploadedBy,
        createdAt: doc.uploadedAt.toISOString(),
      });
    });
  }

  for (const comment of project.comments) {
    if (!comment.content.trim()) continue;
    chunks.push({
      sourceType: 'comment',
      sourceId: comment.id,
      title: `Comentário de ${comment.author} na fase ${comment.phase}`,
      excerpt: comment.content.slice(0, CHUNK_SIZE),
      hash: hashOf(`${comment.id}:${comment.content}`),
      author: comment.author,
      phase: comment.phase,
      createdAt: comment.createdAt.toISOString(),
    });
  }

  for (const item of project.checklist) {
    chunks.push({
      sourceType: 'checklist',
      sourceId: item.id,
      title: `Checklist ${item.phase}: ${item.label}`,
      excerpt: `${item.done ? '[CONCLUÍDO]' : '[PENDENTE]'} ${item.label}`,
      hash: hashOf(item.id),
      phase: item.phase,
      createdAt: item.createdAt.toISOString(),
    });
  }

  for (const phase of project.phases) {
    if (!phase.notes?.trim()) continue;
    chunks.push({
      sourceType: 'phase_note',
      sourceId: `${project.id}:${phase.phase}`,
      title: `Nota da fase ${phase.phase} (${phase.status})`,
      excerpt: phase.notes.slice(0, CHUNK_SIZE),
      hash: hashOf(`${phase.id}:${phase.notes}`),
      phase: phase.phase,
      createdAt: phase.startedAt?.toISOString(),
    });
  }

  return {
    projectId: project.id,
    projectTitle: project.title,
    projectDescription: project.description,
    tags: project.tags,
    phases: project.phases.map((p) => ({ phase: p.phase, status: p.status, notes: p.notes ?? undefined })),
    chunks,
  };
}

/**
 * Compacta o dossiê para caber no prompt do LLM. Mantém sourceId e hash
 * para que a resposta possa citar `source_id` sem alucinar.
 */
export function dossierForPrompt(dossier: ProjectDossier, limit = 60): string {
  const sorted = [...dossier.chunks].slice(0, limit);
  const lines = sorted.map((c, idx) => {
    const idTag = `[${idx + 1}|${c.sourceType}:${c.sourceId}#${c.hash}]`;
    const meta = [c.author, c.phase, c.createdAt?.slice(0, 10)].filter(Boolean).join(' · ');
    return `${idTag} ${c.title}${meta ? ` (${meta})` : ''}\n${c.excerpt}`;
  });
  return [
    `Projeto: ${dossier.projectTitle}`,
    dossier.projectDescription,
    `Tags: ${dossier.tags.join(', ') || '—'}`,
    '',
    '# EVIDÊNCIAS DISPONÍVEIS (cite source_id completo com hash)',
    ...lines,
  ].join('\n\n');
}
