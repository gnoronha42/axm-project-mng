import type { Comment, Document, MonthlyReport, Project, ProjectPhaseRecord } from '@prisma/client';

function getPublicBase() {
  const explicit = process.env.API_PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) return renderUrl.replace(/\/$/, '');
  return '/api';
}

type ProjectWithRelations = Project & {
  phases: ProjectPhaseRecord[];
};

export function mapProject(row: ProjectWithRelations) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    client: row.client,
    investor: row.investor ?? undefined,
    currentPhase: row.currentPhase,
    budget: row.budget ?? undefined,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    phases: row.phases
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        phase: p.phase,
        status: p.status as 'pending' | 'in_progress' | 'completed' | 'blocked',
        startedAt: p.startedAt?.toISOString().slice(0, 10),
        completedAt: p.completedAt?.toISOString().slice(0, 10),
        notes: p.notes ?? undefined,
      })),
  };
}

export function mapDocument(row: Document) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    category: row.category,
    phase: row.phase,
    uploadedAt: row.uploadedAt.toISOString(),
    uploadedBy: row.uploadedBy,
    size: row.size,
    mimeType: row.mimeType,
    url: `${getPublicBase()}/files/${row.id}`,
    version: row.version,
  };
}

export function mapComment(row: Comment) {
  return {
    id: row.id,
    projectId: row.projectId,
    author: row.author,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    phase: row.phase,
    parentId: row.parentId ?? undefined,
    resolved: row.resolved,
  };
}

export function mapReport(row: MonthlyReport) {
  return {
    id: row.id,
    projectId: row.projectId,
    month: row.month,
    year: row.year,
    description: row.description,
    status: row.status as 'draft' | 'submitted' | 'validated' | 'rejected',
    submittedAt: row.submittedAt?.toISOString(),
    documents: row.documentIds,
  };
}
