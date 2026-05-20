import { Card, Col, Row, Statistic, Typography, List, Progress, Skeleton } from 'antd';
import {
  ProjectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useAllDocuments } from '../hooks/useDocuments';
import { PHASE_ORDER } from '../types';
import { PhaseLabelTag, PhaseStatusTag } from '../components/common/StatusTag';

export default function Dashboard() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: documents, isLoading: loadingDocs } = useAllDocuments();
  const navigate = useNavigate();

  if (loadingProjects || loadingDocs) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  const total = projects?.length ?? 0;
  const inExecution = projects?.filter((p) => p.currentPhase === 'EXECUCAO_PROJETO').length ?? 0;
  const completed = projects?.filter(
    (p) => p.phases.every((ph) => ph.status === 'completed'),
  ).length ?? 0;
  const totalDocs = documents?.length ?? 0;

  const stats = [
    { title: 'Total de Projetos', value: total, icon: <ProjectOutlined />, color: '#111111' },
    { title: 'Em Execução', value: inExecution, icon: <ClockCircleOutlined />, color: '#111111' },
    { title: 'Concluídos', value: completed, icon: <CheckCircleOutlined />, color: '#111111' },
    { title: 'Documentos', value: totalDocs, icon: <FileTextOutlined />, color: '#111111' },
  ];

  return (
    <div>
      <Typography.Title level={3} className="axm-page-title">
        Dashboard
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.title}>
            <Card className="axm-stat-card" hoverable>
              <Statistic
                title={<span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#999' }}>{s.title}</span>}
                value={s.value}
                prefix={s.icon}
                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 600 }}>Projetos Ativos</span>}
            styles={{ header: { borderBottom: '2px solid #fce8b2' } }}
          >
            <List
              dataSource={projects}
              renderItem={(project) => {
                const completedPhases = project.phases.filter((p) => p.status === 'completed').length;
                const pct = Math.round((completedPhases / PHASE_ORDER.length) * 100);
                const status = project.phases.find((p) => p.status === 'in_progress')?.status ?? 'pending';

                return (
                  <List.Item
                    className="axm-project-row"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="axm-project-row__inner">
                      <div className="axm-project-row__head">
                        <span className="axm-project-row__title">{project.title}</span>
                        <PhaseStatusTag status={status} />
                      </div>
                      <div className="axm-project-row__meta">
                        <PhaseLabelTag phase={project.currentPhase} />
                        <Progress
                          percent={pct}
                          size="small"
                          className="axm-project-row__progress"
                        />
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ fontWeight: 600 }}>Documentos Recentes</span>}
            styles={{ header: { borderBottom: '2px solid #fce8b2' } }}
          >
            <List
              size="small"
              dataSource={documents?.slice(0, 6)}
              renderItem={(doc) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: 'linear-gradient(135deg, #fce8b2, #f9c556)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileTextOutlined style={{ fontSize: 16, color: '#7a5a10' }} />
                      </div>
                    }
                    title={<span style={{ fontSize: 13, fontWeight: 500 }}>{doc.name}</span>}
                    description={
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {doc.uploadedBy} &middot; v{doc.version}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
