import { Table, Typography, Button, Space } from 'antd';
import { FileTextOutlined, SendOutlined, CheckOutlined } from '@ant-design/icons';
import type { MonthlyReport } from '../../types';
import { ReportStatusTag } from '../common/StatusTag';
import type { ColumnsType } from 'antd/es/table';

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MonthlyReportsProps {
  reports: MonthlyReport[];
  loading?: boolean;
}

export default function MonthlyReports({ reports, loading }: MonthlyReportsProps) {
  const columns: ColumnsType<MonthlyReport> = [
    {
      title: 'Período',
      key: 'period',
      width: 160,
      render: (_, r) => `${MONTHS[r.month]} ${r.year}`,
      sorter: (a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => <ReportStatusTag status={s} />,
    },
    {
      title: 'Documentos',
      dataIndex: 'documents',
      key: 'documents',
      width: 110,
      render: (docs: string[]) => (
        <Space>
          <FileTextOutlined />
          <span>{docs.length} arquivo(s)</span>
        </Space>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      render: (_, record) => {
        if (record.status === 'draft') {
          return (
            <Button size="small" type="primary" icon={<SendOutlined />}>
              Enviar
            </Button>
          );
        }
        if (record.status === 'submitted') {
          return (
            <Button size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
              Validar
            </Button>
          );
        }
        return (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.submittedAt
              ? `Enviado em ${new Date(record.submittedAt).toLocaleDateString('pt-BR')}`
              : '—'}
          </Typography.Text>
        );
      },
    },
  ];

  return (
    <div className="axm-table-scroll">
      <Table
        dataSource={reports}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 560 }}
        pagination={false}
      />
    </div>
  );
}
