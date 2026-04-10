import type { Comment, MonthlyReport, Project, ProjectDocument } from '../types';
import { ProjectPhase } from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Modernização da Infraestrutura de TI',
    description: 'Projeto de modernização completa da infraestrutura tecnológica do município.',
    client: 'Prefeitura Municipal de Aracaju',
    investor: 'Banco do Brasil',
    currentPhase: ProjectPhase.EXECUCAO_PROJETO,
    budget: 2500000,
    tags: ['infraestrutura', 'TI', 'modernização'],
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    phases: [
      { phase: ProjectPhase.RECEBIMENTO, status: 'completed', startedAt: '2025-08-15', completedAt: '2025-08-20' },
      { phase: ProjectPhase.PLANO_TRABALHO, status: 'completed', startedAt: '2025-08-21', completedAt: '2025-09-10' },
      { phase: ProjectPhase.REVISAO_AJUSTES, status: 'completed', startedAt: '2025-09-11', completedAt: '2025-09-25' },
      { phase: ProjectPhase.EXECUCAO_CLIENTE, status: 'completed', startedAt: '2025-09-26', completedAt: '2025-10-15' },
      { phase: ProjectPhase.APROVACAO_CLIENTE, status: 'completed', startedAt: '2025-10-16', completedAt: '2025-10-20' },
      { phase: ProjectPhase.ELABORACAO_CONVENIO, status: 'completed', startedAt: '2025-10-21', completedAt: '2025-11-10' },
      { phase: ProjectPhase.ASSINATURA_CONVENIO, status: 'completed', startedAt: '2025-11-11', completedAt: '2025-11-15' },
      { phase: ProjectPhase.EXECUCAO_PROJETO, status: 'in_progress', startedAt: '2025-11-16' },
      { phase: ProjectPhase.VALIDACAO, status: 'pending' },
    ],
  },
  {
    id: '2',
    title: 'Programa de Capacitação Digital',
    description: 'Capacitação de servidores públicos em ferramentas digitais e gestão de dados.',
    client: 'Secretaria de Educação - SE',
    investor: 'BNDES',
    currentPhase: ProjectPhase.ELABORACAO_CONVENIO,
    budget: 800000,
    tags: ['educação', 'capacitação', 'digital'],
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
    phases: [
      { phase: ProjectPhase.RECEBIMENTO, status: 'completed', startedAt: '2026-01-10', completedAt: '2026-01-15' },
      { phase: ProjectPhase.PLANO_TRABALHO, status: 'completed', startedAt: '2026-01-16', completedAt: '2026-02-05' },
      { phase: ProjectPhase.REVISAO_AJUSTES, status: 'completed', startedAt: '2026-02-06', completedAt: '2026-02-20' },
      { phase: ProjectPhase.EXECUCAO_CLIENTE, status: 'completed', startedAt: '2026-02-21', completedAt: '2026-03-10' },
      { phase: ProjectPhase.APROVACAO_CLIENTE, status: 'completed', startedAt: '2026-03-11', completedAt: '2026-03-18' },
      { phase: ProjectPhase.ELABORACAO_CONVENIO, status: 'in_progress', startedAt: '2026-03-19' },
      { phase: ProjectPhase.ASSINATURA_CONVENIO, status: 'pending' },
      { phase: ProjectPhase.EXECUCAO_PROJETO, status: 'pending' },
      { phase: ProjectPhase.VALIDACAO, status: 'pending' },
    ],
  },
  {
    id: '3',
    title: 'Revitalização Urbana Centro Histórico',
    description: 'Projeto de revitalização e restauração do centro histórico com foco em patrimônio cultural.',
    client: 'IPHAN Regional',
    currentPhase: ProjectPhase.PLANO_TRABALHO,
    budget: 5000000,
    tags: ['urbanismo', 'patrimônio', 'restauração'],
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-04-05T16:00:00Z',
    phases: [
      { phase: ProjectPhase.RECEBIMENTO, status: 'completed', startedAt: '2026-03-01', completedAt: '2026-03-05' },
      { phase: ProjectPhase.PLANO_TRABALHO, status: 'in_progress', startedAt: '2026-03-06' },
      { phase: ProjectPhase.REVISAO_AJUSTES, status: 'pending' },
      { phase: ProjectPhase.EXECUCAO_CLIENTE, status: 'pending' },
      { phase: ProjectPhase.APROVACAO_CLIENTE, status: 'pending' },
      { phase: ProjectPhase.ELABORACAO_CONVENIO, status: 'pending' },
      { phase: ProjectPhase.ASSINATURA_CONVENIO, status: 'pending' },
      { phase: ProjectPhase.EXECUCAO_PROJETO, status: 'pending' },
      { phase: ProjectPhase.VALIDACAO, status: 'pending' },
    ],
  },
  {
    id: '4',
    title: 'Sistema de Gestão Ambiental',
    description: 'Implantação de sistema de monitoramento e gestão ambiental integrado.',
    client: 'IBAMA - Superintendência SE',
    investor: 'Fundo Clima',
    currentPhase: ProjectPhase.REVISAO_AJUSTES,
    budget: 1200000,
    tags: ['ambiental', 'monitoramento', 'sustentabilidade'],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-04-03T09:00:00Z',
    phases: [
      { phase: ProjectPhase.RECEBIMENTO, status: 'completed', startedAt: '2026-02-15', completedAt: '2026-02-18' },
      { phase: ProjectPhase.PLANO_TRABALHO, status: 'completed', startedAt: '2026-02-19', completedAt: '2026-03-08' },
      { phase: ProjectPhase.REVISAO_AJUSTES, status: 'in_progress', startedAt: '2026-03-09' },
      { phase: ProjectPhase.EXECUCAO_CLIENTE, status: 'pending' },
      { phase: ProjectPhase.APROVACAO_CLIENTE, status: 'pending' },
      { phase: ProjectPhase.ELABORACAO_CONVENIO, status: 'pending' },
      { phase: ProjectPhase.ASSINATURA_CONVENIO, status: 'pending' },
      { phase: ProjectPhase.EXECUCAO_PROJETO, status: 'pending' },
      { phase: ProjectPhase.VALIDACAO, status: 'pending' },
    ],
  },
];

