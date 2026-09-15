/**
 * Ferramentas MCP do AXM.
 * A conciliação fiscal é determinística (não depende de LLM).
 * O preenchimento SAGAT opera apenas em sandbox — nunca dispara o portal real
 * sem SAGAT_LIVE=true (desligado por padrão).
 */
import { computeObligation, validateRepartition, type AllocationInput } from '../../server/src/lib/suframaRules.js';
import { buildSagatPayload } from '../../server/src/lib/sagatMapper.js';

export const MCP_TOOLS = [
  {
    name: 'mcp_validate_suframa_rules',
    description:
      'Concilia faturamento líquido, obrigação de 5% PD&I e percentuais mínimos de ICT Amazônia (40%) e CAPDA (20%).',
    inputSchema: {
      type: 'object',
      required: ['grossRevenue'],
      properties: {
        grossRevenue: { type: 'number' },
        ipiDeduction: { type: 'number' },
        icmsDeduction: { type: 'number' },
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['ict_amazonia', 'capda_priority', 'other'] },
              amount: { type: 'number' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    name: 'mcp_sagat_fill_sandbox',
    description:
      'Gera o payload do Relatório Demonstrativo e simula o preenchimento do SAGAT em sandbox (não acessa o portal real).',
    inputSchema: {
      type: 'object',
      required: ['empresaName', 'year', 'month', 'grossRevenue'],
      properties: {
        empresaName: { type: 'string' },
        cnpj: { type: 'string' },
        year: { type: 'number' },
        month: { type: 'number' },
        grossRevenue: { type: 'number' },
        ipiDeduction: { type: 'number' },
        icmsDeduction: { type: 'number' },
        allocations: { type: 'array' },
      },
    },
  },
];

export async function callTool(name: string, args: Record<string, unknown>) {
  if (name === 'mcp_validate_suframa_rules') {
    const computed = computeObligation({
      grossRevenue: Number(args.grossRevenue),
      ipiDeduction: Number(args.ipiDeduction ?? 0),
      icmsDeduction: Number(args.icmsDeduction ?? 0),
    });
    const allocations = (Array.isArray(args.allocations) ? args.allocations : []) as AllocationInput[];
    return { ...computed, ...validateRepartition(computed.pdiObligation, allocations) };
  }

  if (name === 'mcp_sagat_fill_sandbox') {
    if (process.env.SAGAT_LIVE === 'true') {
      throw new Error('SAGAT_LIVE bloqueado neste ambiente. Use sandbox.');
    }
    const computed = computeObligation({
      grossRevenue: Number(args.grossRevenue),
      ipiDeduction: Number(args.ipiDeduction ?? 0),
      icmsDeduction: Number(args.icmsDeduction ?? 0),
    });
    const allocations = (Array.isArray(args.allocations) ? args.allocations : []) as AllocationInput[];
    const payload = buildSagatPayload({
      empresaName: String(args.empresaName),
      cnpj: args.cnpj ? String(args.cnpj) : null,
      year: Number(args.year),
      month: Number(args.month),
      grossRevenue: Number(args.grossRevenue),
      ipiDeduction: Number(args.ipiDeduction ?? 0),
      icmsDeduction: Number(args.icmsDeduction ?? 0),
      netRevenue: computed.netRevenue,
      pdiObligation: computed.pdiObligation,
      allocations,
    });
    return {
      mode: 'sandbox',
      filled: payload.conciliacao.compliant,
      steps: [
        'Abrir formulário RD (sandbox local)',
        'Preencher faturamento bruto/líquido e deduções IPI/ICMS',
        'Preencher obrigação 5% e alocações ICT/CAPDA',
        payload.conciliacao.compliant
          ? 'Gerar hash preliminar da Declaração de Veracidade'
          : 'Bloquear envio: conciliação fiscal reprovada',
      ],
      payload,
    };
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
}
