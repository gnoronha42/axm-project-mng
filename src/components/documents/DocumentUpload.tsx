import { Upload, Select, Button, App, Progress } from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { UploadFile } from 'antd';
import { ProjectPhase, PHASE_LABELS, PHASE_ORDER } from '../../types';
import type { DocumentCategory } from '../../types';
import { ApiError, uploadDocument } from '../../services/apiClient';
import { useAuth } from '../../auth/AuthContext';

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
  const { user } = useAuth();
  const [category, setCategory] = useState<DocumentCategory>('outro');
  const [phase, setPhase] = useState<ProjectPhase>(currentPhase ?? ProjectPhase.RECEBIMENTO);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (currentPhase) setPhase(currentPhase);
  }, [currentPhase]);

  const handleSend = async () => {
    if (!projectId) {
      notification.warning({
        message: 'Selecione um projeto',
        description: 'É necessário escolher o projeto antes de enviar.',
        placement: 'topRight',
      });
      return;
    }

    if (fileList.length === 0) {
      notification.warning({
        message: 'Nenhum arquivo selecionado',
        description: 'Adicione ao menos um arquivo antes de enviar.',
        placement: 'topRight',
      });
      return;
    }

    setUploading(true);
    setProgress({});

    let uploaded = 0;
    let failed = 0;
    let lastError = '';

    for (const item of fileList) {
      const file = (item.originFileObj as File | undefined) ?? null;
      if (!file) {
        failed += 1;
        setProgress((prev) => ({ ...prev, [item.uid]: -1 }));
        lastError = 'Arquivo inválido na fila';
        continue;
      }

      try {
        await uploadDocument(
          projectId,
          file,
          { category, phase, uploadedBy: user?.name ?? 'Você' },
          (pct) => setProgress((prev) => ({ ...prev, [item.uid]: pct })),
        );
        setProgress((prev) => ({ ...prev, [item.uid]: 100 }));
        uploaded += 1;
      } catch (err) {
        failed += 1;
        setProgress((prev) => ({ ...prev, [item.uid]: -1 }));
        lastError = err instanceof ApiError ? err.message : 'Falha no upload';
      }
    }

    if (failed === 0 && uploaded > 0) {
      notification.success({
        message: 'Documentos enviados com sucesso!',
        description: `${uploaded} arquivo(s) adicionado(s) à fase "${PHASE_LABELS[phase]}".`,
        placement: 'topRight',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
      setFileList([]);
      setProgress({});
      onUploadComplete?.();
    } else if (uploaded > 0) {
      notification.warning({
        message: 'Envio parcial',
        description: `${uploaded} ok, ${failed} falhou(aram). ${lastError}`,
        placement: 'topRight',
      });
      onUploadComplete?.();
    } else {
      notification.error({
        message: 'Falha no envio',
        description: lastError || 'Não foi possível enviar os arquivos.',
        placement: 'topRight',
      });
    }

    setUploading(false);
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
        disabled={uploading || !projectId}
        beforeUpload={(file) => {
          const entry: UploadFile = {
            uid: file.uid,
            name: file.name,
            status: 'done',
            size: file.size,
            type: file.type,
            originFileObj: file,
          };
          setFileList((prev) => [...prev, entry]);
          return false;
        }}
        onRemove={(file) => {
          setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
          setProgress((prev) => {
            const next = { ...prev };
            delete next[file.uid];
            return next;
          });
        }}
        showUploadList={{ showPreviewIcon: false }}
        itemRender={(originNode, file) => {
          const pct = progress[file.uid];
          const failed = pct === -1;
          return (
            <div style={{ marginTop: 4 }}>
              {originNode}
              {pct !== undefined && (
                <Progress
                  percent={failed ? 100 : pct}
                  size="small"
                  status={failed ? 'exception' : pct === 100 ? 'success' : 'active'}
                  style={{ marginTop: 2, marginLeft: 28, marginRight: 32 }}
                />
              )}
            </div>
          );
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
        <Button type="primary" onClick={handleSend} loading={uploading} block disabled={!projectId}>
          {uploading ? 'Enviando...' : 'Enviar Documentos'}
        </Button>
      </div>
    </div>
  );
}
