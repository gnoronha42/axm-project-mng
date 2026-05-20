import { Card, Table, Tag, Input, Typography, Progress, Space, Skeleton, Button, App, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useDeleteProject } from '../hooks/useProjects';
import { PHASE_LABELS, PHASE_ORDER } from '../types';
import type { Project, ProjectPhase } from '../types';
import { PhaseLabelTag, PhaseStatusTag } from '../components/common/StatusTag';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import type { ColumnsType } from 'antd/es/table';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const deleteProject = useDeleteProject();

  const filtered = projects?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnsType<Project> = [
    {
      title: 'Projeto',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.client}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Fase Atual',
      dataIndex: 'currentPhase',
      key: 'currentPhase',
      responsive: ['sm'],
      render: (phase) => <PhaseLabelTag phase={phase as ProjectPhase} />,
      filters: PHASE_ORDER.map((p) => ({ text: PHASE_LABELS[p], value: p })),
      onFilter: (value, record) => record.currentPhase === value,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const active = record.phases.find((p) => p.status === 'in_progress');
        return <PhaseStatusTag status={active?.status ?? 'pending'} />;
      },
    },
    {
      title: 'Progresso',
      key: 'progress',
      responsive: ['md'],
      render: (_, record) => {
        const done = record.phases.filter((p) => p.status === 'completed').length;
        const pct = Math.round((done / PHASE_ORDER.length) * 100);
        return <Progress percent={pct} size="small" style={{ minWidth: 120 }} />;
      },
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      responsive: ['lg'],
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Excluir projeto?"
          description="Documentos e comentários serão removidos."
          okText="Excluir"
          cancelText="Cancelar"
          okButtonProps={{ danger: true, loading: deleteProject.isPending }}
          onConfirm={async (e) => {
            e?.stopPropagation();
            try {
              await deleteProject.mutateAsync(record.id);
              notification.success({
                message: 'Projeto excluído',
                placement: 'topRight',
              });
            } catch (err) {
              notification.error({
                message: 'Falha ao excluir',
                description: err instanceof Error ? err.message : undefined,
                placement: 'topRight',
              });
            }
          }}
          onCancel={(e) => e?.stopPropagation()}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

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
          Projetos
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Novo Projeto
        </Button>
      </div>

      <Card>
        <Input
          placeholder="Buscar por nome ou cliente..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, width: '100%', maxWidth: 480 }}
          allowClear
        />

        <div className="axm-table-scroll">
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            scroll={{ x: 720 }}
            onRow={(record) => ({
              onClick: () => navigate(`/projects/${record.id}`),
              style: { cursor: 'pointer' },
            })}
            pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
          />
        </div>
      </Card>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/projects/${id}`)}
      />
    </div>
  );
}
