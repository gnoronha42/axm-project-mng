import { Modal, Form, Input, InputNumber, App } from 'antd';
import { useEffect } from 'react';
import { useCreateProject } from '../../hooks/useProjects';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

interface FormValues {
  title: string;
  client: string;
  description?: string;
  investor?: string;
  budget?: number;
  tags?: string;
}

export default function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const [form] = Form.useForm<FormValues>();
  const { notification } = App.useApp();
  const createProject = useCreateProject();

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const tags = (values.tags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createProject.mutateAsync({
        title: values.title,
        client: values.client,
        description: values.description,
        investor: values.investor,
        budget: values.budget,
        tags,
      });

      notification.success({
        message: 'Projeto criado',
        description: `"${created.title}" foi adicionado.`,
        placement: 'topRight',
      });

      onCreated?.(created.id);
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = err instanceof Error ? err.message : 'Falha ao criar projeto';
      notification.error({
        message: 'Não foi possível criar o projeto',
        description: msg,
        placement: 'topRight',
      });
    }
  };

  return (
    <Modal
      title="Novo Projeto"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Criar"
      cancelText="Cancelar"
      confirmLoading={createProject.isPending}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ description: '', investor: '', tags: '' }}
      >
        <Form.Item
          name="title"
          label="Título"
          rules={[{ required: true, message: 'Informe o título' }]}
        >
          <Input placeholder="Ex.: Modernização da Infraestrutura" autoFocus />
        </Form.Item>

        <Form.Item
          name="client"
          label="Cliente"
          rules={[{ required: true, message: 'Informe o cliente' }]}
        >
          <Input placeholder="Ex.: Prefeitura Municipal" />
        </Form.Item>

        <Form.Item name="description" label="Descrição">
          <Input.TextArea rows={3} placeholder="Resumo do projeto" />
        </Form.Item>

        <Form.Item name="investor" label="Investidor">
          <Input placeholder="Ex.: BNDES" />
        </Form.Item>

        <Form.Item name="budget" label="Orçamento (R$)">
          <InputNumber<number>
            style={{ width: '100%' }}
            min={0}
            step={1000}
            formatter={(v) =>
              v === undefined || v === null ? '' : `R$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
            }
            parser={((v?: string) => {
              const cleaned = v?.replace(/\D/g, '') ?? '';
              return cleaned === '' ? 0 : Number(cleaned);
            }) as unknown as (displayValue?: string) => number}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item name="tags" label="Tags" tooltip="Separe por vírgula">
          <Input placeholder="infraestrutura, TI, modernização" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
