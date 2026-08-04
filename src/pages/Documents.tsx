import { Card, Typography, Select, Skeleton, Button, Modal, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllDocuments } from '../hooks/useDocuments';
import { useProjects } from '../hooks/useProjects';
import { PHASE_LABELS, PHASE_ORDER } from '../types';
import type { DocumentCategory, ProjectPhase } from '../types';
import DocumentList from '../components/documents/DocumentList';
import DocumentUpload from '../components/documents/DocumentUpload';
import { useBreakpoint } from '../hooks/useBreakpoint';

const CATEGORY_OPTIONS: { value: DocumentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'plano_trabalho', label: 'Plano de Trabalho' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'relatorio_tecnico', label: 'Relatório Técnico' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'outro', label: 'Outro' },
];

export default function Documents() {
  const { data: documents = [], isLoading } = useAllDocuments();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const queryClient = useQueryClient();
  const { isMobile } = useBreakpoint();

  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [phase, setPhase] = useState<ProjectPhase | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string>('');

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.title })),
    [projects],
  );

  const filtered = documents.filter((d) => {
    if (category !== 'all' && d.category !== category) return false;
    if (phase !== 'all' && d.phase !== phase) return false;
    if (projectFilter !== 'all' && d.projectId !== projectFilter) return false;
    return true;
  });

  if (isLoading || loadingProjects) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Typography.Title level={3} className="axm-page-title" style={{ margin: 0 }}>
          Documentos
        </Typography.Title>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => {
            setUploadProjectId(projectFilter !== 'all' ? projectFilter : projects[0]?.id ?? '');
            setUploadOpen(true);
          }}
          disabled={projects.length === 0}
        >
          Enviar Documento
        </Button>
      </div>

      <Card>
        <div className="axm-filter-row">
          <Select
            value={projectFilter}
            onChange={setProjectFilter}
            options={[{ value: 'all', label: 'Todos os projetos' }, ...projectOptions]}
            placeholder="Projeto"
            showSearch
            optionFilterProp="label"
          />
          <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
          <Select
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'all', label: 'Todas as fases' },
              ...PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABELS[p] })),
            ]}
          />
        </div>

        <DocumentList documents={filtered} />
      </Card>

      <Modal
        title="Enviar Documento"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={isMobile ? '100%' : 600}
        destroyOnClose
        style={isMobile ? { top: 16 } : undefined}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }} size="middle">
          <div>
            <Typography.Text type="secondary">Projeto</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={uploadProjectId || undefined}
              onChange={setUploadProjectId}
              options={projectOptions}
              placeholder="Selecione o projeto"
              showSearch
              optionFilterProp="label"
            />
          </div>
          {uploadProjectId ? (
            <DocumentUpload
              projectId={uploadProjectId}
              currentPhase={
                projects.find((p) => p.id === uploadProjectId)?.currentPhase
              }
              onUploadComplete={() => {
                setUploadOpen(false);
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                queryClient.invalidateQueries({ queryKey: ['documents', uploadProjectId] });
              }}
            />
          ) : (
            <Typography.Text type="secondary">Selecione um projeto para continuar.</Typography.Text>
          )}
        </Space>
      </Modal>
    </div>
  );
}
