import { Card, Col, Row, Badge, Typography, Empty } from 'antd';
import { PHASE_LABELS, PHASE_ORDER } from '../../types';
import type { Project, PhaseStatus } from '../../types';

function statusBadge(status: PhaseStatus) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'in_progress': return 'processing' as const;
    case 'blocked': return 'error' as const;
    default: return 'default' as const;
  }
}

interface WorkflowBoardProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

export default function WorkflowBoard({ projects, onProjectClick }: WorkflowBoardProps) {
  if (!projects.length) {
    return <Empty description="Nenhum projeto encontrado" />;
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <Row gutter={12} wrap={false} style={{ minWidth: PHASE_ORDER.length * 220 }}>
        {PHASE_ORDER.map((phase) => {
          const phaseProjects = projects.filter((p) => p.currentPhase === phase);

          return (
            <Col key={phase} style={{ width: 220, flex: '0 0 220px' }}>
              <Card
                size="small"
                title={
                  <Typography.Text strong style={{ fontSize: 12 }}>
                    {PHASE_LABELS[phase]}
                  </Typography.Text>
                }
                extra={<Badge count={phaseProjects.length} style={{ backgroundColor: '#f9c556' }} />}
                styles={{ body: { padding: 8 } }}
                style={{ background: '#fafafa', minHeight: 300 }}
              >
                {phaseProjects.map((project) => {
                  const activePhase = project.phases.find((p) => p.status === 'in_progress');
                  return (
                    <Card
                      key={project.id}
                      size="small"
                      hoverable
                      onClick={() => onProjectClick?.(project)}
                      style={{ marginBottom: 8 }}
                    >
                      <Badge status={statusBadge(activePhase?.status ?? 'pending')} />
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {project.title}
                      </Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {project.client}
                      </Typography.Text>
                    </Card>
                  );
                })}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
