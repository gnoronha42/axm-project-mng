/** Regras parametrizáveis da Lei de Informática / Suframa (PIM). */
export const SUFRAMA_RULES = {
  pdiAliquot: 0.05,
  minIctAmazoniaShare: 0.4,
  minCapdaPriorityShare: 0.2,
  maxResearcherHourlyRate: 400,
  eligibleExpenseKeywords: [
    'pesquisa',
    'desenvolvimento',
    'inovação',
    'inovacao',
    'pd&i',
    'pdi',
    'software',
    'prototipo',
    'protótipo',
    'laboratorio',
    'laboratório',
  ],
} as const;

export type AllocationCategory = 'ict_amazonia' | 'capda_priority' | 'other';

export type AllocationInput = {
  category: AllocationCategory;
  amount: number;
  description: string;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeObligation(input: {
  grossRevenue: number;
  ipiDeduction?: number;
  icmsDeduction?: number;
}) {
  const ipi = Math.max(0, input.ipiDeduction ?? 0);
  const icms = Math.max(0, input.icmsDeduction ?? 0);
  const gross = Math.max(0, input.grossRevenue);
  const netRevenue = roundMoney(Math.max(0, gross - ipi - icms));
  const pdiObligation = roundMoney(netRevenue * SUFRAMA_RULES.pdiAliquot);
  return { netRevenue, pdiObligation };
}

export function validateRepartition(obligation: number, allocations: AllocationInput[]) {
  const ict = allocations
    .filter((a) => a.category === 'ict_amazonia')
    .reduce((sum, a) => sum + a.amount, 0);
  const capda = allocations
    .filter((a) => a.category === 'capda_priority')
    .reduce((sum, a) => sum + a.amount, 0);
  const other = allocations
    .filter((a) => a.category === 'other')
    .reduce((sum, a) => sum + a.amount, 0);
  const invested = roundMoney(ict + capda + other);

  const minIct = roundMoney(obligation * SUFRAMA_RULES.minIctAmazoniaShare);
  const minCapda = roundMoney(obligation * SUFRAMA_RULES.minCapdaPriorityShare);

  const alerts: { code: string; severity: 'warning' | 'error'; message: string }[] = [];

  if (invested + 0.005 < obligation) {
    alerts.push({
      code: 'OBLIGATION_GAP',
      severity: 'error',
      message: `Investimento realizado (R$ ${invested.toFixed(2)}) abaixo da obrigação (R$ ${obligation.toFixed(2)}).`,
    });
  }
  if (ict + 0.005 < minIct) {
    alerts.push({
      code: 'ICT_AMAZONIA_MIN',
      severity: 'error',
      message: `ICT Amazônia Ocidental: mínimo de 40% da obrigação (R$ ${minIct.toFixed(2)}). Atual: R$ ${ict.toFixed(2)}.`,
    });
  }
  if (capda + 0.005 < minCapda) {
    alerts.push({
      code: 'CAPDA_MIN',
      severity: 'error',
      message: `Programas Prioritários CAPDA: mínimo de 20% da obrigação (R$ ${minCapda.toFixed(2)}). Atual: R$ ${capda.toFixed(2)}.`,
    });
  }

  return {
    obligation,
    invested,
    gap: roundMoney(obligation - invested),
    ict,
    capda,
    other,
    minIct,
    minCapda,
    compliant: alerts.length === 0,
    alerts,
  };
}
