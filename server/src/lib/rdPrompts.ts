export type RdStep =
  | 'contexto'
  | 'trajetoria'
  | 'atividades'
  | 'evidencias'
  | 'lacunas'
  | 'revisao';

export const RD_STEPS: { step: RdStep; title: string; ordinal: number }[] = [
  { step: 'contexto', title: 'Contexto e enquadramento', ordinal: 1 },
  { step: 'trajetoria', title: 'Trajetória do projeto', ordinal: 2 },
  { step: 'atividades', title: 'Atividades técnicas', ordinal: 3 },
  { step: 'evidencias', title: 'Evidências e vínculos', ordinal: 4 },
  { step: 'lacunas', title: 'Lacunas e pendências', ordinal: 5 },
  { step: 'revisao', title: 'Revisão final', ordinal: 6 },
];

export const CLAIM_LEVELS = ['COMPROVADO', 'RELATADO', 'PLANEJADO', 'LACUNA'] as const;
export type ClaimLevel = (typeof CLAIM_LEVELS)[number];

const BASE_RULES = [
  'Você é um auditor-redator de Relatórios Demonstrativos (RD) de P&D para Suframa / Lei de Informática.',
  'Nunca invente atividades, resultados, dificuldades, datas, valores ou vínculos entre atividades.',
  'Para cada afirmação, cite ao menos uma fonte via source_id EXATO como aparece em [n|tipo:id#hash] no dossiê, ou via knowledge:slug / web:url se vier da pesquisa.',
  'Classifique cada afirmação em um level:',
  '- COMPROVADO: há documento/evidência direta no dossiê.',
  '- RELATADO: há menção em comentário/ata, mas sem documento formal.',
  '- PLANEJADO: consta em plano/EAP/checklist como meta, não como execução.',
  '- LACUNA: não há como sustentar; preencha o campo "question" com a pergunta pendente e deixe sources vazio.',
  'Responda SOMENTE um JSON válido, sem markdown, sem texto fora do JSON.',
].join('\n');

export type StepPromptInput = {
  dossier: string;
  previousJson: string;
  research?: string;
  userNotes?: string;
};

type PromptSpec = {
  system: string;
  jsonShape: string;
  stepInstruction: string;
};

const PROMPTS: Record<RdStep, PromptSpec> = {
  contexto: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "claims": [{"text": string, "level": "COMPROVADO|RELATADO|PLANEJADO|LACUNA", "question"?: string, "sources": [{"sourceId": string, "excerpt": string}]}]}`,
    stepInstruction:
      'Produza o Contexto do RD: identifique o escopo formal do projeto (modalidade, convênio/TA, vigência, instituição, tema). Para cada ponto, uma claim com nível e fontes. Se o enquadramento, convênio ou vigência não aparecer, marque LACUNA com question explícita.',
  },
  trajetoria: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "claims": [{"text": string, "level": "COMPROVADO|RELATADO|PLANEJADO|LACUNA", "question"?: string, "sources": [{"sourceId": string, "excerpt": string}]}]}`,
    stepInstruction:
      'Reconstrua a trajetória: problema inicial → objetivos de pesquisa → requisitos identificados → atividades realizadas → entregas produzidas. Cada etapa vira uma claim. Diferencie o que decorre da pesquisa inicial do que é ampliação/mudança de escopo. Não force vínculo entre atividades sem evidência.',
  },
  atividades: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "activities": [{"nome": string, "objetivoTecnico": string, "metodo": string, "dificuldade": string, "alternativas": string, "resultado": string, "level": "COMPROVADO|RELATADO|PLANEJADO|LACUNA", "question"?: string, "sources": [{"sourceId": string, "excerpt": string}]}]}`,
    stepInstruction:
      'Liste as atividades técnicas efetivamente observadas no dossiê (uma por atividade distinta). Para cada uma preencha objetivoTecnico, metodo, dificuldade investigada, alternativas avaliadas, resultado/aprendizado, nível e fontes. Campos sem evidência ficam com valor "—" e a atividade recebe level LACUNA ou PLANEJADO com question.',
  },
  evidencias: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "claims": [{"text": string, "level": "COMPROVADO|RELATADO|PLANEJADO|LACUNA", "question"?: string, "sources": [{"sourceId": string, "excerpt": string}]}]}`,
    stepInstruction:
      'Para cada atividade do passo anterior (fornecida em previousJson), consolide as evidências e vínculos verificáveis. Uma claim por atividade. Se a evidência vier de pesquisa externa (research), use o sourceId no formato knowledge:slug ou web:url.',
  },
  lacunas: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "claims": [{"text": string, "level": "LACUNA", "question": string, "sources": []}]}`,
    stepInstruction:
      'Consolide TODAS as lacunas, inconsistências e evidências adicionais necessárias para concluir o RD. Cada item vira uma claim level=LACUNA com question obrigatória. Inclua pontos onde a documentação não permite sustentar uma conclusão. Nenhuma source nesta seção.',
  },
  revisao: {
    system: BASE_RULES,
    jsonShape: `{"summary": string, "claims": [{"text": string, "level": "COMPROVADO|RELATADO|PLANEJADO|LACUNA", "question"?: string, "sources": [{"sourceId": string, "excerpt": string}]}]}`,
    stepInstruction:
      'Produza o resumo executivo final em até 10 claims cobrindo: enquadramento, trajetória, atividades, resultados, pendências. Reuse o conteúdo dos passos anteriores (fornecidos em previousJson). Marque como LACUNA tudo que ainda depender de validação.',
  },
};

export function buildStepPrompt(step: RdStep, input: StepPromptInput) {
  const spec = PROMPTS[step];
  const user = [
    `# STEP: ${step} — ${RD_STEPS.find((s) => s.step === step)!.title}`,
    spec.stepInstruction,
    '',
    '# JSON SHAPE OBRIGATÓRIO',
    spec.jsonShape,
    '',
    '# DOSSIÊ DO PROJETO',
    input.dossier,
    input.research ? `\n# PESQUISA (biblioteca/web)\n${input.research}` : '',
    input.previousJson ? `\n# RESULTADO DOS PASSOS ANTERIORES\n${input.previousJson}` : '',
    input.userNotes ? `\n# NOTAS DO USUÁRIO\n${input.userNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { system: spec.system, user };
}
