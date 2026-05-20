export const ProjectPhase = {
  RECEBIMENTO: 'RECEBIMENTO',
  PLANO_TRABALHO: 'PLANO_TRABALHO',
  REVISAO_AJUSTES: 'REVISAO_AJUSTES',
  EXECUCAO_CLIENTE: 'EXECUCAO_CLIENTE',
  APROVACAO_CLIENTE: 'APROVACAO_CLIENTE',
  ELABORACAO_CONVENIO: 'ELABORACAO_CONVENIO',
  ASSINATURA_CONVENIO: 'ASSINATURA_CONVENIO',
  EXECUCAO_PROJETO: 'EXECUCAO_PROJETO',
  VALIDACAO: 'VALIDACAO',
} as const;

export type ProjectPhase = (typeof ProjectPhase)[keyof typeof ProjectPhase];

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  [ProjectPhase.RECEBIMENTO]: 'Recebimento do Processo',
  [ProjectPhase.PLANO_TRABALHO]: 'Plano de Trabalho',
  [ProjectPhase.REVISAO_AJUSTES]: 'Revisão e Ajustes',
  [ProjectPhase.EXECUCAO_CLIENTE]: 'Execução do Cliente',
  [ProjectPhase.APROVACAO_CLIENTE]: 'Aprovação do Cliente',
  [ProjectPhase.ELABORACAO_CONVENIO]: 'Elaboração do Convênio',
  [ProjectPhase.ASSINATURA_CONVENIO]: 'Assinatura do Convênio',
  [ProjectPhase.EXECUCAO_PROJETO]: 'Execução do Projeto',
  [ProjectPhase.VALIDACAO]: 'Validação',
};

export const PHASE_ORDER: ProjectPhase[] = [
  ProjectPhase.RECEBIMENTO,
  ProjectPhase.PLANO_TRABALHO,
  ProjectPhase.REVISAO_AJUSTES,
  ProjectPhase.EXECUCAO_CLIENTE,
  ProjectPhase.APROVACAO_CLIENTE,
  ProjectPhase.ELABORACAO_CONVENIO,
  ProjectPhase.ASSINATURA_CONVENIO,
  ProjectPhase.EXECUCAO_PROJETO,
  ProjectPhase.VALIDACAO,
];

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface PhaseInfo {
  phase: ProjectPhase;
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export type DocumentCategory =
  | 'plano_trabalho'
  | 'nota_fiscal'
  | 'relatorio_tecnico'
  | 'convenio'
  | 'comprovante'
  | 'outro';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  phase: ProjectPhase;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  mimeType: string;
  url: string;
  version: number;
}

export interface Comment {
  id: string;
  projectId: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  phase: ProjectPhase;
  parentId?: string;
  resolved?: boolean;
}

export interface MonthlyReport {
  id: string;
  projectId: string;
  month: number;
  year: number;
  description: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected';
  submittedAt?: string;
  documents: string[];
}

export interface ChecklistItem {
  id: string;
  projectId: string;
  phase: ProjectPhase;
  label: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  investor?: string;
  currentPhase: ProjectPhase;
  phases: PhaseInfo[];
  createdAt: string;
  updatedAt: string;
  budget?: number;
  tags: string[];
}
