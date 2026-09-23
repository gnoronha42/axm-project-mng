import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useCreateUser, useUsers } from '../hooks/useUsers';
import { ApiError } from '../services/apiClient';
import type { TeamUser } from '../types';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  analista: 'Analista',
  consultoria: 'Consultoria',
  empresa: 'Empresa',
  instituto: 'Instituto',
};

const ROLE_COLOR: Record<string, string> = {
  admin: 'gold',
  analista: 'blue',
};

export default function Equipe() {
  const { notification } = App.useApp();
  const { data, isLoading, isError, error } = useUsers();
  const createUser = useCreateUser();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ name: string; email: string; password: string }>();

  const columns: ColumnsType<TeamUser> = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    {
      title: 'Perfil',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: string) => (
        <Tag color={ROLE_COLOR[role] ?? 'default'}>{ROLE_LABEL[role] ?? role}</Tag>
      ),
    },
    {
      title: 'Desde',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      responsive: ['md'],
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Typography.Title level={3} className="axm-page-title" style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Equipe
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Cadastrar analista
        </Button>
      </div>

      <Card>
        {isError && (
          <Typography.Paragraph type="danger">
            {error instanceof ApiError && error.status === 404
              ? 'A API ainda precisa ser atualizada para listar e cadastrar analistas.'
              : error instanceof ApiError
                ? error.message
                : 'Não foi possível carregar a equipe.'}
          </Typography.Paragraph>
        )}
        <div className="axm-table-scroll">
          <Table
            dataSource={data ?? []}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            locale={{ emptyText: 'Nenhum analista cadastrado ainda.' }}
          />
        </div>
      </Card>

      <Modal
        title="Cadastrar analista"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        okText="Cadastrar"
        cancelText="Cancelar"
        confirmLoading={createUser.isPending}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            try {
              await createUser.mutateAsync(values);
              notification.success({ message: 'Analista cadastrado' });
              setOpen(false);
              form.resetFields();
            } catch (err) {
              notification.error({
                message: 'Falha ao cadastrar',
                description: err instanceof ApiError ? err.message : 'Tente novamente',
              });
            }
          }}
        >
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input placeholder="Nome completo" />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Informe o e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input placeholder="analista@empresa.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Senha inicial"
            rules={[
              { required: true, message: 'Informe a senha' },
              { min: 6, message: 'Mínimo de 6 caracteres' },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
