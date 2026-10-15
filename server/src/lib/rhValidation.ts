/**
 * Validação anti-glosa / anti-fraude dos lançamentos de RH.
 *
 * Princípios (alinhados ao RD técnico e ao glosaEngine):
 *  - Só se afirma o que tem evidência (comprovante conferido).
 *  - Não se aceita pessoa não planejada, sem função/justificativa coerente,
 *    nem com valor/horas desproporcional ao previsto ou ao teto regulamentar.
 */
import { SUFRAMA_RULES } from './suframaRules.js';
import { roundMoney } from './rhCalc.js';

export const RH_LIMITS = {
  maxHourlyRate: SUFRAMA_RULES.maxResearcherHourlyRate, // R$/h (teto regulamentar)
  maxHoursMonth: 220, // horas/mês típicas
  minJustification: 30, // caracteres mínimos de justificativa
  reconTolerance: 0.01, // tolerância de conciliação (R$)
} as const;

export type RhFinding = {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
};

export type RhNivel = 'COMPROVADO' | 'RELATADO' | 'LACUNA';

export type RhValidationContext = {
  allocation: {
    year: number;
    month: number;
    horas: number;
    valorHora: number;
    valorTotal: number;
    justificativa: string;
  };
  collaborator: {
    name: string;
    planned: boolean;
    cargoProjeto?: string | null;
    admissao?: Date | string | null;
    rescisao?: Date | string | null;
  };
  /** Planejamento previsto para (atividade, colaborador), quando existir. */
  planned?: { funcao: string; horasPrevistas: number; valorPrevisto: number } | null;
  /** Acumulado JÁ lançado no ano para (atividade, colaborador), sem contar este. */
  acumuladoHoras?: number;
  acumuladoValor?: number;
  evidences?: { conferido: boolean; valorComprovado?: number | null }[];
};

export type RhValidationResult = {
  nivel: RhNivel;
  blocking: boolean;
  findings: RhFinding[];
};

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthBounds(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0)),
  };
}

function hasConferido(ctx: RhValidationContext): boolean {
  return (ctx.evidences ?? []).some((e) => e.conferido);
}

function checkPlanning(ctx: RhValidationContext, findings: RhFinding[]) {
  const isPlanned = ctx.collaborator.planned || !!ctx.planned;
  if (!isPlanned) {
    findings.push({
      code: 'RH_NOT_PLANNED',
      severity: 'error',
      message: `${ctx.collaborator.name}: colaborador não consta no Plano de Trabalho — lançamento não permitido sem planejamento.`,
    });
  }

  const funcao = (ctx.planned?.funcao || ctx.collaborator.cargoProjeto || '').trim();
  if (!funcao) {
    findings.push({
      code: 'RH_MISSING_ROLE',
      severity: 'error',
      message: `${ctx.collaborator.name}: função/papel no projeto não definida — exigida coerência de função.`,
    });
  }
}

function checkJustification(ctx: RhValidationContext, findings: RhFinding[]) {
  if (ctx.allocation.justificativa.trim().length < RH_LIMITS.minJustification) {
    findings.push({
      code: 'RH_MISSING_JUSTIFICATION',
      severity: 'error',
      message: `${ctx.collaborator.name}: justificativa ausente ou muito curta (mín. ${RH_LIMITS.minJustification} caracteres).`,
    });
  }
}

function checkCaps(ctx: RhValidationContext, findings: RhFinding[]) {
  const { valorHora, horas, valorTotal } = ctx.allocation;

  if (valorHora > RH_LIMITS.maxHourlyRate) {
    findings.push({
      code: 'RH_HOURLY_RATE_CAP',
      severity: 'error',
      message: `${ctx.collaborator.name}: valor hora R$ ${valorHora.toFixed(2)} acima do teto de R$ ${RH_LIMITS.maxHourlyRate}/h.`,
      details: { valorHora },
    });
  }

  if (horas > RH_LIMITS.maxHoursMonth) {
    findings.push({
      code: 'RH_HOURS_OVER_MONTH',
      severity: 'warning',
      message: `${ctx.collaborator.name}: ${horas}h no mês — acima do teto típico de ${RH_LIMITS.maxHoursMonth}h. Conferir timesheet.`,
      details: { horas },
    });
  }

  const esperado = roundMoney(horas * valorHora);
  if (Math.abs(esperado - valorTotal) > RH_LIMITS.reconTolerance) {
    findings.push({
      code: 'RH_VALUE_MISMATCH',
      severity: 'warning',
      message: `${ctx.collaborator.name}: valor lançado (R$ ${valorTotal.toFixed(2)}) difere de horas × hora (R$ ${esperado.toFixed(2)}).`,
      details: { esperado, valorTotal },
    });
  }
}

