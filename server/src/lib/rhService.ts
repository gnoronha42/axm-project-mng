/**
 * Serviço de apoio ao RD Financeiro (RH): cálculo do valor hora,
 * montagem do contexto de validação e serialização dos lançamentos.
 * Mantém as rotas enxutas e concentra a lógica de leitura/derivação.
 */
import { prisma } from './prisma.js';
import { valorHora as calcValorHora, valorAlocacao, type CostInput } from './rhCalc.js';
import { validateRhAllocation, type RhValidationResult } from './rhValidation.js';

/** Valor hora/homem (H/H) de um colaborador no ano-base (0 se sem custo). */
export async function getValorHora(collaboratorId: string, year: number): Promise<number> {
  const cost = await prisma.collaboratorCost.findUnique({
    where: { collaboratorId_year: { collaboratorId, year } },
  });
  if (!cost) return 0;
  const input: CostInput = {
    salarioTotal: cost.salarioTotal,
    encargosTotal: cost.encargosTotal,
    beneficiosTotal: cost.beneficiosTotal,
    horasAno: cost.horasAno,
    horasUteis: cost.horasUteis,
  };
  return calcValorHora(input);
}

type AllocationRow = Awaited<ReturnType<typeof loadAllocationRaw>>;

export function loadAllocationRaw(id: string) {
  return prisma.rhAllocation.findUnique({
    where: { id },
    include: {
      collaborator: true,
      activity: { include: { plannedRoles: true } },
      evidences: true,
    },
  });
}

/** Acumulado de horas/valor para (atividade, colaborador, ano) exceto o próprio. */
async function acumulado(allocation: { activityId: string; collaboratorId: string; year: number; id: string }) {
  const rows = await prisma.rhAllocation.findMany({
    where: {
      activityId: allocation.activityId,
      collaboratorId: allocation.collaboratorId,
      year: allocation.year,
      id: { not: allocation.id },
    },
    select: { horas: true, valorTotal: true },
  });
  return {
    horas: rows.reduce((s, r) => s + r.horas, 0),
    valor: rows.reduce((s, r) => s + r.valorTotal, 0),
  };
}

/** Executa a validação anti-glosa de um lançamento já persistido. */
export async function validateAllocation(row: NonNullable<AllocationRow>): Promise<RhValidationResult> {
  const planned = row.activity.plannedRoles.find((p) => p.collaboratorId === row.collaboratorId) ?? null;
  const acc = await acumulado(row);
  return validateRhAllocation({
    allocation: {
      year: row.year,
      month: row.month,
      horas: row.horas,
      valorHora: row.valorHora,
      valorTotal: row.valorTotal,
      justificativa: row.justificativa,
    },
    collaborator: {
      name: row.collaborator.name,
      planned: row.collaborator.planned,
      cargoProjeto: row.collaborator.cargoProjeto,
      admissao: row.collaborator.admissao,
      rescisao: row.collaborator.rescisao,
    },
    planned: planned
      ? { funcao: planned.funcao, horasPrevistas: planned.horasPrevistas, valorPrevisto: planned.valorPrevisto }
      : null,
    acumuladoHoras: acc.horas,
    acumuladoValor: acc.valor,
    evidences: row.evidences.map((e) => ({ conferido: e.conferido, valorComprovado: e.valorComprovado })),
  });
}

/** Serializa um lançamento com validação embutida (para o front). */
export function mapAllocation(row: NonNullable<AllocationRow>, validation: RhValidationResult) {
  return {
    id: row.id,
    projectId: row.projectId,
    activityId: row.activityId,
    activityName: row.activity.name,
    collaboratorId: row.collaboratorId,
    collaboratorName: row.collaborator.name,
    year: row.year,
    month: row.month,
    horas: row.horas,
    valorHora: row.valorHora,
    valorTotal: row.valorTotal,
    justificativa: row.justificativa,
    claimId: row.claimId,
    reconStatus: row.reconStatus,
    evidences: row.evidences.map((e) => ({
      id: e.id,
      documentId: e.documentId,
      kind: e.kind,
      valorComprovado: e.valorComprovado,
      conferido: e.conferido,
      observacao: e.observacao,
    })),
    validation,
  };
}

/** Recalcula valorHora/valorTotal e persiste; retorna o lançamento mapeado. */
export async function recomputeAndReconcile(id: string) {
  const row = await loadAllocationRaw(id);
  if (!row) return null;
  const vHora = await getValorHora(row.collaboratorId, row.year);
  const vTotal = valorAlocacao(row.horas, vHora);
  const conferido = row.evidences.some((e) => e.conferido);
  const divergente = row.evidences.some(
    (e) => e.conferido && typeof e.valorComprovado === 'number' && Math.abs(e.valorComprovado - vTotal) > 0.01,
  );
  const reconStatus = !conferido ? 'pending' : divergente ? 'divergent' : 'matched';

  const updated = await prisma.rhAllocation.update({
    where: { id },
    data: { valorHora: vHora, valorTotal: vTotal, reconStatus },
    include: { collaborator: true, activity: { include: { plannedRoles: true } }, evidences: true },
  });
  const validation = await validateAllocation(updated);
  return mapAllocation(updated, validation);
}
