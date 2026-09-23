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

export type UserRole = 'admin' | 'analista' | 'consultoria' | 'empresa' | 'instituto';

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  createdAt: string;
}

export type TenantKind = 'consultoria' | 'empresa' | 'instituto';

export interface Tenant {
  id: string;
  name: string;
  kind: TenantKind;
  cnpj?: string | null;
}

export type AllocationCategory = 'ict_amazonia' | 'fndct' | 'capda_priority' | 'other';

export interface FiscalValidation {
  obligation: number;
  invested: number;
  gap: number;
  ict: number;
  capda: number;
  fndct: number;
  other: number;
  paragraph4: number;
  minIct: number;
  minFndct: number;
  minParagraph4: number;
  compliant: boolean;
  alerts: { code: string; severity: 'warning' | 'error'; message: string; cite?: string }[];
}

export interface KnowledgeDocument {
  slug: string;
  title: string;
  kind: string;
  filename: string;
  extractable: boolean;
  summary: string;
  charCount: number;
  chunks: number;
  indexedAt: string;
}

export interface KnowledgeHit {
  slug: string;
  title: string;
  kind: string;
  heading: string | null;
  excerpt: string;
  score: number;
}

export interface BillingPeriod {
  id: string;
  tenantId: string;
  year: number;
  month: number;
  grossRevenue: number;
  ipiDeduction: number;
  icmsDeduction: number;
  netRevenue: number;
  pdiObligation: number;
  notes?: string | null;
  allocations: { id: string; category: AllocationCategory; amount: number; description: string }[];
  validation: FiscalValidation;
}

export interface GlosaRisk {
  id: string;
  projectId?: string;
  code: string;
  severity: string;
  message: string;
  documentId?: string | null;
  createdAt: string;
}
