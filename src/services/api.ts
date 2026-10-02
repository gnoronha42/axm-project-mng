import type {
  ChecklistItem,
  Comment,
  MonthlyReport,
  Project,
  ProjectDocument,
  ProjectPhase,
  Tenant,
  BillingPeriod,
  GlosaRisk,
  AllocationCategory,
  KnowledgeDocument,
  KnowledgeHit,
  TeamUser,
  RdReport,
  RdReportListItem,
  RdResearchHit,
} from '../types';
import { ApiError, request, uploadDocument, fetchBlob } from './apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function withMock<T>(fn: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> {
  if (USE_MOCK) return mockFn();
  try {
    return await fn();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[API] Falha na API, usando mock:', err);
      return mockFn();
    }
    throw err;
  }
}

export const api = {
  async getProjects(): Promise<Project[]> {
    return withMock(
      () => request<Project[]>('/projects'),
      async () => (await import('../mock/data')).mockProjects,
    );
  },

  async getProject(id: string): Promise<Project | undefined> {
    return withMock(
      async () => {
        try {
          return await request<Project>(`/projects/${id}`);
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) return undefined;
          throw e;
        }
      },
      async () => (await import('../mock/data')).mockProjects.find((p) => p.id === id),
    );
  },

  async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    return withMock(
      () => request<ProjectDocument[]>(`/projects/${projectId}/documents`),
      async () => (await import('../mock/data')).mockDocuments.filter((d) => d.projectId === projectId),
    );
  },

  async getAllDocuments(): Promise<ProjectDocument[]> {
    return withMock(
      () => request<ProjectDocument[]>('/documents'),
      async () => (await import('../mock/data')).mockDocuments,
    );
  },

  async getComments(projectId: string): Promise<Comment[]> {
    return withMock(
      () => request<Comment[]>(`/projects/${projectId}/comments`),
      async () => (await import('../mock/data')).mockComments.filter((c) => c.projectId === projectId),
    );
  },

  async getReports(projectId: string): Promise<MonthlyReport[]> {
    return withMock(
      () => request<MonthlyReport[]>(`/projects/${projectId}/reports`),
      async () => (await import('../mock/data')).mockReports.filter((r) => r.projectId === projectId),
    );
  },

  async advancePhase(projectId: string): Promise<Project> {
    return withMock(
      () => request<Project>(`/projects/${projectId}/advance-phase`, { method: 'POST' }),
      async () => {
        const { mockProjects } = await import('../mock/data');
        const project = mockProjects.find((p) => p.id === projectId);
        if (!project) throw new Error('Projeto não encontrado');
        return project;
      },
    );
  },

  async createProject(input: {
    title: string;
    description?: string;
    client: string;
    investor?: string;
    budget?: number;
    tags?: string[];
  }): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async updateProject(id: string, input: Partial<{
    title: string;
    description: string;
    client: string;
    investor: string;
    budget: number | null;
    tags: string[];
  }>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async deleteProject(id: string): Promise<void> {
    await request<void>(`/projects/${id}`, { method: 'DELETE' });
  },

  async getChecklist(projectId: string, phase?: ProjectPhase): Promise<ChecklistItem[]> {
    const qs = phase ? `?phase=${phase}` : '';
    return request<ChecklistItem[]>(`/projects/${projectId}/checklist${qs}`);
  },

  async addChecklistItem(projectId: string, phase: ProjectPhase, label: string): Promise<ChecklistItem> {
    return request<ChecklistItem>(`/projects/${projectId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase, label }),
    });
  },

  async updateChecklistItem(
    itemId: string,
    patch: { done?: boolean; label?: string },
  ): Promise<ChecklistItem> {
    return request<ChecklistItem>(`/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  },

  async deleteChecklistItem(itemId: string): Promise<void> {
    await request<void>(`/checklist/${itemId}`, { method: 'DELETE' });
  },

  getUsers: () => request<TeamUser[]>('/users'),
  createUser: (input: { name: string; email: string; password: string }) =>
    request<TeamUser>('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  getTenants: () => request<Tenant[]>('/tenants'),
  createTenant: (input: { name: string; kind: Tenant['kind']; cnpj?: string }) =>
    request<Tenant>('/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  getBillingPeriods: (tenantId?: string) =>
    request<BillingPeriod[]>(`/billing-periods${tenantId ? `?tenantId=${tenantId}` : ''}`),
  saveBillingPeriod: (input: {
    tenantId?: string;
    year: number;
    month: number;
    grossRevenue: number;
    ipiDeduction?: number;
    icmsDeduction?: number;
    notes?: string;
  }) =>
    request<BillingPeriod>('/billing-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  addAllocation: (periodId: string, input: { category: AllocationCategory; amount: number; description: string }) =>
    request<BillingPeriod>(`/billing-periods/${periodId}/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  getGlosaRisks: (projectId?: string) =>
    request<GlosaRisk[]>(projectId ? `/projects/${projectId}/glosa-risks` : '/glosa-risks'),
  sagatPreview: (billingPeriodId: string) =>
    request<{ payload: unknown }>(`/sagat/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingPeriodId }),
    }),
  sagatSandboxRun: (billingPeriodId: string) =>
    request<{ id: string; status: string; log: string; payload: unknown }>(`/sagat/sandbox-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingPeriodId }),
    }),
  getSagatJobs: () => request<{ id: string; status: string; log: string; createdAt: string }[]>('/sagat/jobs'),
  getKnowledge: () =>
    request<{
      livePortal: boolean;
      documents: KnowledgeDocument[];
      rdTemplate: { id: string; label: string }[];
      rules: Record<string, unknown>;
    }>('/knowledge'),
  searchKnowledge: (q: string) =>
    request<{ query: string; hits: KnowledgeHit[] }>(
      `/knowledge/search?q=${encodeURIComponent(q)}`,
    ),
  openKnowledgePdf: async (slug: string) => {
    const blob = await fetchBlob(`/knowledge/${slug}/file`);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
  },

  listRdReports: (projectId?: string) =>
    request<RdReportListItem[]>(`/rd${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`),
  getRdReport: (id: string) => request<RdReport>(`/rd/${id}`),
  createRdReport: (projectId: string, input: { enquadramento: string; title?: string }) =>
    request<RdReport>(`/projects/${projectId}/rd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  generateRdStep: (id: string, step: string, input?: { notes?: string; researchQuery?: string }) =>
    request<RdReport>(`/rd/${id}/step/${step}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input ?? {}),
    }),
  patchRdClaim: (id: string, claimId: string, patch: { text?: string; level?: string; question?: string | null; approved?: boolean }) =>
    request<RdReport>(`/rd/${id}/claim/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  researchRd: (id: string, q?: string) =>
    request<{ query: string; webEnabled: boolean; hits: RdResearchHit[] }>(`/rd/${id}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q }),
    }),
  finalizeRd: (id: string) => request<RdReport>(`/rd/${id}/finalize`, { method: 'POST' }),
  newRdVersion: (id: string) => request<RdReport>(`/rd/${id}/version`, { method: 'POST' }),
  downloadRdDocx: async (id: string, filename: string) => {
    const blob = await fetchBlob(`/rd/${id}/export`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    return withMock(
      () =>
        request<Comment>(`/projects/${comment.projectId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(comment),
        }),
      async () => {
        const { mockComments } = await import('../mock/data');
        const newComment: Comment = {
          ...comment,
          id: `c${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        mockComments.push(newComment);
        return newComment;
      },
    );
  },

  uploadDocument,
};
