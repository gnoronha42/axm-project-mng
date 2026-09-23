import { Button, Card, Descriptions, Modal, Tag, Typography, Skeleton, Input, Space } from 'antd';
import { CompressOutlined, ExpandOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import WorkflowBoard from '../components/workflow/WorkflowBoard';
import { PhaseLabelTag, PhaseStatusTag } from '../components/common/StatusTag';
import { PHASE_LABELS } from '../types';
import type { Project } from '../types';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatMoney(value?: number) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Workflow() {
  const { data: projects = [], isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.client.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  useEffect(() => {
    document.body.style.overflow = maximized ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [maximized]);

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

  const activePhase = selected?.phases.find((p) => p.status === 'in_progress');

  const toolbar = (
    <Space
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <Typography.Title level={3} className="axm-page-title" style={{ margin: 0 }}>
        Fluxo de Projetos
      </Typography.Title>
      <Space wrap>
        <Input
          placeholder="Buscar projeto..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 320, width: 260 }}
        />
        <Button
          icon={maximized ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={() => setMaximized((v) => !v)}
        >
          {maximized ? 'Restaurar' : 'Maximizar'}
        </Button>
      </Space>
    </Space>
  );

  return (
    <div className={maximized ? 'axm-board-fullscreen' : undefined}>
      {toolbar}

      <Card className="axm-board-card" styles={{ body: { padding: 16 } }}>
        <WorkflowBoard
          projects={filtered}
          expanded={maximized}
          onProjectClick={setSelected}
        />
      </Card>

      <Modal
        open={!!selected}
        title={selected?.title}
        onCancel={() => setSelected(null)}
        footer={[
          <Button key="close" onClick={() => setSelected(null)}>
            Fechar
          </Button>,
          <Button
            key="open"
            type="primary"
            onClick={() => {
              if (!selected) return;
              navigate(`/projects/${selected.id}`);
            }}
          >
            Abrir projeto
          </Button>,
        ]}
        width={640}
      >
        {selected && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Cliente">{selected.client}</Descriptions.Item>
            <Descriptions.Item label="Investidor">{selected.investor || '—'}</Descriptions.Item>
            <Descriptions.Item label="Fase atual">
              <PhaseLabelTag phase={selected.currentPhase} />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <PhaseStatusTag status={activePhase?.status ?? 'pending'} />
            </Descriptions.Item>
            <Descriptions.Item label="Descrição">
              {selected.description || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Orçamento">{formatMoney(selected.budget)}</Descriptions.Item>
            <Descriptions.Item label="Tags">
              {selected.tags.length
                ? selected.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Criado em">{formatDate(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Atualizado em">{formatDate(selected.updatedAt)}</Descriptions.Item>
            {activePhase?.notes && (
              <Descriptions.Item label={`Notas — ${PHASE_LABELS[activePhase.phase]}`}>
                {activePhase.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
