import { Alert, Button, Card, Col, InputNumber, Row, Space, Statistic, Table, Tabs, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import { brl } from './utils';
import CollaboratorsTab from './CollaboratorsTab';
import ActivitiesTab from './ActivitiesTab';
import AllocationsTab from './AllocationsTab';

type Props = { projectId: string };

function ResumoTab({ projectId, year }: Props & { year: number }) {
  const { data: summary } = useQuery({
    queryKey: ['finance-summary', projectId, year],
    queryFn: () => api.getFinanceSummary(projectId, year),
  });
  if (!summary) return null;
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card size="small" title="Por vínculo">
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={summary.consolidation.porVinculo}
            columns={[
              { title: 'Vínculo', dataIndex: 'label' },
              { title: 'Horas', dataIndex: 'horas' },
              { title: 'Valor', dataIndex: 'valor', render: (v) => brl(v) },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card size="small" title="Por atividade">
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={summary.consolidation.porAtividade}
            columns={[
              { title: 'Atividade', dataIndex: 'label' },
              { title: 'Horas', dataIndex: 'horas' },
              { title: 'Valor', dataIndex: 'valor', render: (v) => brl(v) },
            ]}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card size="small">
          <Statistic title="Total RH consolidado" value={brl(summary.consolidation.total)} />
        </Card>
      </Col>
    </Row>
  );
}

export default function RdFinancePanel({ projectId }: Props) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { data: summary } = useQuery({
    queryKey: ['finance-summary', projectId, year],
    queryFn: () => api.getFinanceSummary(projectId, year),
  });

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <span>Ano-base:</span>
          <InputNumber value={year} onChange={(v) => v && setYear(v)} min={2000} max={2100} />
        </Space>
        <Button icon={<DownloadOutlined />} onClick={() => api.downloadFinanceXlsx(projectId, year)}>
          Exportar XLSX
        </Button>
      </Space>

      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Lançamentos" value={summary.totals.lancamentos} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Erros (glosa)" value={summary.totals.erros} valueStyle={{ color: summary.totals.erros ? '#cf1322' : undefined }} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Alertas" value={summary.totals.alertas} valueStyle={{ color: summary.totals.alertas ? '#faad14' : undefined }} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="Cobertura evidência" value={summary.totals.coberturaEvidencia} suffix="%" /></Card></Col>
        </Row>
      )}

      {summary && summary.findings.errors.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${summary.findings.errors.length} apontamento(s) bloqueante(s) de glosa`}
          description={
            <div>
              {summary.findings.errors.slice(0, 5).map((f, i) => (
                <div key={i}><Tag color="red">{f.code}</Tag>{f.message}</div>
              ))}
            </div>
          }
        />
      )}

      <Tabs
        items={[
          { key: 'allocations', label: 'Alocação RH', children: <AllocationsTab projectId={projectId} year={year} /> },
          { key: 'collaborators', label: 'Colaboradores', children: <CollaboratorsTab projectId={projectId} year={year} /> },
          { key: 'activities', label: 'Atividades & Planejamento', children: <ActivitiesTab projectId={projectId} year={year} /> },
          { key: 'resumo', label: 'Resumo', children: <ResumoTab projectId={projectId} year={year} /> },
        ]}
      />
    </div>
  );
}