export const mockDocuments: ProjectDocument[] = [
  {
    id: 'd1', projectId: '1', name: 'Plano de Trabalho v3.pdf', category: 'plano_trabalho',
    phase: ProjectPhase.PLANO_TRABALHO, uploadedAt: '2025-09-05T10:00:00Z', uploadedBy: 'Ana Silva',
    size: 2048000, mimeType: 'application/pdf', url: '#', version: 3,
  },
  {
    id: 'd2', projectId: '1', name: 'Convênio Assinado.pdf', category: 'convenio',
    phase: ProjectPhase.ASSINATURA_CONVENIO, uploadedAt: '2025-11-15T14:00:00Z', uploadedBy: 'Carlos Souza',
    size: 1024000, mimeType: 'application/pdf', url: '#', version: 1,
  },
  {
    id: 'd3', projectId: '1', name: 'NF-001-2026.pdf', category: 'nota_fiscal',
    phase: ProjectPhase.EXECUCAO_PROJETO, uploadedAt: '2026-01-10T09:00:00Z', uploadedBy: 'Maria Costa',
    size: 512000, mimeType: 'application/pdf', url: '#', version: 1,
  },
  {
    id: 'd4', projectId: '1', name: 'Relatório Técnico - Janeiro 2026.pdf', category: 'relatorio_tecnico',
    phase: ProjectPhase.EXECUCAO_PROJETO, uploadedAt: '2026-02-05T11:00:00Z', uploadedBy: 'Ana Silva',
    size: 3072000, mimeType: 'application/pdf', url: '#', version: 1,
  },
  {
    id: 'd5', projectId: '1', name: 'NF-002-2026.pdf', category: 'nota_fiscal',
    phase: ProjectPhase.EXECUCAO_PROJETO, uploadedAt: '2026-02-15T10:00:00Z', uploadedBy: 'Maria Costa',
    size: 480000, mimeType: 'application/pdf', url: '#', version: 1,
  },
  {
    id: 'd6', projectId: '2', name: 'Plano de Trabalho - Capacitação.pdf', category: 'plano_trabalho',
    phase: ProjectPhase.PLANO_TRABALHO, uploadedAt: '2026-01-25T10:00:00Z', uploadedBy: 'João Mendes',
    size: 1536000, mimeType: 'application/pdf', url: '#', version: 2,
  },
  {
    id: 'd7', projectId: '3', name: 'Plano de Trabalho - Revitalização.docx', category: 'plano_trabalho',
    phase: ProjectPhase.PLANO_TRABALHO, uploadedAt: '2026-03-10T08:00:00Z', uploadedBy: 'Pedro Lima',
    size: 4096000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#', version: 1,
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1', projectId: '1', author: 'Ana Silva',
    content: 'Plano de trabalho atualizado conforme solicitação. Favor verificar seção 3.2 sobre cronograma.',
    createdAt: '2025-09-05T10:30:00Z', phase: ProjectPhase.PLANO_TRABALHO,
  },
  {
    id: 'c2', projectId: '1', author: 'Carlos Souza',
    content: 'Cronograma aprovado. Seguir para próxima fase.',
    createdAt: '2025-09-06T14:00:00Z', phase: ProjectPhase.PLANO_TRABALHO, parentId: 'c1', resolved: true,
  },
  {
    id: 'c3', projectId: '1', author: 'Maria Costa',
    content: 'Nota fiscal do mês de janeiro enviada. Aguardando validação.',
    createdAt: '2026-01-10T09:30:00Z', phase: ProjectPhase.EXECUCAO_PROJETO,
  },
  {
    id: 'c4', projectId: '4', author: 'Roberto Alves',
    content: 'Necessário ajustar orçamento da seção de equipamentos. Valor acima do teto permitido.',
    createdAt: '2026-03-12T11:00:00Z', phase: ProjectPhase.REVISAO_AJUSTES,
  },
];

export const mockReports: MonthlyReport[] = [
  {
    id: 'r1', projectId: '1', month: 12, year: 2025,
    description: 'Início da execução. Aquisição de equipamentos e contratação de equipe técnica.',
    status: 'validated', submittedAt: '2026-01-05T10:00:00Z', documents: ['d3'],
  },
  {
    id: 'r2', projectId: '1', month: 1, year: 2026,
    description: 'Instalação de servidores e configuração da rede. Treinamento inicial da equipe.',
    status: 'validated', submittedAt: '2026-02-05T11:00:00Z', documents: ['d4', 'd5'],
  },
  {
    id: 'r3', projectId: '1', month: 2, year: 2026,
    description: 'Migração dos sistemas legados. Testes de integração em andamento.',
    status: 'submitted', submittedAt: '2026-03-06T10:00:00Z', documents: [],
  },
  {
    id: 'r4', projectId: '1', month: 3, year: 2026,
    description: 'Continuidade da migração e início do rollout para os departamentos.',
    status: 'draft', documents: [],
  },
];
