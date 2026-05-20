import { Upload, Select, Button, App } from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { UploadFile } from 'antd';
import { ProjectPhase, PHASE_LABELS, PHASE_ORDER } from '../../types';
import type { DocumentCategory } from '../../types';
import { api } from '../../services/api';

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
  projectId: string;
  currentPhase?: ProjectPhase;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ projectId, currentPhase, onUploadComplete }: DocumentUploadProps) {
  const { notification } = App.useApp();
  const [category, setCategory] = useState<DocumentCategory>('outro');
  const [phase, setPhase] = useState<ProjectPhase>(currentPhase ?? ProjectPhase.RECEBIMENTO);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSend = async () => {
    if (fileList.length === 0) {
      notification.warning({
        message: 'Nenhum arquivo selecionado',
        description: 'Adicione ao menos um arquivo antes de enviar.',
        placement: 'topRight',
      });
      return;
    }

    setUploading(true);
    try {
      for (const item of fileList) {
        const file = item.originFileObj as File | undefined;
        if (!file) continue;
        await api.uploadDocument(projectId, file, { category, phase, uploadedBy: 'Você' });
      }

      notification.success({
        message: 'Documentos enviados com sucesso!',
        description: `${fileList.length} arquivo(s) adicionado(s) à fase "${PHASE_LABELS[phase]}".`,
        placement: 'topRight',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });

      setFileList([]);
      onUploadComplete?.();
    } catch {
      notification.error({
        message: 'Falha no envio',
        description: 'Não foi possível enviar os arquivos. Verifique se a API está rodando.',
        placement: 'topRight',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="axm-filter-row axm-upload-selects">
        <Select
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          placeholder="Categoria"
        />
        <Select
          value={phase}
          onChange={setPhase}
          options={PHASE_ORDER.map((p) => ({ value: p, label: PHASE_LABELS[p] }))}
          placeholder="Fase"
        />
      </div>

      <Dragger
        name="file"
        multiple
        fileList={fileList}
        disabled={uploading}
        beforeUpload={(file) => {
          setFileList((prev) => [...prev, file as unknown as UploadFile]);
          return false;
        }}
        onRemove={(file) => {
          setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
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

      <div style={{ marginTop: 12 }}>
        <Button type="primary" onClick={handleSend} loading={uploading} block>
          Enviar Documentos
        </Button>
      </div>
    </div>
  );
}
