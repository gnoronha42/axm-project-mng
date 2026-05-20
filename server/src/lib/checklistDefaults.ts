import type { ProjectPhase } from './phases.js';

export const CHECKLIST_DEFAULTS: Record<ProjectPhase, string[]> = {
  RECEBIMENTO: [
    'Solicitação formal recebida',
    'Documentos iniciais conferidos',
    'Cliente e escopo preliminar identificados',
  ],
  PLANO_TRABALHO: [
    'Cronograma elaborado',
    'Orçamento e premissas definidos',
    'Equipe técnica alocada',
    'Plano enviado ao cliente',
  ],
  REVISAO_AJUSTES: [
    'Feedback do cliente coletado',
    'Ajustes aplicados ao plano',
    'Versão final revisada internamente',
  ],
  EXECUCAO_CLIENTE: [
    'Cliente confirmou aprovação interna',
    'Documentação assinada pelo responsável',
  ],
  APROVACAO_CLIENTE: [
    'Termo de aprovação assinado',
    'Próximos passos comunicados ao cliente',
  ],
  ELABORACAO_CONVENIO: [
    'Minuta do convênio elaborada',
    'Cláusulas revisadas pelo jurídico',
    'Valores e cronograma financeiro validados',
  ],
  ASSINATURA_CONVENIO: [
    'Convênio assinado pelas partes',
    'Cópia arquivada e registrada',
  ],
  EXECUCAO_PROJETO: [
    'Kickoff de execução realizado',
    'Marcos parciais sendo entregues',
    'Relatórios mensais enviados',
  ],
  VALIDACAO: [
    'Entrega final validada pelo cliente',
    'Lições aprendidas documentadas',
    'Projeto formalmente encerrado',
  ],
};
