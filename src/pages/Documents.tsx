import { Card, Typography, Select, Skeleton } from 'antd';
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
      <Typography.Title level={3} className="axm-page-title">
        Documentos
      </Typography.Title>

      <Card>
        <div className="axm-filter-row">
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
          />
          <Select
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'all', label: 'Todas as fases' },
              ...PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABELS[p] })),
            ]}
          />
        </div>

        <DocumentList documents={filtered} />
      </Card>
    </div>
  );
}
