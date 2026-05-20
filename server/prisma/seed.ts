import { PrismaClient } from '@prisma/client';
import { PHASE_ORDER } from '../src/lib/phases.js';

const prisma = new PrismaClient();

const projects = [
  {
    id: '1',
    title: 'Modernização da Infraestrutura de TI',
    description: 'Projeto de modernização completa da infraestrutura tecnológica do município.',
    client: 'Prefeitura Municipal de Aracaju',
    investor: 'Banco do Brasil',
    currentPhase: 'EXECUCAO_PROJETO',
    budget: 2500000,
    tags: ['infraestrutura', 'TI', 'modernização'],
    createdAt: new Date('2025-08-15T10:00:00Z'),
    updatedAt: new Date('2026-03-20T14:30:00Z'),
    phases: [
      { phase: 'RECEBIMENTO', status: 'completed', startedAt: '2025-08-15', completedAt: '2025-08-20' },
      { phase: 'PLANO_TRABALHO', status: 'completed', startedAt: '2025-08-21', completedAt: '2025-09-10' },
      { phase: 'REVISAO_AJUSTES', status: 'completed', startedAt: '2025-09-11', completedAt: '2025-09-25' },
      { phase: 'EXECUCAO_CLIENTE', status: 'completed', startedAt: '2025-09-26', completedAt: '2025-10-15' },
      { phase: 'APROVACAO_CLIENTE', status: 'completed', startedAt: '2025-10-16', completedAt: '2025-10-20' },
      { phase: 'ELABORACAO_CONVENIO', status: 'completed', startedAt: '2025-10-21', completedAt: '2025-11-10' },
      { phase: 'ASSINATURA_CONVENIO', status: 'completed', startedAt: '2025-11-11', completedAt: '2025-11-15' },
      { phase: 'EXECUCAO_PROJETO', status: 'in_progress', startedAt: '2025-11-16' },
      { phase: 'VALIDACAO', status: 'pending' },
    ],
  },
  {
    id: '2',
    title: 'Programa de Capacitação Digital',
    description: 'Capacitação de servidores públicos em ferramentas digitais e gestão de dados.',
    client: 'Secretaria de Educação - SE',
    investor: 'BNDES',
    currentPhase: 'ELABORACAO_CONVENIO',
    budget: 800000,
    tags: ['educação', 'capacitação', 'digital'],
    createdAt: new Date('2026-01-10T09:00:00Z'),
    updatedAt: new Date('2026-04-01T11:00:00Z'),
    phases: [
      { phase: 'RECEBIMENTO', status: 'completed', startedAt: '2026-01-10', completedAt: '2026-01-15' },
      { phase: 'PLANO_TRABALHO', status: 'completed', startedAt: '2026-01-16', completedAt: '2026-02-05' },
      { phase: 'REVISAO_AJUSTES', status: 'completed', startedAt: '2026-02-06', completedAt: '2026-02-20' },
      { phase: 'EXECUCAO_CLIENTE', status: 'completed', startedAt: '2026-02-21', completedAt: '2026-03-10' },
      { phase: 'APROVACAO_CLIENTE', status: 'completed', startedAt: '2026-03-11', completedAt: '2026-03-18' },
      { phase: 'ELABORACAO_CONVENIO', status: 'in_progress', startedAt: '2026-03-19' },
      { phase: 'ASSINATURA_CONVENIO', status: 'pending' },
      { phase: 'EXECUCAO_PROJETO', status: 'pending' },
      { phase: 'VALIDACAO', status: 'pending' },
    ],
  },
  {
    id: '3',
    title: 'Revitalização Urbana Centro Histórico',
    description: 'Projeto de revitalização e restauração do centro histórico com foco em patrimônio cultural.',
    client: 'IPHAN Regional',
    currentPhase: 'PLANO_TRABALHO',
    budget: 5000000,
    tags: ['urbanismo', 'patrimônio', 'restauração'],
    createdAt: new Date('2026-03-01T08:00:00Z'),
    updatedAt: new Date('2026-04-05T16:00:00Z'),
    phases: [
      { phase: 'RECEBIMENTO', status: 'completed', startedAt: '2026-03-01', completedAt: '2026-03-05' },
      { phase: 'PLANO_TRABALHO', status: 'in_progress', startedAt: '2026-03-06' },
      { phase: 'REVISAO_AJUSTES', status: 'pending' },
      { phase: 'EXECUCAO_CLIENTE', status: 'pending' },
      { phase: 'APROVACAO_CLIENTE', status: 'pending' },
      { phase: 'ELABORACAO_CONVENIO', status: 'pending' },
      { phase: 'ASSINATURA_CONVENIO', status: 'pending' },
      { phase: 'EXECUCAO_PROJETO', status: 'pending' },
      { phase: 'VALIDACAO', status: 'pending' },
    ],
  },
  {
    id: '4',
    title: 'Sistema de Gestão Ambiental',
    description: 'Implantação de sistema de monitoramento e gestão ambiental integrado.',
    client: 'IBAMA - Superintendência SE',
    investor: 'Fundo Clima',
    currentPhase: 'REVISAO_AJUSTES',
    budget: 1200000,
    tags: ['ambiental', 'monitoramento', 'sustentabilidade'],
    createdAt: new Date('2026-02-15T10:00:00Z'),
    updatedAt: new Date('2026-04-03T09:00:00Z'),
    phases: [
      { phase: 'RECEBIMENTO', status: 'completed', startedAt: '2026-02-15', completedAt: '2026-02-18' },
      { phase: 'PLANO_TRABALHO', status: 'completed', startedAt: '2026-02-19', completedAt: '2026-03-08' },
      { phase: 'REVISAO_AJUSTES', status: 'in_progress', startedAt: '2026-03-09' },
      { phase: 'EXECUCAO_CLIENTE', status: 'pending' },
      { phase: 'APROVACAO_CLIENTE', status: 'pending' },
      { phase: 'ELABORACAO_CONVENIO', status: 'pending' },
      { phase: 'ASSINATURA_CONVENIO', status: 'pending' },
      { phase: 'EXECUCAO_PROJETO', status: 'pending' },
      { phase: 'VALIDACAO', status: 'pending' },
    ],
  },
];

