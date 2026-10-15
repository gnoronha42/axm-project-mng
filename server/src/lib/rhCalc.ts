/**
 * Cálculo de Recursos Humanos (RH) do RD Financeiro.
 *
 * Os custos de folha (salário, encargos, benefícios) são IMPORTADOS já
 * calculados — aqui apenas derivamos o valor hora/homem (H/H) e consolidamos
 * os lançamentos. Mantemos funções puras para facilitar testes e reuso.
 */

export type CostInput = {
  salarioTotal: number;
  encargosTotal: number;
  beneficiosTotal: number;
  horasAno: number;
  horasUteis: number;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Custo total do colaborador no ano-base (salário + encargos + benefícios). */
export function custoTotal(cost: CostInput): number {
  return roundMoney(cost.salarioTotal + cost.encargosTotal + cost.beneficiosTotal);
}

/**
 * Valor hora/homem (H/H). Usa horas úteis quando informadas; caso contrário,
 * cai para as horas/ano contratadas. Retorna 0 quando não há horas.
 */
export function valorHora(cost: CostInput): number {
  const horas = cost.horasUteis > 0 ? cost.horasUteis : cost.horasAno;
  if (horas <= 0) return 0;
  return roundMoney(custoTotal(cost) / horas);
}

/** Valor de um lançamento = horas lançadas × valor hora. */
export function valorAlocacao(horas: number, taxaHora: number): number {
  return roundMoney(Math.max(0, horas) * Math.max(0, taxaHora));
}

export type AllocationLite = {
  vinculo: string;
  activityId: string;
  activityName?: string;
  collaboratorId: string;
  horas: number;
  valorTotal: number;
};

export type ConsolidationRow = {
  key: string;
  label: string;
  horas: number;
  valor: number;
};

export type Consolidation = {
  total: number;
  totalHoras: number;
  porVinculo: ConsolidationRow[];
  porAtividade: ConsolidationRow[];
};

const VINCULO_LABELS: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
  intercambio: 'Intercâmbio',
};

function groupSum(
  allocations: AllocationLite[],
  keyFn: (a: AllocationLite) => string,
  labelFn: (a: AllocationLite) => string,
): ConsolidationRow[] {
  const map = new Map<string, ConsolidationRow>();
  for (const a of allocations) {
    const key = keyFn(a);
    const current = map.get(key) ?? { key, label: labelFn(a), horas: 0, valor: 0 };
    current.horas = roundMoney(current.horas + a.horas);
    current.valor = roundMoney(current.valor + a.valorTotal);
    map.set(key, current);
  }
  return [...map.values()];
}

/** Consolida os lançamentos por vínculo e por atividade (base do Resumo). */
export function consolidate(allocations: AllocationLite[]): Consolidation {
  const total = roundMoney(allocations.reduce((s, a) => s + a.valorTotal, 0));
  const totalHoras = roundMoney(allocations.reduce((s, a) => s + a.horas, 0));
  return {
    total,
    totalHoras,
    porVinculo: groupSum(
      allocations,
      (a) => a.vinculo,
      (a) => VINCULO_LABELS[a.vinculo] ?? a.vinculo,
    ),
    porAtividade: groupSum(
      allocations,
      (a) => a.activityId,
      (a) => a.activityName ?? a.activityId,
    ),
  };
}
