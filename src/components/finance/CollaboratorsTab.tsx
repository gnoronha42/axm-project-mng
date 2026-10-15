import { App, Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import type { Collaborator } from '../../types';
import { brl, VINCULO_OPTIONS } from './utils';

type Props = { projectId: string; year: number };

export default function CollaboratorsTab({ projectId, year }: Props) {
  const { notification } = App.useApp();
  const qc = useQueryClient();
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ['collaborators', projectId],
    queryFn: () => api.getCollaborators(projectId),
  });

  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [costOpen, setCostOpen] = useState<Collaborator | null>(null);
  const [form] = Form.useForm();
  const [costForm] = Form.useForm();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['collaborators', projectId] });
    qc.invalidateQueries({ queryKey: ['finance-summary', projectId] });
  };

  const save = useMutation({
    mutationFn: (v: Partial<Collaborator>) =>
      editing ? api.updateCollaborator(editing.id, v) : api.createCollaborator(projectId, v as never),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCollaborator(id),
    onSuccess: invalidate,
  });

  const saveCost = useMutation({
    mutationFn: (v: Record<string, number>) => api.saveCost(costOpen!.id, year, v),
    onSuccess: () => {
      invalidate();
      setCostOpen(null);
      costForm.resetFields();
      notification.success({ message: 'Folha salva e H/H recalculado' });
    },
    onError: (e: Error) => notification.error({ message: e.message }),
  });

  const openEdit = (c: Collaborator) => {
    setEditing(c);
    form.setFieldsValue(c);
    setFormOpen(true);
  };

  const openCost = (c: Collaborator) => {
    setCostOpen(c);
    const cost = c.costs?.find((x) => x.year === year);
    costForm.setFieldsValue(cost ?? { salarioTotal: 0, encargosTotal: 0, beneficiosTotal: 0, horasAno: 0, horasUteis: 0 });
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => { setEditing(null); form.resetFields(); setFormOpen(true); }}>
          + Colaborador
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={collaborators}
        pagination={false}
        size="small"
        columns={[
          { title: 'Nome', dataIndex: 'name' },
          { title: 'CPF', dataIndex: 'cpf' },
          { title: 'Função', dataIndex: 'cargoProjeto', render: (v) => v || <Tag color="red">definir</Tag> },
          { title: 'Vínculo', dataIndex: 'vinculo' },
          {
            title: 'Planejado?',
            dataIndex: 'planned',
            render: (v: boolean) => (v ? <Tag color="green">Sim</Tag> : <Tag color="red">NÃO</Tag>),
          },
          {
            title: `Valor H/H (${year})`,
            render: (_, c) => {
              const cost = c.costs?.find((x) => x.year === year);
              return cost?.valorHora ? brl(cost.valorHora) : <Tag>sem folha</Tag>;
            },
          },
          {
            title: 'Ações',
            render: (_, c) => (
              <Space>
                <Button size="small" onClick={() => openCost(c)}>Folha</Button>
                <Button size="small" onClick={() => openEdit(c)}>Editar</Button>
                <Button size="small" danger onClick={() => remove.mutate(c.id)}>Excluir</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Editar colaborador' : 'Novo colaborador'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.validateFields().then((v) => save.mutate(v))}
        confirmLoading={save.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cpf" label="CPF" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cargoProjeto" label="Função no projeto">
            <Input placeholder="Ex.: Analista de requisitos" />
          </Form.Item>
          <Space>
            <Form.Item name="vinculo" label="Vínculo" initialValue="externo">
              <Select options={VINCULO_OPTIONS} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="dirInd" label="Dir/Ind" initialValue="direto">
              <Select
                style={{ width: 130 }}
                options={[{ value: 'direto', label: 'Direto' }, { value: 'indireto', label: 'Indireto' }]}
              />
            </Form.Item>
          </Space>
          <Space>
            <Form.Item name="admissao" label="Admissão">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="rescisao" label="Rescisão">
              <Input type="date" />
            </Form.Item>
          </Space>
          <Form.Item name="planned" label="Consta no Plano de Trabalho?" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item name="miniCv" label="Mini-currículo">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Folha ${year} — ${costOpen?.name ?? ''} (valores importados)`}
        open={!!costOpen}
        onCancel={() => setCostOpen(null)}
        onOk={() => costForm.validateFields().then((v) => saveCost.mutate(v))}
        confirmLoading={saveCost.isPending}
      >
        <Form form={costForm} layout="vertical">
          <Form.Item name="salarioTotal" label="Salário total (ano)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="encargosTotal" label="Encargos total (INSS/FGTS/RAT…)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="beneficiosTotal" label="Benefícios total"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="horasAno" label="Horas/ano contratadas"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="horasUteis" label="Horas úteis (base do H/H)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
