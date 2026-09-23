/** Campos do Template RDA Anexo V (ICT credenciada Capda). */
export const RDA_ANEXO_V_FIELDS = [
  { id: 'convenio', label: 'Convênio (instituição, nº, vigência)', keywords: ['convênio', 'convenio', 'instituição convenente'] },
  { id: 'termo_aditivo', label: 'Termo Aditivo  TA', keywords: ['termo aditivo', 'aditivo'] },
  { id: 'projeto', label: 'Identificação do projeto', keywords: ['projeto'] },
  { id: 'descricao', label: 'Descrição', keywords: ['descrição', 'descricao'] },
  { id: 'motivacao', label: 'Motivação do projeto', keywords: ['motivação', 'motivacao'] },
  { id: 'justificativa', label: 'Justificativa', keywords: ['justificativa'] },
  { id: 'escopo', label: 'Escopo', keywords: ['escopo'] },
  { id: 'objetivo_geral', label: 'Objetivo geral', keywords: ['objetivo geral'] },
  { id: 'objetivo_especifico', label: 'Objetivos específicos', keywords: ['objetivo específico', 'objetivos específicos'] },
  { id: 'inovacao', label: 'Características inovadoras', keywords: ['inovador', 'inovação', 'inovacao'] },
  { id: 'eap', label: 'Estrutura analítica (EAP)', keywords: ['estrutura analítica', 'eap'] },
  { id: 'cronograma', label: 'Cronograma', keywords: ['cronograma'] },
  { id: 'atividades', label: 'Atividades desenvolvidas e dispêndios', keywords: ['atividade', 'dispêndio', 'dispendio'] },
  { id: 'resumo_financeiro', label: 'Resumo financeiro / aportes', keywords: ['resumo financeiro', 'aporte', 'dispêndios por projeto'] },
  { id: 'anexos', label: 'Anexos e observações', keywords: ['anexo'] },
] as const;

export type RdFieldStatus = {
  id: string;
  label: string;
  present: boolean;
};

export function assessRdTemplate(text: string): RdFieldStatus[] {
  const hay = text.toLowerCase();
  return RDA_ANEXO_V_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    present: field.keywords.some((k) => hay.includes(k)),
  }));
}
