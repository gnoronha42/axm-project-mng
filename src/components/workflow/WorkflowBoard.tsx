import { Badge, Empty, Typography } from 'antd';
import { PHASE_LABELS, PHASE_ORDER, type ProjectPhase } from '../../types';
import type { Project, PhaseStatus } from '../../types';

function statusBadge(status: PhaseStatus) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'in_progress': return 'processing' as const;
    case 'blocked': return 'error' as const;
    default: return 'default' as const;
  }
}

const PHASE_ACCENT: Record<ProjectPhase, string> = {
  RECEBIMENTO: '#69b1ff',
  PLANO_TRABALHO: '#5b8ff9',
  REVISAO_AJUSTES: '#fa8c16',
  EXECUCAO_CLIENTE: '#722ed1',
  APROVACAO_CLIENTE: '#2f54eb',
  ELABORACAO_CONVENIO: '#d4a23a',
  ASSINATURA_CONVENIO: '#52c41a',
  EXECUCAO_PROJETO: '#eb2f96',
  VALIDACAO: '#13c2c2',
};

interface WorkflowBoardProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  expanded?: boolean;
}

export default function WorkflowBoard({ projects, onProjectClick, expanded }: WorkflowBoardProps) {
  if (!projects.length) {
    return <Empty description="Nenhum projeto encontrado" />;
  }

  return (
    <div className="axm-kanban">
      {PHASE_ORDER.map((phase) => {
        const phaseProjects = projects.filter((p) => p.currentPhase === phase);
        const accent = PHASE_ACCENT[phase];

        return (
          <section
            key={phase}
            className={`axm-kanban-col${expanded ? ' axm-kanban-col--wide' : ''}`}
          >
            <header className="axm-kanban-col__head">
              <div className="axm-kanban-col__title">
                <span className="axm-kanban-col__dot" style={{ background: accent }} />
                <span className="axm-kanban-col__name">{PHASE_LABELS[phase]}</span>
              </div>
              <span className="axm-kanban-col__count">{phaseProjects.length}</span>
            </header>
            <div className="axm-kanban-col__body">
              {phaseProjects.length === 0 && (
                <div className="axm-kanban-empty">Nenhum projeto</div>
              )}
              {phaseProjects.map((project) => {
                const activePhase = project.phases.find((p) => p.status === 'in_progress');
                return (
                  <article
                    key={project.id}
                    className="axm-kanban-card"
                    style={{ ['--card-accent' as string]: accent }}
                    onClick={() => onProjectClick?.(project)}
                  >
                    <div className="axm-kanban-card__title">
                      <Badge status={statusBadge(activePhase?.status ?? 'pending')} />
                      <Typography.Text className="axm-kanban-card__name">
                        {project.title}
                      </Typography.Text>
                    </div>
                    <div className="axm-kanban-card__client">{project.client}</div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
