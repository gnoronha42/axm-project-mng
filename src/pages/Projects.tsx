import { Card, Table, Tag, Input, Typography, Progress, Space, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { PHASE_LABELS, PHASE_ORDER } from '../types';
import type { Project, ProjectPhase } from '../types';
import { PhaseLabelTag, PhaseStatusTag } from '../components/common/StatusTag';
import type { ColumnsType } from 'antd/es/table';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
  ];

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <Typography.Title level={3}>Projetos</Typography.Title>

      <Card>
        <Input
          placeholder="Buscar por nome ou cliente..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
          allowClear
        />

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/projects/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
