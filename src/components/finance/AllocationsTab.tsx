import { App, Button, Form, Input, InputNumber, Modal, Popover, Select, Space, Switch, Table, Tag } from 'antd';
import { WarningTwoTone, CheckCircleTwoTone } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import type { RhAllocation, RhNivel } from '../../types';
import { brl, MONTHS, NIVEL_COLOR, RECON_LABEL } from './utils';

type Props = { projectId: string; year: number };

function FindingsCell({ a }: { a: RhAllocation }) {
  const { findings, blocking } = a.validation;
  if (!findings.length) return <CheckCircleTwoTone twoToneColor="#52c41a" />;
  return (
    <Popover
      title="Apontamentos"
      content={
        <div style={{ maxWidth: 360 }}>
          {findings.map((f, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <Tag color={f.severity === 'error' ? 'red' : 'orange'}>{f.severity === 'error' ? 'ERRO' : 'ALERTA'}</Tag>
              {f.message}
            </div>
          ))}
        </div>
      }
    >
      <WarningTwoTone twoToneColor={blocking ? '#cf1322' : '#faad14'} /> <span>{findings.length}</span>
    </Popover>
  );
}

export default function AllocationsTab({ projectId, year }: Props) {
  const { notification } = App.useApp();
  const qc = useQueryClient();
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['rh-allocations', projectId, year],
    queryFn: () => api.getRhAllocations(projectId, year),
  });
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', projectId, year],
    queryFn: () => api.getActivities(projectId, year),
  });
  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators', projectId],
    queryFn: () => api.getCollaborators(projectId),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => api.getDocuments(projectId),
  });

  const [open, setOpen] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState<RhAllocation | null>(null);
  const [form] = Form.useForm();
  const [evForm] = Form.useForm();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rh-allocations', projectId, year] });
    qc.invalidateQueries({ queryKey: ['finance-summary', projectId] });
  };

  const create = useMutation({
    mutationFn: (v: { activityId: string; collaboratorId: string; month: number; horas: number; justificativa: string }) =>
      api.createRhAllocation(projectId, { ...v, year }),
    onSuccess: () => { invalidate(); setOpen(false); form.resetFields(); },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const remove = useMutation({ mutationFn: (id: string) => api.deleteRhAllocation(id), onSuccess: invalidate });

  const addEvidence = useMutation({
    mutationFn: (v: { documentId: string; valorComprovado?: number; conferido?: boolean; observacao?: string }) =>
      api.addEvidence(evidenceFor!.id, v),
    onSuccess: (updated) => { invalidate(); setEvidenceFor(updated); evForm.resetFields(); },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const toggleEvidence = useMutation({
    mutationFn: (v: { evId: string; conferido: boolean }) => api.updateEvidence(v.evId, { conferido: v.conferido }),
    onSuccess: (updated) => { invalidate(); setEvidenceFor(updated); },
  });

  const delEvidence = useMutation({
    mutationFn: (evId: string) => api.deleteEvidence(evId),
    onSuccess: (updated) => { invalidate(); setEvidenceFor(updated); },
  });

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => { form.resetFields(); setOpen(true); }}>+ Lançamento RH</Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={allocations}
        pagination={false}
        size="small"
        columns={[
          { title: 'Mês', dataIndex: 'month', render: (m: number) => MONTHS[m - 1], width: 60 },
          { title: 'Colaborador', dataIndex: 'collaboratorName' },
          { title: 'Atividade', dataIndex: 'activityName' },
          { title: 'Horas', dataIndex: 'horas', width: 70 },
          { title: 'H/H', dataIndex: 'valorHora', render: (v) => brl(v), width: 100 },
          { title: 'Valor', dataIndex: 'valorTotal', render: (v) => brl(v), width: 110 },
          {
            title: 'Nível',
            render: (_, a) => <Tag color={NIVEL_COLOR[a.validation.nivel as RhNivel]}>{a.validation.nivel}</Tag>,
          },
          {
            title: 'Conciliação',
            dataIndex: 'reconStatus',
            render: (s: string) => <Tag color={RECON_LABEL[s]?.color}>{RECON_LABEL[s]?.text ?? s}</Tag>,
          },
          { title: 'Validação', render: (_, a) => <FindingsCell a={a} /> },
          {
            title: 'Ações',
            render: (_, a) => (
              <Space>
                <Button size="small" onClick={() => { setEvidenceFor(a); evForm.resetFields(); }}>
                  Comprovante ({a.evidences.length})
                </Button>
                <Button size="small" danger onClick={() => remove.mutate(a.id)}>Excluir</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={`Novo lançamento RH (${year})`}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then((v) => create.mutate(v))}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="collaboratorId" label="Colaborador" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={collaborators.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="activityId" label="Atividade" rules={[{ required: true }]}>
            <Select options={activities.map((a) => ({ value: a.id, label: a.name }))} />
          </Form.Item>
          <Form.Item name="month" label="Mês" rules={[{ required: true }]}>
            <Select options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
          </Form.Item>
          <Form.Item name="horas" label="Horas lançadas" rules={[{ required: true }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="justificativa" label="Justificativa técnica (o que foi feito)" rules={[{ required: true, min: 30, message: 'Mínimo 30 caracteres' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Comprovantes — ${evidenceFor?.collaboratorName ?? ''} (${brl(evidenceFor?.valorTotal)})`}
        open={!!evidenceFor}
        onCancel={() => setEvidenceFor(null)}
        footer={null}
        width={640}
      >
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={evidenceFor?.evidences ?? []}
          columns={[
            { title: 'Documento', dataIndex: 'documentId', render: (id) => documents.find((d) => d.id === id)?.name ?? id },
            { title: 'Valor compr.', dataIndex: 'valorComprovado', render: (v) => (v != null ? brl(v) : '—') },
            {
              title: 'Conferido',
              render: (_, e) => (
                <Switch checked={e.conferido} onChange={(c) => toggleEvidence.mutate({ evId: e.id, conferido: c })} />
              ),
            },
            { title: '', render: (_, e) => <Button size="small" danger onClick={() => delEvidence.mutate(e.id)}>x</Button> },
          ]}
          locale={{ emptyText: 'Nenhum comprovante vinculado' }}
        />

        <Form form={evForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => addEvidence.mutate(v)}>
          <Form.Item name="documentId" label="Vincular documento (comprovante)" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Selecione um documento do projeto"
              options={documents.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Space align="end">
            <Form.Item name="valorComprovado" label="Valor do comprovante">
              <InputNumber style={{ width: 180 }} min={0} />
            </Form.Item>
            <Form.Item name="conferido" label="Conferido?" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={addEvidence.isPending}>Vincular</Button>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
