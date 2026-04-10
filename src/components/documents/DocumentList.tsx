import { Table, Typography, Button, Space, Empty } from 'antd';
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ProjectDocument } from '../../types';
import { PHASE_LABELS } from '../../types';
import { DocumentCategoryTag } from '../common/StatusTag';
import type { ColumnsType } from 'antd/es/table';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface DocumentListProps {
  documents: ProjectDocument[];
  loading?: boolean;
  showPhase?: boolean;
}

export default function DocumentList({ documents, loading, showPhase = true }: DocumentListProps) {
  if (!loading && documents.length === 0) {
    return <Empty description="Nenhum documento encontrado" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const columns: ColumnsType<ProjectDocument> = [
    {
      title: 'Documento',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #fce8b2, #f9c556)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileTextOutlined style={{ fontSize: 13, color: '#7a5a10' }} />
          </div>
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <DocumentCategoryTag category={cat} />,
    },
    ...(showPhase
      ? [
          {
            title: 'Fase',
            dataIndex: 'phase' as const,
            key: 'phase',
            render: (phase: ProjectDocument['phase']) =>
              PHASE_LABELS[phase] ?? phase,
          },
        ]
      : []),
    {
      title: 'Versão',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => <Typography.Text>v{v}</Typography.Text>,
    },
    {
      title: 'Tamanho',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (s: number) => formatSize(s),
    },
    {
      title: 'Enviado por',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      responsive: ['lg'] as const,
    },
    {
      title: 'Data',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString('pt-BR'),
      sorter: (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<DownloadOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={documents}
      columns={columns}
      rowKey="id"
      loading={loading}
      size="small"
      pagination={{ pageSize: 10 }}
    />
  );
}
