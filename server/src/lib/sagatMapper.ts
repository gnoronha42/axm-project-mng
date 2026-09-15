import { validateRepartition, type AllocationInput } from './suframaRules.js';

export type SagatPayload = {
  empresa: { name: string; cnpj?: string | null };
  periodo: { year: number; month: number };
  faturamento: {
    bruto: number;
    ipi: number;
    icms: number;
    liquido: number;
    obrigacaoPdi: number;
  };
  investimentos: AllocationInput[];
  conciliacao: ReturnType<typeof validateRepartition>;
  declaracaoVeracidade: {
    ready: boolean;
    hashPreview: string;
  };
};

export function buildSagatPayload(input: {
  empresaName: string;
  cnpj?: string | null;
  year: number;
  month: number;
  grossRevenue: number;
  ipiDeduction: number;
  icmsDeduction: number;
  netRevenue: number;
  pdiObligation: number;
  allocations: AllocationInput[];
}): SagatPayload {
  const conciliacao = validateRepartition(input.pdiObligation, input.allocations);
  const canonical = JSON.stringify({
    cnpj: input.cnpj ?? '',
    year: input.year,
    month: input.month,
    net: input.netRevenue,
    obrigacao: input.pdiObligation,
    invested: conciliacao.invested,
  });
  const hashPreview = Buffer.from(canonical).toString('base64url').slice(0, 24);

  return {
    empresa: { name: input.empresaName, cnpj: input.cnpj },
    periodo: { year: input.year, month: input.month },
    faturamento: {
      bruto: input.grossRevenue,
      ipi: input.ipiDeduction,
      icms: input.icmsDeduction,
      liquido: input.netRevenue,
      obrigacaoPdi: input.pdiObligation,
    },
    investimentos: input.allocations,
    conciliacao,
    declaracaoVeracidade: {
      ready: conciliacao.compliant,
      hashPreview,
    },
  };
}
