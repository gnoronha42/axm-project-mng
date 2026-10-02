import { FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Modal, Select, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useCreateRd, useRdList } from '../hooks/useRd';
import { ApiError } from '../services/apiClient';

const STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  generated: 'blue',
  final: 'green',
};

export default function RdList() {
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const { data, isLoading } = useRdList();
  const { data: projects } = useProjects();
  const createRd = useCreateRd();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ projectId: string; enquadramento: string }>();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Typography.Title level={3} className="axm-page-title" style={{ margin: 0 }}>
          <FileProtectOutlined style={{ marginRight: 8 }} />
          Relatórios Demonstrativos
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Novo RD
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data ?? []}
          pagination={false}
          onRow={(row) => ({ onClick: () => navigate(`/rd/${row.id}`), style: { cursor: 'pointer' } })}
          columns={[
            { title: 'Título', dataIndex: 'title' },
            { title: 'Projeto', dataIndex: ['project', 'title'] },
            {
              title: 'Enquadramento',
              dataIndex: 'enquadramento',
              render: (v: string) => (v === 'lei_informatica' ? 'Lei de Informática' : 'Suframa'),
            },
            { title: 'v.', dataIndex: 'version', width: 60 },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
            },
            { title: 'Afirmações', dataIndex: 'claims', width: 110 },
            {
              title: 'Atualizado',
              dataIndex: 'updatedAt',
              render: (v: string) => new Date(v).toLocaleDateString('pt-BR'),
            },
          ]}
        />
      </Card>

      <Modal
        title="Novo RD técnico"
        open={open}
        okText="Criar"
        cancelText="Cancelar"
        confirmLoading={createRd.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enquadramento: 'suframa' }}
          onFinish={async (values) => {
            try {
              const report = await createRd.mutateAsync(values);
              setOpen(false);
              form.resetFields();
              navigate(`/rd/${report.id}`);
            } catch (err) {
              notification.error({
                message: 'Não foi possível criar o RD',
                description: err instanceof ApiError ? err.message : undefined,
              });
            }
          }}
        >
          <Form.Item name="projectId" label="Projeto" rules={[{ required: true, message: 'Selecione o projeto' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(projects ?? []).map((p) => ({ value: p.id, label: `${p.title} — ${p.client}` }))}
            />
          </Form.Item>
          <Form.Item name="enquadramento" label="Enquadramento" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'suframa', label: 'Suframa PD&I (Anexo V)' },
                { value: 'lei_informatica', label: 'Lei de Informática (template genérico)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
