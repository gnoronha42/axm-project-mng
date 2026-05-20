import { Card, Typography, Skeleton, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import WorkflowBoard from '../components/workflow/WorkflowBoard';

export default function Workflow() {
  const { data: projects = [], isLoading } = useProjects();
  const [search, setSearch] = useState('');
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

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div>
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
        <Input
          placeholder="Buscar projeto..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 320 }}
        />
      </Space>

      <Card styles={{ body: { padding: 12 } }}>
        <WorkflowBoard
          projects={filtered}
          onProjectClick={(p) => navigate(`/projects/${p.id}`)}
        />
      </Card>
    </div>
  );
}
