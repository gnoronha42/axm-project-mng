import { CameraOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Card, Form, Input, Segmented, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { mediaUrl } from '../services/apiClient';
import { useThemeMode } from '../theme/ThemeContext';

export default function Perfil() {
  const { user, updateProfile } = useAuth();
  const { mode, setMode } = useThemeMode();
  const { notification } = App.useApp();
  const [form] = Form.useForm<{ name: string; email: string }>();
  const [avatarFile, setAvatarFile] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({ name: user.name, email: user.email });
    setAvatarPreview(mediaUrl(user.avatarUrl));
  }, [user, form]);

  if (!user) return null;

  return (
    <div>
      <Typography.Title level={3} className="axm-page-title">
        Minha conta
      </Typography.Title>

      <Card style={{ maxWidth: 560 }}>
        <div className="axm-profile-photo">
          <Avatar
            size={88}
            src={avatarPreview}
            icon={<UserOutlined />}
            style={{ background: '#f9c556', color: '#111' }}
          />
          <Upload
            accept="image/png,image/jpeg,image/webp"
            showUploadList={false}
            beforeUpload={(file) => {
              if (file.size > 2 * 1024 * 1024) {
                notification.error({ message: 'A foto deve ter no máximo 2 MB' });
                return Upload.LIST_IGNORE;
              }
              setAvatarFile(file);
              setAvatarPreview(URL.createObjectURL(file));
              return false;
            }}
          >
            <Button icon={<CameraOutlined />}>Trocar foto</Button>
          </Upload>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            setSaving(true);
            try {
              await updateProfile({
                name: values.name,
                email: values.email,
                avatarFile,
                avatarPreview,
              });
              notification.success({ message: 'Conta atualizada' });
              setAvatarFile(undefined);
            } catch {
              notification.error({ message: 'Não foi possível salvar a conta' });
            } finally {
              setSaving(false);
            }
          }}
        >
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input prefix={<UserOutlined />} placeholder="Seu nome" />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Informe o e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="voce@empresa.com" />
          </Form.Item>

          <Form.Item label="Tema da página">
            <Segmented
              value={mode}
              onChange={(value) => setMode(value as 'light' | 'dark')}
              options={[
                { label: 'Claro', value: 'light' },
                { label: 'Escuro', value: 'dark' },
              ]}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving}>
            Salvar alterações
          </Button>
        </Form>
      </Card>
    </div>
  );
}
