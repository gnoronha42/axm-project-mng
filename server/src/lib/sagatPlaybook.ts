/** Passos do treinamento SAGAT LG (04/03/2026). Sandbox only. */
export const SAGAT_PLAYBOOK = [
  {
    id: 'convenio',
    title: 'Módulo Convênio',
    steps: [
      'Cadastrar número, nomenclatura curta e tipo DX',
      'Informar datas de assinatura, início, fim e do Termo Aditivo',
      'Anexar PDF já renomeado (nome curto; só PDF; comprimir se grande)',
      'Relatório técnico no convênio, com data FIM do projeto',
    ],
  },
  {
    id: 'projeto',
    title: 'Módulo Projetos',
    steps: [
      'Execução > modalidade externa > Projetos',
      'Nomenclatura, palavra-chave, modalidade ICT+empresa, status e ano-base',
      'Conferir no instrumento jurídico antes de salvar',
    ],
  },
  {
    id: 'vinculo',
    title: 'Vínculo de instrumentos (ordem obrigatória)',
    steps: [
      'Selecionar a ICT/instituto',
      'Incluir cada TA primeiro',
      'Incluir o CONVÊNIO por último — senão o TA some da lista',
      'Usar o nome do projeto, não só 001/ano',
    ],
  },
  {
    id: 'interno',
    title: 'Projeto interno',
    steps: [
      'Sem módulo convênio/aporte: relatório em Dispêndios > Outros correlatos',
      'Lançar R$ 0,01 para conseguir anexar (zero não grava)',
      'Vínculo interno/externo da atividade tem que bater com o módulo',
    ],
  },
  {
    id: 'rh',
    title: 'Atividades e RH',
    steps: [
      'CPF existente puxa cadastro da Suframa; novo exige nome e formação',
      'Horas inteiras, direto ou indireto; conferir Planilha Azul',
      'X na tela = incompleto; Declaração de Veracidade só sem X',
    ],
  },
  {
    id: 'conferencia',
    title: 'Conferência e declaração',
    steps: [
      'Imprimir relatório do projeto e bater convênios com os instrumentos',
      '"Outras informações" não é motivação (risco de glosa)',
      'Gerar hash da Declaração de Veracidade em sandbox — nunca enviar ao portal',
    ],
  },
] as const;

export function sagatSandboxSteps(compliant: boolean): string[] {
  const steps: string[] = SAGAT_PLAYBOOK.flatMap((block) => [...block.steps]);
  steps.push(
    compliant
      ? 'Sandbox: hash preliminar da Declaracao de Veracidade'
      : 'Sandbox bloqueado: conciliacao fiscal ou X de preenchimento',
  );
  return steps;
}
