import { Upload, Select, Button, Space, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { ProjectPhase, PHASE_LABELS, PHASE_ORDER } from '../../types';
import type { DocumentCategory } from '../../types';

const { Dragger } = Upload;

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'plano_trabalho', label: 'Plano de Trabalho' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'relatorio_tecnico', label: 'Relatório Técnico' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'outro', label: 'Outro' },
];

interface DocumentUploadProps {
  currentPhase?: ProjectPhase;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ currentPhase, onUploadComplete }: DocumentUploadProps) {
  const [category, setCategory] = useState<DocumentCategory>('outro');
  const [phase, setPhase] = useState<ProjectPhase>(currentPhase ?? ProjectPhase.RECEBIMENTO);

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          style={{ width: 200 }}
          placeholder="Categoria"
        />
        <Select
          value={phase}
          onChange={setPhase}
          options={PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABELS[p] }))}
          style={{ width: 220 }}
          placeholder="Fase"
        />
      </Space>

      <Dragger
        name="file"
        multiple
        action=""
        beforeUpload={() => false}
        onChange={(info) => {
          if (info.file.status === 'done') {
            message.success(`${info.file.name} enviado com sucesso`);
            onUploadComplete?.();
          }
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="ant-upload-hint">
          Suporta PDFs, documentos Office e imagens. Máximo 50MB por arquivo.
        </p>
      </Dragger>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <Button type="primary" onClick={() => {
          message.success('Documentos enviados com sucesso!');
          onUploadComplete?.();
        }}>
          Enviar Documentos
        </Button>
      </div>
    </div>
  );
}
