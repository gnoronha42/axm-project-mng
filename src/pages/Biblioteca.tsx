import { BookOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Input, List, Space, Table, Tag, Typography, App } from 'antd';
import { useState } from 'react';
import { api } from '../services/api';
import type { KnowledgeDocument, KnowledgeHit } from '../types';

const KIND_COLOR: Record<string, string> = {
  lei: 'red',
  decreto: 'volcano',
  portaria: 'gold',
  manual: 'blue',
  resolucao: 'purple',
  template: 'green',
  parecer: 'default',
  treinamento: 'cyan',
};

const KIND_LABEL: Record<string, string> = {
  lei: 'LEI',
  decreto: 'DECRETO',
  portaria: 'PORTARIA',
  manual: 'MANUAL',
  resolucao: 'RESOLUÇÃO',
  template: 'MODELO',
  parecer: 'PARECER',
  treinamento: 'TREINAMENTO',
};

function KindTag({ kind }: { kind: string }) {
  return (
    <Tag className="axm-kind-tag" color={KIND_COLOR[kind] ?? 'default'}>
      {KIND_LABEL[kind] ?? kind.toUpperCase()}
    </Tag>
  );
}

export default function Biblioteca() {
  const { notification } = App.useApp();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['knowledge'], queryFn: api.getKnowledge });
  const search = useQuery({
    queryKey: ['knowledge-search', q],
    queryFn: () => api.searchKnowledge(q),
    enabled: q.trim().length >= 3,
  });

  return (
    <div>
      <Typography.Title level={3} className="axm-page-title">Biblioteca Suframa</Typography.Title>

      <Input.Search
        size="large"
        placeholder="Buscar na biblioteca"
        enterButton={<SearchOutlined />}
        onSearch={setQ}
        allowClear
        style={{ marginBottom: 16, maxWidth: 640 }}
      />

      {q.trim().length >= 3 && (
        <Card title={`Resultados para “${q}”`} style={{ marginBottom: 16 }} loading={search.isFetching}>
          <List<KnowledgeHit>
            dataSource={search.data?.hits ?? []}
            locale={{ emptyText: 'Nenhum trecho encontrado.' }}
            renderItem={(hit) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space align="center">
                      <KindTag kind={hit.kind} />
                      <Typography.Text strong style={{ fontSize: 14 }}>{hit.title}</Typography.Text>
                    </Space>
                  }
                  description={
                    <>
                      {hit.heading && <Typography.Text strong>{hit.heading} — </Typography.Text>}
                      <Typography.Text type="secondary">{hit.excerpt}</Typography.Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="Documentos indexados" extra={<BookOutlined />}>
        <Table<KnowledgeDocument>
          rowKey="slug"
          loading={isLoading}
          dataSource={data?.documents ?? []}
          pagination={false}
          size="small"
          expandable={{
            expandedRowRender: (row) => <Typography.Paragraph style={{ margin: 0 }}>{row.summary}</Typography.Paragraph>,
          }}
          columns={[
            {
              title: 'Tipo',
              dataIndex: 'kind',
              width: 120,
              render: (kind: string) => <KindTag kind={kind} />,
            },
            {
              title: 'Documento',
              dataIndex: 'title',
              render: (title: string) => <Typography.Text style={{ fontSize: 14 }}>{title}</Typography.Text>,
            },
            {
              title: 'Texto',
              dataIndex: 'extractable',
              width: 110,
              render: (ok: boolean, row) =>
                ok ? <Tag color="success">{row.chunks} trechos</Tag> : <Tag>escaneado</Tag>,
            },
            {
              title: 'PDF',
              width: 80,
              render: (_, row) => (
                <Button
                  type="link"
                  icon={<FilePdfOutlined />}
                  onClick={() => {
                    api.openKnowledgePdf(row.slug).catch((e: Error) => notification.error({ message: e.message }));
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
