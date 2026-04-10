import { List, Avatar, Typography, Input, Button, Space, Tag } from 'antd';
import { UserOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { Comment, ProjectPhase } from '../../types';

const { TextArea } = Input;

interface CommentThreadProps {
  comments: Comment[];
  projectId: string;
  phase: ProjectPhase;
  onAddComment?: (content: string) => void;
  loading?: boolean;
}

export default function CommentThread({
  comments,
  phase,
  onAddComment,
  loading,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');

  const filtered = comments.filter((c) => c.phase === phase);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment?.(newComment.trim());
    setNewComment('');
  };

  return (
    <div>
      <List
        loading={loading}
        dataSource={filtered}
        locale={{ emptyText: 'Nenhum comentário nesta fase' }}
        renderItem={(comment) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} size="small" />}
              title={
                <Space>
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {comment.author}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(comment.createdAt).toLocaleString('pt-BR')}
                  </Typography.Text>
                  {comment.resolved && (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Resolvido
                    </Tag>
                  )}
                </Space>
              }
              description={
                <Typography.Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                  {comment.content}
                </Typography.Paragraph>
              }
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 16 }}>
        <TextArea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário..."
          onPressEnter={(e) => {
            if (e.ctrlKey) handleSubmit();
          }}
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            disabled={!newComment.trim()}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
