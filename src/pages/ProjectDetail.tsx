import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, Col, Row, Typography, Descriptions, Tag, Button, Tabs, Skeleton,
  Space, Statistic, Result, Modal, App,
} from 'antd';
import {
  ArrowLeftOutlined, DollarOutlined, CalendarOutlined,
  UserOutlined, ForwardOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProject, useAdvancePhase } from '../hooks/useProjects';
import { useDocuments, useComments, useReports, useAddComment } from '../hooks/useDocuments';
import type { PhaseInfo } from '../types';
import { PHASE_LABELS } from '../types';
import PhaseTimeline from '../components/workflow/PhaseTimeline';
import DocumentList from '../components/documents/DocumentList';
import DocumentUpload from '../components/documents/DocumentUpload';
import CommentThread from '../components/comments/CommentThread';
import MonthlyReports from '../components/workflow/MonthlyReports';
import { PhaseLabelTag } from '../components/common/StatusTag';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { notification } = App.useApp();
  const { isMobile, isDesktop } = useBreakpoint();

  const { data: project, isLoading } = useProject(id!);
  const { data: documents = [], isLoading: loadingDocs } = useDocuments(id!);
  const { data: comments = [], isLoading: loadingComments } = useComments(id!);
  const { data: reports = [], isLoading: loadingReports } = useReports(id!);
  const queryClient = useQueryClient();
  const advancePhase = useAdvancePhase();
  const addComment = useAddComment();

  const [selectedPhase, setSelectedPhase] = useState<PhaseInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);

  // Aba ativa preservada na URL (?tab=docs|comments|reports)
  const activeTab = searchParams.get('tab') ?? 'docs';
  const setActiveTab = (key: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', key);
      return next;
    }, { replace: true });
  };

  if (isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!project) return <Result status="404" title="Projeto não encontrado" />;

  const currentPhaseInfo = project.phases.find((p) => p.status === 'in_progress');
  const viewPhase = selectedPhase ?? currentPhaseInfo ?? project.phases[0];
  const completedCount = project.phases.filter((p) => p.status === 'completed').length;
  const nextPhaseIdx = project.phases.findIndex((p) => p.status === 'in_progress') + 1;
  const nextPhase = project.phases[nextPhaseIdx];

  const handleAdvanceConfirm = async () => {
    await advancePhase.mutateAsync(project.id);
    setAdvanceOpen(false);
    notification.success({
      message: 'Fase avançada com sucesso!',
      description: nextPhase
        ? `Projeto avançou para: ${PHASE_LABELS[nextPhase.phase]}`
        : 'Projeto concluído.',
      placement: 'topRight',
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
            <Typography.Title level={4} style={{ marginBottom: 4, wordBreak: 'break-word' }}>
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
            <div className="axm-phase-actions">
              <div className="axm-phase-actions__info">
                <Space wrap>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    Fase:
                  </Typography.Title>
                  <PhaseLabelTag phase={viewPhase.phase} />
                </Space>
              </div>
              <div className="axm-phase-actions__meta">
                <Statistic
                  title="Progresso"
                  value={completedCount}
                  suffix={`/ ${project.phases.length}`}
                  valueStyle={{ fontSize: 18 }}
                />
                <Button
                  type="primary"
                  icon={<ForwardOutlined />}
                  onClick={() => setAdvanceOpen(true)}
                  disabled={!currentPhaseInfo}
                  loading={advancePhase.isPending}
                  block={isMobile}
                >
                  Avançar Fase
                </Button>
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size={isMobile ? 'small' : 'middle'}
              items={[
                {
                  key: 'docs',
                  label: `Documentos (${phaseDocuments.length})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: 12, textAlign: isMobile ? 'left' : 'right' }}>
                        <Button
                          type="primary"
                          ghost
                          onClick={() => setUploadOpen(true)}
                          block={isMobile}
                        >
                          Enviar Documento
                        </Button>
                      </div>
                      <DocumentList documents={phaseDocuments} loading={loadingDocs} showPhase={false} />
                    </div>
                  ),
                },
                {
                  key: 'comments',
                  label: 'Comentários',
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
          <Card
            title="Fluxo do Projeto"
            className="axm-timeline-card"
            style={isDesktop ? { position: 'sticky', top: 16 } : undefined}
          >
            <PhaseTimeline
              phases={project.phases}
              onPhaseClick={(phase) => setSelectedPhase(phase)}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal de upload */}
      <Modal
        title="Enviar Documento"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={isMobile ? { top: 16, paddingBottom: 0 } : undefined}
      >
        <DocumentUpload
          projectId={project.id}
          currentPhase={viewPhase.phase}
          onUploadComplete={() => {
            setUploadOpen(false);
            queryClient.invalidateQueries({ queryKey: ['documents', project.id] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
          }}
        />
      </Modal>

      {/* Modal de confirmação de avanço de fase — controlado, sem Modal.confirm estático */}
      <Modal
        open={advanceOpen}
        onCancel={() => setAdvanceOpen(false)}
        onOk={handleAdvanceConfirm}
        okText="Sim, avançar"
        cancelText="Cancelar"
        confirmLoading={advancePhase.isPending}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#f9c556', fontSize: 18 }} />
            <span>Avançar fase do projeto</span>
          </Space>
        }
        width={isMobile ? '100%' : 480}
        style={isMobile ? { top: 16, maxWidth: 'calc(100vw - 16px)' } : undefined}
      >
        <div style={{ padding: '12px 0' }}>
          <Typography.Text>
            Fase atual: <strong>{PHASE_LABELS[viewPhase.phase]}</strong>
          </Typography.Text>
          {nextPhase && (
            <>
              <br />
              <Typography.Text>
                Próxima fase: <strong>{PHASE_LABELS[nextPhase.phase]}</strong>
              </Typography.Text>
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary">
              Confirme que todos os documentos e validações desta fase foram concluídos antes de avançar.
            </Typography.Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}
