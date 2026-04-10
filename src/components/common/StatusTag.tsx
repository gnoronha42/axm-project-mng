import { Tag } from 'antd';
import type { PhaseStatus, DocumentCategory, ProjectPhase } from '../../types';
import { PHASE_LABELS, ProjectPhase as ProjectPhaseValue } from '../../types';

const STATUS_CONFIG: Record<PhaseStatus, { color: string; label: string }> = {
  pending: { color: 'warning', label: 'Pendente' },
  in_progress: { color: 'processing', label: 'Em Andamento' },
  completed: { color: 'success', label: 'Concluído' },
  blocked: { color: 'error', label: 'Bloqueado' },
};

export function PhaseStatusTag({ status }: { status: PhaseStatus }) {
  const config = STATUS_CONFIG[status];
  return <Tag color={config.color}>{config.label}</Tag>;
}

const REPORT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Rascunho' },
  submitted: { color: 'processing', label: 'Enviado' },
  validated: { color: 'success', label: 'Validado' },
  rejected: { color: 'error', label: 'Rejeitado' },
};

export function ReportStatusTag({ status }: { status: string }) {
  const config = REPORT_STATUS_CONFIG[status] ?? { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}

const CATEGORY_CONFIG: Record<DocumentCategory, { color: string; label: string }> = {
  plano_trabalho: { color: 'blue', label: 'Plano de Trabalho' },
  nota_fiscal: { color: 'green', label: 'Nota Fiscal' },
  relatorio_tecnico: { color: 'purple', label: 'Relatório Técnico' },
  convenio: { color: 'gold', label: 'Convênio' },
  comprovante: { color: 'cyan', label: 'Comprovante' },
  outro: { color: 'default', label: 'Outro' },
};

export function DocumentCategoryTag({ category }: { category: DocumentCategory }) {
  const config = CATEGORY_CONFIG[category];
  return <Tag color={config.color}>{config.label}</Tag>;
}

const PHASE_CONFIG: Record<ProjectPhase, { color: string; label: string }> = {
  [ProjectPhaseValue.RECEBIMENTO]: { color: 'cyan', label: PHASE_LABELS[ProjectPhaseValue.RECEBIMENTO] },
  [ProjectPhaseValue.PLANO_TRABALHO]: { color: 'blue', label: PHASE_LABELS[ProjectPhaseValue.PLANO_TRABALHO] },
  [ProjectPhaseValue.REVISAO_AJUSTES]: { color: 'orange', label: PHASE_LABELS[ProjectPhaseValue.REVISAO_AJUSTES] },
  [ProjectPhaseValue.EXECUCAO_CLIENTE]: { color: 'purple', label: PHASE_LABELS[ProjectPhaseValue.EXECUCAO_CLIENTE] },
  [ProjectPhaseValue.APROVACAO_CLIENTE]: { color: 'geekblue', label: PHASE_LABELS[ProjectPhaseValue.APROVACAO_CLIENTE] },
  [ProjectPhaseValue.ELABORACAO_CONVENIO]: { color: 'gold', label: PHASE_LABELS[ProjectPhaseValue.ELABORACAO_CONVENIO] },
  [ProjectPhaseValue.ASSINATURA_CONVENIO]: { color: 'lime', label: PHASE_LABELS[ProjectPhaseValue.ASSINATURA_CONVENIO] },
  [ProjectPhaseValue.EXECUCAO_PROJETO]: { color: 'magenta', label: PHASE_LABELS[ProjectPhaseValue.EXECUCAO_PROJETO] },
  [ProjectPhaseValue.VALIDACAO]: { color: 'green', label: PHASE_LABELS[ProjectPhaseValue.VALIDACAO] },
};

export function PhaseLabelTag({ phase }: { phase: ProjectPhase }) {
  const config = PHASE_CONFIG[phase];
  return <Tag color={config.color}>{config.label}</Tag>;
}
