import { App, Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import type { RdActivity } from '../../types';
import { brl, VINCULO_OPTIONS } from './utils';

type Props = { projectId: string; year: number };

export default function ActivitiesTab({ projectId, year }: Props) {
  const { notification } = App.useApp();
  const qc = useQueryClient();
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', projectId, year],
    queryFn: () => api.getActivities(projectId, year),
  });
  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators', projectId],
    queryFn: () => api.getCollaborators(projectId),
  });

  const [actOpen, setActOpen] = useState(false);
  const [editing, setEditing] = useState<RdActivity | null>(null);
  const [plannedFor, setPlannedFor] = useState<RdActivity | null>(null);
  const [actForm] = Form.useForm();
  const [plannedForm] = Form.useForm();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['activities', projectId, year] });

  const saveAct = useMutation({
    mutationFn: (v: Partial<RdActivity>) =>
      editing ? api.updateActivity(editing.id, v) : api.createActivity(projectId, { ...v, year } as never),
    onSuccess: () => { invalidate(); setActOpen(false); setEditing(null); actForm.resetFields(); },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const delAct = useMutation({ mutationFn: (id: string) => api.deleteActivity(id), onSuccess: invalidate });

  const savePlanned = useMutation({
    mutationFn: (v: { collaboratorId: string; funcao: string; horasPrevistas: number; valorPrevisto: number }) =>
      api.setPlanned(plannedFor!.id, v),
    onSuccess: () => { invalidate(); setPlannedFor(null); plannedForm.resetFields(); },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const delPlanned = useMutation({ mutationFn: (id: string) => api.deletePlanned(id), onSuccess: invalidate });

  const nameOf = (id: string) => collaborators.find((c) => c.id === id)?.name ?? id;

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => { setEditing(null); actForm.resetFields(); setActOpen(true); }}>
          + Atividade
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={activities}
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender: (a) => (
            <div>
              <Space style={{ marginBottom: 8 }}>
                <b>Planejamento (quem foi previsto):</b>
                <Button size="small" onClick={() => { setPlannedFor(a); plannedForm.resetFields(); }}>
                  + Planejar pessoa
                </Button>
              </Space>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={a.plannedRoles ?? []}
                columns={[
                  { title: 'Colaborador', render: (_, p) => nameOf(p.collaboratorId) },
                  { title: 'Função prevista', dataIndex: 'funcao' },
                  { title: 'Horas prev.', dataIndex: 'horasPrevistas' },
                  { title: 'Valor prev.', dataIndex: 'valorPrevisto', render: (v) => brl(v) },
                  { title: '', render: (_, p) => <Button size="small" danger onClick={() => delPlanned.mutate(p.id)}>x</Button> },
                ]}
                locale={{ emptyText: 'Nenhuma pessoa planejada nesta atividade' }}
              />
            </div>
          ),
        }}
        columns={[
          { title: '#', dataIndex: 'ordinal', width: 50 },
          { title: 'Atividade', dataIndex: 'name' },
          { title: 'Propósito', dataIndex: 'purpose', ellipsis: true, render: (v) => <Tooltip title={v}>{v}</Tooltip> },
          { title: 'Vínculo', dataIndex: 'vinculo' },
          { title: 'Planejados', render: (_, a) => <Tag>{a.plannedRoles?.length ?? 0}</Tag> },
          {
            title: 'Ações',
            render: (_, a) => (
              <Space>
                <Button size="small" onClick={() => { setEditing(a); actForm.setFieldsValue(a); setActOpen(true); }}>Editar</Button>
                <Button size="small" danger onClick={() => delAct.mutate(a.id)}>Excluir</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Editar atividade' : `Nova atividade (${year})`}
        open={actOpen}
        onCancel={() => setActOpen(false)}
        onOk={() => actForm.validateFields().then((v) => saveAct.mutate(v))}
        confirmLoading={saveAct.isPending}
      >
        <Form form={actForm} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="purpose" label="Propósito específico"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="vinculo" label="Vínculo" initialValue="externo">
            <Select options={VINCULO_OPTIONS} />
          </Form.Item>
          <Space>
            <Form.Item name="startDate" label="Início"><Input type="date" /></Form.Item>
            <Form.Item name="endDate" label="Fim"><Input type="date" /></Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={`Planejar pessoa — ${plannedFor?.name ?? ''}`}
        open={!!plannedFor}
        onCancel={() => setPlannedFor(null)}
        onOk={() => plannedForm.validateFields().then((v) => savePlanned.mutate(v))}
        confirmLoading={savePlanned.isPending}
      >
        <Form form={plannedForm} layout="vertical">
          <Form.Item name="collaboratorId" label="Colaborador" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={collaborators.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="funcao" label="Função prevista" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="horasPrevistas" label="Horas previstas" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="valorPrevisto" label="Valor previsto" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
