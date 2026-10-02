import { ArrowLeftOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Card, Input, Result, Select, Skeleton, Space, Steps, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClaimCard } from '../components/rd/ClaimCard';
import { useGenerateRdStep, usePatchRdClaim, useRdReport } from '../hooks/useRd';
import { api } from '../services/api';
import { ApiError } from '../services/apiClient';
import type { RdResearchHit } from '../types';

const STEPS = [
  { key: 'contexto', title: 'Contexto' },
  { key: 'trajetoria', title: 'Trajetória' },
  { key: 'atividades', title: 'Atividades' },
  { key: 'evidencias', title: 'Evidências' },
  { key: 'lacunas', title: 'Lacunas' },
  { key: 'revisao', title: 'Revisão' },
];

export default function RdWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const { data, isLoading } = useRdReport(id);
  const generate = useGenerateRdStep(id ?? '');
  const patch = usePatchRdClaim(id ?? '');
  const [stepIdx, setStepIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [research, setResearch] = useState<{ webEnabled: boolean; hits: RdResearchHit[] } | null>(null);
  const [searching, setSearching] = useState(false);

  const section = useMemo(
    () => data?.sections.find((s) => s.step === STEPS[stepIdx].key) ?? data?.sections[stepIdx],
    [data, stepIdx],
  );
  const locked = data?.status === 'final';

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!data || !id) return <Result status="404" title="RD não encontrado" />;

  const runGenerate = async () => {
    try {
      await generate.mutateAsync({
        step: STEPS[stepIdx].key,
        notes: notes || undefined,
        researchQuery: query || undefined,
      });
      notification.success({ message: 'Passo gerado' });
    } catch (err) {
      notification.error({
        message: 'Falha ao gerar',
        description: err instanceof ApiError ? err.message : 'Verifique a chave do LLM',
      });
    }
  };

  const runSearch = async () => {
    setSearching(true);
    try {
      const res = await api.researchRd(id, query || undefined);
      setResearch(res);
    } catch (err) {
      notification.error({
        message: 'Pesquisa falhou',
        description: err instanceof ApiError ? err.message : undefined,
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rd')}>
          Voltar
        </Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {data.title}
        </Typography.Title>
        <Tag>{data.enquadramento === 'lei_informatica' ? 'Lei de Informática' : 'Suframa'}</Tag>
        <Tag>v{data.version}</Tag>
        <Tag color={locked ? 'green' : 'default'}>{data.status}</Tag>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={stepIdx}
          onChange={setStepIdx}
          size="small"
          items={STEPS.map((s) => ({ title: s.title }))}
        />
      </Card>

      <Card
        title={section?.title ?? STEPS[stepIdx].title}
        extra={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => api.downloadRdDocx(id, data.title)}
            >
              DOCX
            </Button>
            {!locked && (
              <Button
                onClick={async () => {
                  const next = await api.finalizeRd(id);
                  notification.success({ message: 'RD finalizado' });
                  if (next) navigate(`/rd/${next.id}`);
                }}
              >
                Finalizar
              </Button>
            )}
            {locked && (
              <Button
                onClick={async () => {
                  const next = await api.newRdVersion(id);
                  navigate(`/rd/${next.id}`);
                }}
              >
                Nova versão
              </Button>
            )}
          </Space>
        }
      >
        {section?.summary && (
          <Typography.Paragraph type="secondary">{section.summary}</Typography.Paragraph>
        )}

        {!locked && (
          <div className="axm-rd-toolbar">
            <Input.TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas do analista para este passo (opcional)"
            />
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar na Biblioteca Suframa e na web"
                onPressEnter={() => void runSearch()}
              />
              <Button icon={<SearchOutlined />} loading={searching} onClick={() => void runSearch()}>
                Pesquisar
              </Button>
            </Space.Compact>
            <Button type="primary" loading={generate.isPending} onClick={() => void runGenerate()}>
              Gerar este passo com IA
            </Button>
            {research && (
              <Typography.Text type="secondary">
                {research.hits.length} fontes · web {research.webEnabled ? 'ativa' : 'indisponível (só biblioteca)'}
              </Typography.Text>
            )}
          </div>
        )}

        {research?.hits.map((h) => (
          <div key={h.sourceId} className="axm-rd-source">
            <Tag>{h.sourceType}</Tag>
            <strong>{h.title}</strong>
            <div>{h.excerpt.slice(0, 220)}</div>
          </div>
        ))}

        {(section?.claims ?? []).map((claim) => (
          <ClaimCard
            key={claim.id}
            claim={claim}
            extra={
              !locked && (
                <Space size={4}>
                  <Select
                    size="small"
                    value={claim.level}
                    style={{ width: 140 }}
                    onChange={(level) => patch.mutate({ claimId: claim.id, level })}
                    options={['COMPROVADO', 'RELATADO', 'PLANEJADO', 'LACUNA'].map((v) => ({ value: v, label: v }))}
                  />
                  <Button
                    size="small"
                    type={claim.approved ? 'primary' : 'default'}
                    onClick={() => patch.mutate({ claimId: claim.id, approved: !claim.approved })}
                  >
                    {claim.approved ? 'Aprovada' : 'Aprovar'}
                  </Button>
                </Space>
              )
            }
          />
        ))}

        {!section?.claims.length && (
          <Typography.Paragraph type="secondary">
            Ainda sem afirmações. Gere o passo para o auditor-IA redigir com base nas evidências do projeto.
          </Typography.Paragraph>
        )}
      </Card>
    </div>
  );
}
