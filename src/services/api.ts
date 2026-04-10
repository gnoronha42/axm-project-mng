import { mockComments, mockDocuments, mockProjects, mockReports } from '../mock/data';
import type { Comment, MonthlyReport, Project, ProjectDocument } from '../types';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async getProjects(): Promise<Project[]> {
    await delay();
    return mockProjects;
  },

  async getProject(id: string): Promise<Project | undefined> {
    await delay();
    return mockProjects.find((p) => p.id === id);
  },

  async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    await delay();
    return mockDocuments.filter((d) => d.projectId === projectId);
  },

  async getAllDocuments(): Promise<ProjectDocument[]> {
    await delay();
    return mockDocuments;
  },

  async getComments(projectId: string): Promise<Comment[]> {
    await delay();
    return mockComments.filter((c) => c.projectId === projectId);
  },

  async getReports(projectId: string): Promise<MonthlyReport[]> {
    await delay();
    return mockReports.filter((r) => r.projectId === projectId);
  },

  async advancePhase(projectId: string): Promise<Project> {
    await delay(600);
    const project = mockProjects.find((p) => p.id === projectId);
    if (!project) throw new Error('Projeto não encontrado');
    return project;
  },

  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    await delay();
    const newComment: Comment = {
      ...comment,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockComments.push(newComment);
    return newComment;
  },
};
