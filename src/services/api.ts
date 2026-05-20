import type { Comment, MonthlyReport, Project, ProjectDocument } from '../types';
import { ApiError, request, uploadDocument } from './apiClient';

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
