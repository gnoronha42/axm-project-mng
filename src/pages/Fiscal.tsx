import { Card, Col, Form, Input, InputNumber, Row, Select, Statistic, Table, Typography, Button, App, Alert, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api } from '../services/api';
import type { AllocationCategory, BillingPeriod } from '../types';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CAT_LABEL: Record<AllocationCategory, string> = {
  ict_amazonia: 'ICT Amazônia Ocidental / Amapá (0,9%)',
  fndct: 'FNDCT (0,2%)',
  capda_priority: 'Programa Prioritário CAPDA',
  other: 'Demais PD&I (complemento 2,7%)',
};

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Fiscal() {
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({ queryKey: ['tenants'], queryFn: api.getTenants });
  const empresas = tenants.filter((t) => t.kind === 'empresa');
  const [tenantId, setTenantId] = useState<string>();
  const effectiveTenant = tenantId ?? empresas[0]?.id;
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['billing', effectiveTenant],
    queryFn: () => api.getBillingPeriods(effectiveTenant),
    enabled: !!effectiveTenant,
  });

  const [form] = Form.useForm();
  const [allocForm] = Form.useForm();
  const [selectedId, setSelectedId] = useState<string>();
  const selected = useMemo(
    () => periods.find((p) => p.id === selectedId) ?? periods[0],
    [periods, selectedId],
  );

  const savePeriod = useMutation({
    mutationFn: api.saveBillingPeriod,
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      setSelectedId(row.id);
      notification.success({ message: 'Obrigação PD&I recalculada' });
    },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const addAlloc = useMutation({
    mutationFn: (input: { category: AllocationCategory; amount: number; description: string }) =>
      api.addAllocation(selected!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      allocForm.resetFields();
    },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  return (
    <div>
      <Typography.Title level={3} className="axm-page-title">Motor Fiscal Suframa</Typography.Title>

      <Select
        style={{ minWidth: 280, marginBottom: 16 }}
        placeholder="Empresa beneficiária"
        value={effectiveTenant}
        onChange={setTenantId}
        options={empresas.map((t) => ({ value: t.id, label: t.name }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Entrada de faturamento">
            <Form
              form={form}
              layout="vertical"
              initialValues={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1, ipiDeduction: 0, icmsDeduction: 0 }}
              onFinish={(v) => savePeriod.mutate({ ...v, tenantId: effectiveTenant })}
            >
              <Row gutter={8}>
                <Col span={12}><Form.Item name="year" label="Ano" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="month" label="Mês" rules={[{ required: true }]}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <Form.Item name="grossRevenue" label="Faturamento bruto" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="ipiDeduction" label="Dedução IPI"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="icmsDeduction" label="Dedução ICMS"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Button type="primary" htmlType="submit" loading={savePeriod.isPending} block>Calcular obrigação</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          {selected ? (
            <Card title={`${MONTHS[selected.month - 1]}/${selected.year}`}>
              <Row gutter={12}>
                <Col span={8}><Statistic title="Líquido" value={selected.netRevenue} formatter={(v) => brl(Number(v))} /></Col>
                <Col span={8}><Statistic title="Obrigação 5%" value={selected.pdiObligation} formatter={(v) => brl(Number(v))} /></Col>
                <Col span={8}><Statistic title="Investido" value={selected.validation.invested} formatter={(v) => brl(Number(v))} /></Col>
              </Row>
              {selected.validation.alerts.map((a) => (
                <Alert
                  key={a.code}
                  type={a.severity === 'error' ? 'error' : 'warning'}
                  message={a.message}
                  description={a.cite}
                  style={{ marginTop: 8 }}
                />
              ))}
              {selected.validation.compliant && (
                <Alert type="success" message="Repartição em conformidade com Lei 8.387/Decreto 10.521." style={{ marginTop: 8 }} />
              )}
              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col span={8}><Statistic title="Mín. ICT 0,9%" value={selected.validation.minIct} formatter={(v) => brl(Number(v))} /></Col>
                <Col span={8}><Statistic title="Mín. FNDCT 0,2%" value={selected.validation.minFndct} formatter={(v) => brl(Number(v))} /></Col>
                <Col span={8}><Statistic title="Cesta 2,3%" value={selected.validation.minParagraph4} formatter={(v) => brl(Number(v))} /></Col>
              </Row>
              <Typography.Title level={5} style={{ marginTop: 16 }}>Alocar investimento</Typography.Title>
              <Form form={allocForm} layout="inline" onFinish={(v) => addAlloc.mutate(v)} style={{ rowGap: 8 }}>
                <Form.Item name="category" rules={[{ required: true }]}>
                  <Select placeholder="Categoria" style={{ width: 220 }} options={Object.entries(CAT_LABEL).map(([value, label]) => ({ value, label }))} />
                </Form.Item>
                <Form.Item name="amount" rules={[{ required: true }]}><InputNumber min={0} placeholder="Valor" /></Form.Item>
                <Form.Item name="description" rules={[{ required: true }]}><Input placeholder="Descrição" /></Form.Item>
                <Button type="primary" htmlType="submit" loading={addAlloc.isPending}>Adicionar</Button>
              </Form>
            </Card>
          ) : (
            <Card loading={isLoading}><Typography.Text type="secondary">Nenhum período ainda.</Typography.Text></Card>
          )}
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="Histórico">
        <Table<BillingPeriod>
          rowKey="id"
          dataSource={periods}
          size="small"
          onRow={(row) => ({ onClick: () => setSelectedId(row.id), style: { cursor: 'pointer' } })}
          columns={[
            { title: 'Período', render: (_, r) => `${String(r.month).padStart(2, '0')}/${r.year}` },
            { title: 'Bruto', render: (_, r) => brl(r.grossRevenue) },
            { title: 'Líquido', render: (_, r) => brl(r.netRevenue) },
            { title: 'Obrigação', render: (_, r) => brl(r.pdiObligation) },
            {
              title: 'Status',
              render: (_, r) => r.validation.compliant
                ? <Tag color="success">OK</Tag>
                : <Tag color="error">{r.validation.alerts[0]?.code}</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
