import { Button, Card, Form, Input, Typography, App } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../services/apiClient';
import logo from '../assets/images.png';

const DEV_LOGIN = import.meta.env.DEV
  ? { email: 'admin@axm.local', password: 'admin123' }
  : undefined;

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const { notification } = App.useApp();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="axm-auth-page">
      <Card className="axm-auth-card">
        <div className="axm-auth-brand">
          <img src={logo} alt="AXM" width={96} height={96} />
          <Typography.Title level={3} style={{ margin: '12px 0 4px' }}>
            AXM Project Manager
          </Typography.Title>
          <Typography.Text type="secondary">Entre com sua conta</Typography.Text>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          initialValues={DEV_LOGIN}
          onFinish={async (values: { email: string; password: string }) => {
            try {
              await login(values.email, values.password);
              navigate('/', { replace: true });
            } catch (err) {
              notification.error({
                message: 'Falha no login',
                description: err instanceof ApiError ? err.message : 'Tente novamente',
              });
            }
          }}
        >
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Informe o e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="voce@empresa.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[{ required: true, message: 'Informe a senha' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Entrar
          </Button>
        </Form>
        {DEV_LOGIN && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, textAlign: 'center' }}>
            Login de teste: {DEV_LOGIN.email} / {DEV_LOGIN.password}
          </Typography.Paragraph>
        )}

        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Não tem conta? <Link to="/register">Criar conta</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const { notification } = App.useApp();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="axm-auth-page">
      <Card className="axm-auth-card">
        <div className="axm-auth-brand">
          <img src={logo} alt="AXM" width={96} height={96} />
          <Typography.Title level={3} style={{ margin: '12px 0 4px' }}>
            Criar conta
          </Typography.Title>
          <Typography.Text type="secondary">Cadastro no AXM Project Manager</Typography.Text>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={async (values: { name: string; email: string; password: string }) => {
            try {
              await register(values.name, values.email, values.password);
              notification.success({ message: 'Conta criada com sucesso' });
              navigate('/', { replace: true });
            } catch (err) {
              notification.error({
                message: 'Não foi possível criar a conta',
                description: err instanceof ApiError ? err.message : 'Tente novamente',
              });
            }
          }}
        >
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Informe seu nome' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Seu nome" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Informe o e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="voce@empresa.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[
              { required: true, message: 'Informe a senha' },
              { min: 6, message: 'Mínimo de 6 caracteres' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 6 caracteres" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Criar conta
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
