/**
 * Regras da Lei 8.387/1991 §3–§4 e Decreto 10.521/2020 arts. 5º–6º.
 * Fonte: corpus local em knowledge/suframa (não consulta o portal).
 */
export const SUFRAMA_RULES = {
  pdiAliquot: 0.05,
  paragraph4Aliquot: 0.023,
  minIctOfBase: 0.009,
  minFndctOfBase: 0.002,
  maxResearcherHourlyRate: 400,
  sources: {
    pdi: {
      slug: 'lei-8387-1991',
      cite: 'Lei 8.387/1991, art. 2º, §3º / Decreto 10.521/2020, art. 5º',
    },
    paragraph4: {
      slug: 'lei-8387-1991',
      cite: 'Lei 8.387/1991, art. 2º, §4º / Decreto 10.521/2020, art. 5º, §1º',
    },
    ict: {
      slug: 'lei-8387-1991',
      cite: 'Lei 8.387/1991, art. 2º, §4º, I (≥ 0,9% da base)',
    },
    fndct: {
      slug: 'lei-8387-1991',
      cite: 'Lei 8.387/1991, art. 2º, §4º, II (≥ 0,2% da base)',
    },
    capda: {
      slug: 'decreto-10521-2020',
      cite: 'Decreto 10.521/2020, art. 5º, §1º, IV (programas prioritários Capda)',
    },
  },
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

export type AllocationCategory = 'ict_amazonia' | 'capda_priority' | 'fndct' | 'other';

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
  return {
    netRevenue,
    pdiObligation,
    minIct: roundMoney(netRevenue * SUFRAMA_RULES.minIctOfBase),
    minFndct: roundMoney(netRevenue * SUFRAMA_RULES.minFndctOfBase),
    minParagraph4: roundMoney(netRevenue * SUFRAMA_RULES.paragraph4Aliquot),
  };
}

function sumBy(allocations: AllocationInput[], category: AllocationCategory) {
  return allocations.filter((a) => a.category === category).reduce((sum, a) => sum + a.amount, 0);
}

export function validateRepartition(
  obligation: number,
  allocations: AllocationInput[],
  netRevenue?: number,
) {
  const base = netRevenue ?? roundMoney(obligation / SUFRAMA_RULES.pdiAliquot);
  const ict = sumBy(allocations, 'ict_amazonia');
  const capda = sumBy(allocations, 'capda_priority');
  const fndct = sumBy(allocations, 'fndct');
  const other = sumBy(allocations, 'other');
  const invested = roundMoney(ict + capda + fndct + other);
  const paragraph4 = roundMoney(ict + capda + fndct);

  const minIct = roundMoney(base * SUFRAMA_RULES.minIctOfBase);
  const minFndct = roundMoney(base * SUFRAMA_RULES.minFndctOfBase);
  const minParagraph4 = roundMoney(base * SUFRAMA_RULES.paragraph4Aliquot);

  const alerts: { code: string; severity: 'warning' | 'error'; message: string; cite?: string }[] = [];

  if (invested + 0.005 < obligation) {
    alerts.push({
      code: 'OBLIGATION_GAP',
      severity: 'error',
      message: `Investimento (R$ ${invested.toFixed(2)}) abaixo da obrigação de 5% (R$ ${obligation.toFixed(2)}).`,
      cite: SUFRAMA_RULES.sources.pdi.cite,
    });
  }
  if (ict + 0.005 < minIct) {
    alerts.push({
      code: 'ICT_AMAZONIA_MIN',
      severity: 'error',
      message: `ICT credenciada Capda (Amazônia Ocidental/Amapá): mínimo de 0,9% da base (R$ ${minIct.toFixed(2)}). Atual: R$ ${ict.toFixed(2)}.`,
      cite: SUFRAMA_RULES.sources.ict.cite,
    });
  }
  if (fndct + 0.005 < minFndct) {
    alerts.push({
      code: 'FNDCT_MIN',
      severity: 'error',
      message: `FNDCT: mínimo de 0,2% da base (R$ ${minFndct.toFixed(2)}). Atual: R$ ${fndct.toFixed(2)}.`,
      cite: SUFRAMA_RULES.sources.fndct.cite,
    });
  }
  if (paragraph4 + 0.005 < minParagraph4) {
    alerts.push({
      code: 'PARAGRAPH4_MIN',
      severity: 'error',
      message: `Cesta §4º/art. 5º §1º (ICT + FNDCT + programas Capda): mínimo de 2,3% da base (R$ ${minParagraph4.toFixed(2)}). Atual: R$ ${paragraph4.toFixed(2)}.`,
      cite: SUFRAMA_RULES.sources.paragraph4.cite,
    });
  }

  return {
    obligation,
    invested,
    gap: roundMoney(obligation - invested),
    ict,
    capda,
    fndct,
    other,
    paragraph4,
    minIct,
    minFndct,
    minParagraph4,
    compliant: alerts.length === 0,
    alerts,
  };
}