const documents = [
  { id: 'd1', projectId: '1', name: 'Plano de Trabalho v3.pdf', category: 'plano_trabalho', phase: 'PLANO_TRABALHO', uploadedAt: '2025-09-05T10:00:00Z', uploadedBy: 'Ana Silva', size: 2048000, mimeType: 'application/pdf', version: 3 },
  { id: 'd2', projectId: '1', name: 'Convênio Assinado.pdf', category: 'convenio', phase: 'ASSINATURA_CONVENIO', uploadedAt: '2025-11-15T14:00:00Z', uploadedBy: 'Carlos Souza', size: 1024000, mimeType: 'application/pdf', version: 1 },
  { id: 'd3', projectId: '1', name: 'NF-001-2026.pdf', category: 'nota_fiscal', phase: 'EXECUCAO_PROJETO', uploadedAt: '2026-01-10T09:00:00Z', uploadedBy: 'Maria Costa', size: 512000, mimeType: 'application/pdf', version: 1 },
  { id: 'd4', projectId: '1', name: 'Relatório Técnico - Janeiro 2026.pdf', category: 'relatorio_tecnico', phase: 'EXECUCAO_PROJETO', uploadedAt: '2026-02-05T11:00:00Z', uploadedBy: 'Ana Silva', size: 3072000, mimeType: 'application/pdf', version: 1 },
  { id: 'd5', projectId: '1', name: 'NF-002-2026.pdf', category: 'nota_fiscal', phase: 'EXECUCAO_PROJETO', uploadedAt: '2026-02-15T10:00:00Z', uploadedBy: 'Maria Costa', size: 480000, mimeType: 'application/pdf', version: 1 },
  { id: 'd6', projectId: '2', name: 'Plano de Trabalho - Capacitação.pdf', category: 'plano_trabalho', phase: 'PLANO_TRABALHO', uploadedAt: '2026-01-25T10:00:00Z', uploadedBy: 'João Mendes', size: 1536000, mimeType: 'application/pdf', version: 2 },
  { id: 'd7', projectId: '3', name: 'Plano de Trabalho - Revitalização.docx', category: 'plano_trabalho', phase: 'PLANO_TRABALHO', uploadedAt: '2026-03-10T08:00:00Z', uploadedBy: 'Pedro Lima', size: 4096000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', version: 1 },
];

const comments = [
  { id: 'c1', projectId: '1', author: 'Ana Silva', content: 'Plano de trabalho atualizado conforme solicitação. Favor verificar seção 3.2 sobre cronograma.', createdAt: '2025-09-05T10:30:00Z', phase: 'PLANO_TRABALHO' },
  { id: 'c2', projectId: '1', author: 'Carlos Souza', content: 'Cronograma aprovado. Seguir para próxima fase.', createdAt: '2025-09-06T14:00:00Z', phase: 'PLANO_TRABALHO', parentId: 'c1', resolved: true },
  { id: 'c3', projectId: '1', author: 'Maria Costa', content: 'Nota fiscal do mês de janeiro enviada. Aguardando validação.', createdAt: '2026-01-10T09:30:00Z', phase: 'EXECUCAO_PROJETO' },
  { id: 'c4', projectId: '4', author: 'Roberto Alves', content: 'Necessário ajustar orçamento da seção de equipamentos. Valor acima do teto permitido.', createdAt: '2026-03-12T11:00:00Z', phase: 'REVISAO_AJUSTES' },
];

const reports = [
  { id: 'r1', projectId: '1', month: 12, year: 2025, description: 'Início da execução. Aquisição de equipamentos e contratação de equipe técnica.', status: 'validated', submittedAt: '2026-01-05T10:00:00Z', documentIds: ['d3'] },
  { id: 'r2', projectId: '1', month: 1, year: 2026, description: 'Instalação de servidores e configuração da rede. Treinamento inicial da equipe.', status: 'validated', submittedAt: '2026-02-05T11:00:00Z', documentIds: ['d4', 'd5'] },
  { id: 'r3', projectId: '1', month: 2, year: 2026, description: 'Migração dos sistemas legados. Testes de integração em andamento.', status: 'submitted', submittedAt: '2026-03-06T10:00:00Z', documentIds: [] as string[] },
  { id: 'r4', projectId: '1', month: 3, year: 2026, description: 'Continuidade da migração e início do rollout para os departamentos.', status: 'draft', documentIds: [] as string[] },
];

async function main() {
  await prisma.comment.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.document.deleteMany();
  await prisma.projectPhaseRecord.deleteMany();
  await prisma.project.deleteMany();

  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: p.id,
        title: p.title,
        description: p.description,
        client: p.client,
        investor: p.investor,
        currentPhase: p.currentPhase,
        budget: p.budget,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        phases: {
          create: PHASE_ORDER.map((phaseKey, idx) => {
            const info = p.phases.find((x) => x.phase === phaseKey) ?? { phase: phaseKey, status: 'pending' };
            return {
              phase: phaseKey,
              status: info.status,
              sortOrder: idx,
              startedAt: info.startedAt ? new Date(info.startedAt) : null,
              completedAt: info.completedAt ? new Date(info.completedAt) : null,
            };
          }),
        },
      },
    });
  }

  for (const d of documents) {
    await prisma.document.create({
      data: {
        ...d,
        uploadedAt: new Date(d.uploadedAt),
        storagePath: `seed/${d.id}`,
      },
    });
  }

  for (const c of comments) {
    await prisma.comment.create({
      data: {
        ...c,
        createdAt: new Date(c.createdAt),
        resolved: c.resolved ?? false,
      },
    });
  }

  for (const r of reports) {
    await prisma.monthlyReport.create({
      data: {
        ...r,
        submittedAt: r.submittedAt ? new Date(r.submittedAt) : null,
      },
    });
  }

  console.log('Seed concluído:', projects.length, 'projetos');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
