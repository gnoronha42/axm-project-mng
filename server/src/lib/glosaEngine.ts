import { SUFRAMA_RULES } from './suframaRules.js';
import type { ExtractionResult } from './ragExtract.js';
import { searchKnowledge, type KnowledgeHit } from './knowledgeSearch.js';
import { assessRdTemplate } from './rdTemplate.js';

export type GlosaFinding = {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  details: Record<string, unknown>;
};

function cite(hits: KnowledgeHit[]) {
  return hits.slice(0, 2).map((h) => ({
    slug: h.slug,
    title: h.title,
    excerpt: h.excerpt.slice(0, 220),
  }));
}

export async function evaluateGlosa(
  extraction: ExtractionResult,
  projectDescription: string,
): Promise<GlosaFinding[]> {
  const findings: GlosaFinding[] = [];
  const desc = projectDescription.toLowerCase();
  const preview = extraction.rawPreview ?? '';

  const [glosaHits, nfHits, scopeHits] = await Promise.all([
    searchKnowledge('glosa dispêndio comprovação nota fiscal pertinência objetivos', 4),
    searchKnowledge('ausência de comprovação notas fiscais recibos', 3),
    searchKnowledge('não pertinência com os objetivos do projeto escopo', 3),
  ]);

  for (const row of extraction.timesheet) {
    if ((row.hourlyRate ?? 0) > SUFRAMA_RULES.maxResearcherHourlyRate) {
      findings.push({
        code: 'HOURLY_RATE_CAP',
        severity: 'error',
        message: `${row.researcher}: hora acima do teto regulamentar (R$ ${SUFRAMA_RULES.maxResearcherHourlyRate}/h).`,
        details: { researcher: row.researcher, hourlyRate: row.hourlyRate, citations: cite(glosaHits) },
      });
    }
    if (row.hours > 220) {
      findings.push({
        code: 'HOURS_OVER_MONTH',
        severity: 'warning',
        message: `${row.researcher}: ${row.hours}h no período — conferir timesheet (teto típico 220h/mês).`,
        details: { researcher: row.researcher, hours: row.hours },
      });
    }
  }

  for (const expense of extraction.expenses) {
    if (!expense.invoice) {
      findings.push({
        code: 'EXPENSE_WITHOUT_NF',
        severity: 'error',
        message: `Despesa sem NF identificada: ${expense.description.slice(0, 80)}`,
        details: { ...expense, citations: cite(nfHits) },
      });
    }
    const hay = `${expense.description} ${preview}`.toLowerCase();
    const eligible = SUFRAMA_RULES.eligibleExpenseKeywords.some((k) => hay.includes(k));
    if (!eligible) {
      findings.push({
        code: 'EXPENSE_SCOPE',
        severity: 'warning',
        message: `Gasto pode estar fora do escopo tecnológico PD&I: ${expense.description.slice(0, 80)}`,
        details: { ...expense, citations: cite(scopeHits) },
      });
    }
  }

  if (extraction.activities.length === 0) {
    findings.push({
      code: 'NO_INNOVATION_ACTIVITY',
      severity: 'warning',
      message: 'Não foi possível extrair descrição de atividades de inovação no relatório.',
      details: { citations: cite(glosaHits) },
    });
  } else if (desc.length > 8) {
    const overlap = extraction.activities.some((a) =>
      desc.split(/\s+/).filter((w) => w.length > 4).some((w) => a.description.toLowerCase().includes(w)),
    );
    if (!overlap) {
      findings.push({
        code: 'ACTIVITY_MISMATCH',
        severity: 'warning',
        message: 'Atividades extraídas não cruzam com o escopo cadastrado do projeto.',
        details: { sample: extraction.activities[0]?.description, citations: cite(scopeHits) },
      });
    }
  }

  const rd = assessRdTemplate(preview);
  const missing = rd.filter((f) => !f.present);
  if (preview.length > 200 && missing.length >= 6) {
    findings.push({
      code: 'RD_TEMPLATE_GAP',
      severity: 'warning',
      message: `Relatório incompleto frente ao Anexo V (RDA): faltam ${missing.slice(0, 5).map((m) => m.label).join('; ')}.`,
      details: {
        missing: missing.map((m) => m.id),
        citations: [{ slug: 'template-rda-anexo-v', title: 'Template RDA Anexo V', excerpt: 'Convênio, TA, descrição, atividades/dispêndios e resumo financeiro.' }],
      },
    });
  }

  return findings;
}
