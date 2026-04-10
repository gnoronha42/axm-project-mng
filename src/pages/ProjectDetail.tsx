import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Col, Row, Typography, Descriptions, Tag, Button, Tabs, Skeleton,
  Space, Statistic, Result, Modal, message,
} from 'antd';
import {
  ArrowLeftOutlined, DollarOutlined, CalendarOutlined,
  UserOutlined, ForwardOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useProject, useAdvancePhase } from '../hooks/useProjects';
import { useDocuments, useComments, useReports, useAddComment } from '../hooks/useDocuments';
import type { PhaseInfo } from '../types';
import PhaseTimeline from '../components/workflow/PhaseTimeline';
import DocumentList from '../components/documents/DocumentList';
import DocumentUpload from '../components/documents/DocumentUpload';
import CommentThread from '../components/comments/CommentThread';
import MonthlyReports from '../components/workflow/MonthlyReports';
import { PhaseLabelTag } from '../components/common/StatusTag';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const { data: documents = [], isLoading: loadingDocs } = useDocuments(id!);
  const { data: comments = [], isLoading: loadingComments } = useComments(id!);
  const { data: reports = [], isLoading: loadingReports } = useReports(id!);
  const advancePhase = useAdvancePhase();
  const addComment = useAddComment();
  const [selectedPhase, setSelectedPhase] = useState<PhaseInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  if (isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!project) return <Result status="404" title="Projeto não encontrado" />;

  const currentPhaseInfo = project.phases.find((p) => p.status === 'in_progress');
  const viewPhase = selectedPhase ?? currentPhaseInfo ?? project.phases[0];
  const completedCount = project.phases.filter((p) => p.status === 'completed').length;

  const handleAdvance = () => {
    Modal.confirm({
      title: 'Avançar Fase',
      content: `Deseja avançar o projeto para a próxima fase?`,
      okText: 'Sim, avançar',
      cancelText: 'Cancelar',
      onOk: async () => {
        await advancePhase.mutateAsync(project.id);
        message.success('Fase avançada com sucesso!');
      },
    });
  };

  const phaseDocuments = documents.filter((d) => d.phase === viewPhase.phase);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          Voltar
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              {project.title}
            </Typography.Title>
            <Typography.Paragraph type="secondary">{project.description}</Typography.Paragraph>

            <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
              <Descriptions.Item label={<><UserOutlined /> Cliente</>}>
                {project.client}
              </Descriptions.Item>
              {project.investor && (
                <Descriptions.Item label="Investidor">{project.investor}</Descriptions.Item>
              )}
              {project.budget && (
                <Descriptions.Item label={<><DollarOutlined /> Orçamento</>}>
                  {project.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={<><CalendarOutlined /> Criado em</>}>
                {new Date(project.createdAt).toLocaleDateString('pt-BR')}
              </Descriptions.Item>
            </Descriptions>

            <Space style={{ marginTop: 8 }}>
              {project.tags.map((t) => <Tag key={t} color="gold">{t}</Tag>)}
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Space>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    Fase:
                  </Typography.Title>
                  <PhaseLabelTag phase={viewPhase.phase} />
                </Space>
              </Col>
              <Col>
                <Statistic
                  title="Progresso"
                  value={completedCount}
                  suffix={`/ ${project.phases.length}`}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<ForwardOutlined />}
                  onClick={handleAdvance}
                  disabled={!currentPhaseInfo}
                  loading={advancePhase.isPending}
                >
                  Avançar Fase
                </Button>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="docs"
              items={[
                {
                  key: 'docs',
                  label: `Documentos (${phaseDocuments.length})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: 12, textAlign: 'right' }}>
                        <Button type="primary" ghost onClick={() => setUploadOpen(true)}>
                          Enviar Documento
                        </Button>
                      </div>
                      <DocumentList documents={phaseDocuments} loading={loadingDocs} showPhase={false} />
                    </div>
                  ),
                },
                {
                  key: 'comments',
                  label: `Comentários`,
                  children: (
                    <CommentThread
                      comments={comments}
                      projectId={project.id}
                      phase={viewPhase.phase}
                      loading={loadingComments}
                      onAddComment={(content) => {
                        addComment.mutate({
                          projectId: project.id,
                          author: 'Você',
                          content,
                          phase: viewPhase.phase,
                        });
                      }}
                    />
                  ),
                },
                {
                  key: 'reports',
                  label: 'Relatórios Mensais',
                  children: <MonthlyReports reports={reports} loading={loadingReports} />,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Fluxo do Projeto" style={{ position: 'sticky', top: 16 }}>
            <PhaseTimeline
              phases={project.phases}
              onPhaseClick={(phase) => setSelectedPhase(phase)}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Enviar Documento"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={600}
      >
        <DocumentUpload
          currentPhase={viewPhase.phase}
          onUploadComplete={() => setUploadOpen(false)}
        />
      </Modal>
    </div>
  );
}
