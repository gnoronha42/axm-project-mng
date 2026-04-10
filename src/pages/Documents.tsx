import { Card, Typography, Select, Space, Skeleton } from 'antd';
import { useState } from 'react';
import { useAllDocuments } from '../hooks/useDocuments';
import { PHASE_LABELS, PHASE_ORDER } from '../types';
import type { DocumentCategory, ProjectPhase } from '../types';
import DocumentList from '../components/documents/DocumentList';

const CATEGORY_OPTIONS: { value: DocumentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'plano_trabalho', label: 'Plano de Trabalho' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'relatorio_tecnico', label: 'Relatório Técnico' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'outro', label: 'Outro' },
];

export default function Documents() {
  const { data: documents = [], isLoading } = useAllDocuments();
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [phase, setPhase] = useState<ProjectPhase | 'all'>('all');

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  const filtered = documents.filter((d) => {
    if (category !== 'all' && d.category !== category) return false;
    if (phase !== 'all' && d.phase !== phase) return false;
    return true;
  });

  return (
    <div>
      <Typography.Title level={3}>Documentos</Typography.Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            style={{ width: 220 }}
          />
          <Select
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'all', label: 'Todas as fases' },
              ...PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABELS[p] })),
            ]}
            style={{ width: 260 }}
          />
        </Space>

        <DocumentList documents={filtered} />
      </Card>
    </div>
  );
}
