import { Button, Checkbox, Input, List, Progress, Space, Typography, Empty, Skeleton, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import type { ChecklistItem, ProjectPhase } from '../../types';
import { PHASE_LABELS } from '../../types';
import {
  useChecklist,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useChecklist';

interface PhaseChecklistProps {
  projectId: string;
  phase: ProjectPhase;
}

export default function PhaseChecklist({ projectId, phase }: PhaseChecklistProps) {
  const { data: items = [], isLoading } = useChecklist(projectId, phase);
  const add = useAddChecklistItem(projectId);
  const update = useUpdateChecklistItem(projectId);
  const remove = useDeleteChecklistItem(projectId);

  const [newLabel, setNewLabel] = useState('');

  const stats = useMemo(() => {
    const done = items.filter((i) => i.done).length;
    const total = items.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, pct };
  }, [items]);

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    await add.mutateAsync({ phase, label });
    setNewLabel('');
  };

  const handleToggle = (item: ChecklistItem) => {
    update.mutate({ itemId: item.id, patch: { done: !item.done } });
  };

  if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;

  return (
    <div>
      <Space
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <Typography.Text strong>
          Checklist da fase: {PHASE_LABELS[phase]}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {stats.done}/{stats.total} concluído(s)
        </Typography.Text>
      </Space>

      <Progress
        percent={stats.pct}
        size="small"
        style={{ marginBottom: 12 }}
        strokeColor={{ '0%': '#f9c556', '100%': '#d4a23a' }}
      />

      {items.length === 0 ? (
        <Empty
          description="Nenhum item nesta fase. Adicione abaixo."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '12px 0' }}
        />
      ) : (
        <List
          size="small"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '8px 0' }}
              actions={[
                <Popconfirm
                  key="del"
                  title="Remover item?"
                  okText="Remover"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => remove.mutate(item.id)}
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label="Remover"
                  />
                </Popconfirm>,
              ]}
            >
              <Checkbox
                checked={item.done}
                onChange={() => handleToggle(item)}
                disabled={update.isPending}
              >
                <span
                  style={{
                    textDecoration: item.done ? 'line-through' : 'none',
                    color: item.done ? '#999' : 'inherit',
                  }}
                >
                  {item.label}
                </span>
              </Checkbox>
            </List.Item>
          )}
        />
      )}

      <Space.Compact style={{ width: '100%', marginTop: 8 }}>
        <Input
          placeholder="Adicionar item ao checklist..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onPressEnter={handleAdd}
          disabled={add.isPending}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          loading={add.isPending}
          disabled={!newLabel.trim()}
        >
          Adicionar
        </Button>
      </Space.Compact>
    </div>
  );
}
