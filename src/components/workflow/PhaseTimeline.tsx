import { Steps, Typography } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PHASE_LABELS, PHASE_ORDER } from '../../types';
import type { PhaseInfo, PhaseStatus } from '../../types';

function statusIcon(status: PhaseStatus) {
  switch (status) {
    case 'completed': return <CheckCircleOutlined />;
    case 'in_progress': return <LoadingOutlined />;
    case 'blocked': return <StopOutlined />;
    default: return <ClockCircleOutlined />;
  }
}

function stepStatus(status: PhaseStatus): 'finish' | 'process' | 'wait' | 'error' {
  switch (status) {
    case 'completed': return 'finish';
    case 'in_progress': return 'process';
    case 'blocked': return 'error';
    default: return 'wait';
  }
}

interface PhaseTimelineProps {
  phases: PhaseInfo[];
  onPhaseClick?: (phase: PhaseInfo) => void;
}

export default function PhaseTimeline({ phases, onPhaseClick }: PhaseTimelineProps) {
  const phaseMap = new Map(phases.map((p) => [p.phase, p]));
  const currentIdx = PHASE_ORDER.findIndex((p) => phaseMap.get(p)?.status === 'in_progress');

  const items = PHASE_ORDER.map((phaseKey) => {
    const info = phaseMap.get(phaseKey) ?? { phase: phaseKey, status: 'pending' as PhaseStatus };

    return {
      title: (
        <span
          onClick={() => onPhaseClick?.(info)}
          style={{ cursor: onPhaseClick ? 'pointer' : 'default' }}
        >
          {PHASE_LABELS[phaseKey]}
        </span>
      ),
      description: info.completedAt ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(info.completedAt).toLocaleDateString('pt-BR')}
        </Typography.Text>
      ) : info.startedAt ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Iniciado em {new Date(info.startedAt).toLocaleDateString('pt-BR')}
        </Typography.Text>
      ) : null,
      status: stepStatus(info.status),
      icon: statusIcon(info.status),
    };
  });

  return (
    <Steps
      direction="vertical"
      size="small"
      current={currentIdx >= 0 ? currentIdx : 0}
      items={items}
    />
  );
}
