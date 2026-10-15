/**
 * Geração do workbook XLSX do RD Financeiro (layout GENÉRICO de P&D).
 * Projeta os dados estruturados em abas; não replica o layout de nenhum
 * projeto específico (ex.: SISCAPE é apenas um exemplo).
 */
import ExcelJS from 'exceljs';
import { prisma } from './prisma.js';
import { custoTotal, valorHora, consolidate } from './rhCalc.js';

const MONEY = 'R$ #,##0.00';
const VINCULO_LABEL: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
  intercambio: 'Intercâmbio',
};

function headerRow(ws: ExcelJS.Worksheet, labels: string[]) {
  const row = ws.addRow(labels);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2A4A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function sheetColaboradores(wb: ExcelJS.Workbook, collaborators: CollaboratorData[], year: number) {
  const ws = wb.addWorksheet('Colaboradores');
  headerRow(ws, ['Nome', 'CPF', 'Função no Projeto', 'Vínculo', 'Dir/Ind', 'Admissão', 'Rescisão', 'Planejado?']);
  for (const c of collaborators) {
    ws.addRow([
      c.name,
      c.cpf,
      c.cargoProjeto ?? '',
      VINCULO_LABEL[c.vinculo] ?? c.vinculo,
      c.dirInd,
      c.admissao ? c.admissao.toISOString().slice(0, 10) : '',
      c.rescisao ? c.rescisao.toISOString().slice(0, 10) : '',
      c.planned ? 'Sim' : 'NÃO',
    ]);
  }
  ws.columns.forEach((col) => (col.width = 20));
}

function sheetFolha(wb: ExcelJS.Workbook, collaborators: CollaboratorData[], year: number) {
  const ws = wb.addWorksheet('Folha (H-H)');
  headerRow(ws, [
    'Colaborador',
    'Salário (ano)',
    'Encargos',
    'Benefícios',
    'Custo Total',
    'Horas Úteis',
    'Valor H/H',
  ]);
  for (const c of collaborators) {
    const cost = c.costs.find((x) => x.year === year);
    if (!cost) {
      ws.addRow([c.name, 0, 0, 0, 0, 0, 0]);
      continue;
    }
    const row = ws.addRow([
      c.name,
      cost.salarioTotal,
      cost.encargosTotal,
      cost.beneficiosTotal,
      custoTotal(cost),
      cost.horasUteis > 0 ? cost.horasUteis : cost.horasAno,
      valorHora(cost),
    ]);
    [2, 3, 4, 5, 7].forEach((i) => (row.getCell(i).numFmt = MONEY));
  }
  ws.columns.forEach((col) => (col.width = 18));
}

function sheetAlocacoes(wb: ExcelJS.Workbook, allocations: AllocationData[]) {
  const ws = wb.addWorksheet('Alocação RH');
  headerRow(ws, ['Mês', 'Colaborador', 'Atividade', 'Horas', 'Valor H/H', 'Valor Total', 'Status', 'Justificativa']);
  for (const a of allocations) {
    const row = ws.addRow([
      a.month,
      a.collaborator.name,
      a.activity.name,
      a.horas,
      a.valorHora,
      a.valorTotal,
      a.reconStatus === 'matched' ? 'Conferido' : a.reconStatus === 'divergent' ? 'Divergente' : 'Pendente',
      a.justificativa,
    ]);
    [5, 6].forEach((i) => (row.getCell(i).numFmt = MONEY));
    row.getCell(8).alignment = { wrapText: true };
  }
  ws.getColumn(8).width = 60;
  [1, 2, 3, 4, 5, 6, 7].forEach((i) => (ws.getColumn(i).width = 16));
}

function sheetResumo(wb: ExcelJS.Workbook, allocations: AllocationData[], year: number) {
  const ws = wb.addWorksheet('Resumo');
  ws.addRow([`RD Financeiro — RH — Ano-base ${year}`]).font = { bold: true, size: 14 };
  ws.addRow([]);

  const cons = consolidate(
    allocations.map((a) => ({
      vinculo: a.activity.vinculo,
      activityId: a.activityId,
      activityName: a.activity.name,
      collaboratorId: a.collaboratorId,
      horas: a.horas,
      valorTotal: a.valorTotal,
    })),
  );

  headerRow(ws, ['Por Vínculo', 'Horas', 'Valor']);
  for (const r of cons.porVinculo) {
    const row = ws.addRow([r.label, r.horas, r.valor]);
    row.getCell(3).numFmt = MONEY;
  }
  ws.addRow([]);
  headerRow(ws, ['Por Atividade', 'Horas', 'Valor']);
  for (const r of cons.porAtividade) {
    const row = ws.addRow([r.label, r.horas, r.valor]);
    row.getCell(3).numFmt = MONEY;
  }
  ws.addRow([]);
  const total = ws.addRow(['TOTAL GERAL', cons.totalHoras, cons.total]);
  total.font = { bold: true };
  total.getCell(3).numFmt = MONEY;
  ws.columns.forEach((col) => (col.width = 28));
}

type CollaboratorData = Awaited<ReturnType<typeof loadCollaborators>>[number];
type AllocationData = Awaited<ReturnType<typeof loadAllocations>>[number];

function loadCollaborators(projectId: string) {
  return prisma.collaborator.findMany({
    where: { projectId },
    include: { costs: true },
    orderBy: { name: 'asc' },
  });
}

function loadAllocations(projectId: string, year: number) {
  return prisma.rhAllocation.findMany({
    where: { projectId, year },
    include: { collaborator: true, activity: true },
    orderBy: [{ month: 'asc' }, { collaborator: { name: 'asc' } }],
  });
}

/** Monta o workbook completo e retorna o buffer XLSX. */
export async function buildFinanceWorkbook(projectId: string, year: number): Promise<Buffer> {
  const [collaborators, allocations] = await Promise.all([
    loadCollaborators(projectId),
    loadAllocations(projectId, year),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AXM Project Manager';
  wb.created = new Date();

  sheetResumo(wb, allocations, year);
  sheetColaboradores(wb, collaborators, year);
  sheetFolha(wb, collaborators, year);
  sheetAlocacoes(wb, allocations);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
