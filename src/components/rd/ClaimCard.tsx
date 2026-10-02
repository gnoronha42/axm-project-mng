import type { ReactNode } from 'react';
import { Tag, Typography } from 'antd';
import type { RdClaim } from '../../types';

const LEVEL_COLOR: Record<string, string> = {
  COMPROVADO: 'green',
  RELATADO: 'blue',
  PLANEJADO: 'gold',
  LACUNA: 'red',
};

export function ClaimCard({
  claim,
  extra,
}: {
  claim: RdClaim;
  extra?: ReactNode;
}) {
  return (
    <div className="axm-rd-claim">
      <div className="axm-rd-claim__head">
        <Tag color={LEVEL_COLOR[claim.level] ?? 'default'}>{claim.level}</Tag>
        {claim.approved && <Tag>Aprovada</Tag>}
        <div style={{ marginLeft: 'auto' }}>{extra}</div>
      </div>
      <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
        {claim.text}
      </Typography.Paragraph>
      {claim.level === 'LACUNA' && claim.question && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          ⚠ Pendente — {claim.question}
        </Typography.Paragraph>
      )}
      {claim.sources.map((s) => (
        <div key={s.id} className="axm-rd-source">
          <strong>{s.title}</strong>
          {s.url && (
            <>
              {' · '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.url}
              </a>
            </>
          )}
          {s.excerpt && <div>{s.excerpt.slice(0, 280)}</div>}
        </div>
      ))}
    </div>
  );
}
