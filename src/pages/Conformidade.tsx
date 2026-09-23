import { Alert, Button, Card, List, Space, Tag, Typography, App, Select } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../services/api';

export default function Conformidade() {
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({ queryKey: ['tenants'], queryFn: api.getTenants });
  const empresas = tenants.filter((t) => t.kind === 'empresa');
  const [tenantId, setTenantId] = useState<string>();
  const effective = tenantId ?? empresas[0]?.id;

  const { data: periods = [] } = useQuery({
    queryKey: ['billing', effective],
    queryFn: () => api.getBillingPeriods(effective),
    enabled: !!effective,
  });
  const { data: risks = [] } = useQuery({ queryKey: ['glosa'], queryFn: () => api.getGlosaRisks() });
  const { data: jobs = [] } = useQuery({ queryKey: ['sagat-jobs'], queryFn: api.getSagatJobs });
  const [periodId, setPeriodId] = useState<string>();
  const selected = periodId ?? periods[0]?.id;

  const run = useMutation({
    mutationFn: () => api.sagatSandboxRun(selected!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sagat-jobs'] });
      notification[res.status === 'sandbox_ok' ? 'success' : 'warning']({
        message: res.status === 'sandbox_ok' ? 'Envio validado' : 'Validação bloqueada',
      });
    },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  return (
    <div>
      <Typography.Title level={3} className="axm-page-title">Conformidade e SAGAT</Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          style={{ minWidth: 240 }}
          placeholder="Empresa"
          value={effective}
          onChange={setTenantId}
          options={empresas.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Select
          style={{ minWidth: 180 }}
          placeholder="Período"
          value={selected}
          onChange={setPeriodId}
          options={periods.map((p) => ({ value: p.id, label: `${p.month}/${p.year}` }))}
        />
        <Button type="primary" disabled={!selected} loading={run.isPending} onClick={() => run.mutate()}>
          Validar envio
        </Button>
      </Space>

      <Card title="Riscos de glosa" style={{ marginBottom: 16 }}>
        {risks.length === 0 ? (
          <Typography.Text type="secondary">Nenhum alerta no momento.</Typography.Text>
        ) : (
          <List
            dataSource={risks}
            renderItem={(r) => (
              <List.Item>
                <List.Item.Meta
                  title={<Space><Tag color={r.severity === 'error' ? 'red' : 'gold'}>{r.code}</Tag>{r.message}</Space>}
                  description={new Date(r.createdAt).toLocaleString('pt-BR')}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="Histórico SAGAT">
        {jobs.length === 0 ? (
          <Alert type="info" message="Nenhuma execução ainda." />
        ) : (
          <List
            dataSource={jobs}
            renderItem={(j) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={j.status === 'sandbox_ok' ? 'green' : 'red'}>
                        {j.status === 'sandbox_ok' ? 'Validado' : 'Bloqueado'}
                      </Tag>
                      {j.status === 'sandbox_ok'
                        ? 'Demonstrativo validado.'
                        : 'A validação encontrou pendências.'}
                    </Space>
                  }
                  description={new Date(j.createdAt).toLocaleString('pt-BR')}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