function checkContractWindow(ctx: RhValidationContext, findings: RhFinding[]) {
  const { year, month } = ctx.allocation;
  const { start, end } = monthBounds(year, month);
  const admissao = toDate(ctx.collaborator.admissao);
  const rescisao = toDate(ctx.collaborator.rescisao);

  if (admissao && admissao > end) {
    findings.push({
      code: 'RH_OUTSIDE_CONTRACT',
      severity: 'error',
      message: `${ctx.collaborator.name}: lançamento ${String(month).padStart(2, '0')}/${year} anterior à admissão (${admissao.toISOString().slice(0, 10)}).`,
    });
  }
  if (rescisao && rescisao < start) {
    findings.push({
      code: 'RH_OUTSIDE_CONTRACT',
      severity: 'error',
      message: `${ctx.collaborator.name}: lançamento ${String(month).padStart(2, '0')}/${year} posterior à rescisão (${rescisao.toISOString().slice(0, 10)}).`,
    });
  }
}

function checkPlannedLimits(ctx: RhValidationContext, findings: RhFinding[]) {
  if (!ctx.planned) return;
  const horasTotal = roundMoney((ctx.acumuladoHoras ?? 0) + ctx.allocation.horas);
  const valorAcum = roundMoney((ctx.acumuladoValor ?? 0) + ctx.allocation.valorTotal);

  if (ctx.planned.horasPrevistas > 0 && horasTotal > ctx.planned.horasPrevistas + 0.01) {
    findings.push({
      code: 'RH_HOURS_OVER_PLANNED',
      severity: 'error',
      message: `${ctx.collaborator.name}: horas acumuladas (${horasTotal}h) acima do previsto (${ctx.planned.horasPrevistas}h) na atividade.`,
      details: { horasTotal, horasPrevistas: ctx.planned.horasPrevistas },
    });
  }
  if (ctx.planned.valorPrevisto > 0 && valorAcum > ctx.planned.valorPrevisto + 0.01) {
    findings.push({
      code: 'RH_VALUE_OVER_PLANNED',
      severity: 'warning',
      message: `${ctx.collaborator.name}: valor acumulado (R$ ${valorAcum.toFixed(2)}) acima do previsto (R$ ${ctx.planned.valorPrevisto.toFixed(2)}).`,
      details: { valorAcum, valorPrevisto: ctx.planned.valorPrevisto },
    });
  }
}

function checkEvidence(ctx: RhValidationContext, findings: RhFinding[]): RhNivel {
  const evidences = ctx.evidences ?? [];
  const conferido = evidences.filter((e) => e.conferido);

  if (conferido.length === 0) {
    findings.push({
      code: 'RH_NO_EVIDENCE',
      severity: 'warning',
      message: `${ctx.collaborator.name}: sem comprovante conferido — não é possível afirmar (apenas relatado).`,
    });
    return ctx.allocation.justificativa.trim().length >= RH_LIMITS.minJustification ? 'RELATADO' : 'LACUNA';
  }

  const divergente = conferido.some(
    (e) =>
      typeof e.valorComprovado === 'number' &&
      Math.abs(e.valorComprovado - ctx.allocation.valorTotal) > RH_LIMITS.reconTolerance,
  );
  if (divergente) {
    findings.push({
      code: 'RH_RECON_DIVERGENT',
      severity: 'error',
      message: `${ctx.collaborator.name}: valor do comprovante diverge do valor lançado (R$ ${ctx.allocation.valorTotal.toFixed(2)}).`,
    });
    return 'RELATADO';
  }
  return 'COMPROVADO';
}

/** Valida um lançamento de RH e retorna nível de evidência + apontamentos. */
export function validateRhAllocation(ctx: RhValidationContext): RhValidationResult {
  const findings: RhFinding[] = [];
  checkPlanning(ctx, findings);
  checkJustification(ctx, findings);
  checkCaps(ctx, findings);
  checkContractWindow(ctx, findings);
  checkPlannedLimits(ctx, findings);
  const nivel = checkEvidence(ctx, findings);

  return {
    nivel,
    blocking: findings.some((f) => f.severity === 'error'),
    findings,
  };
}
