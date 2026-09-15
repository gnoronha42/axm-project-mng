import { SUFRAMA_RULES } from './suframaRules.js';
import type { ExtractionResult } from './ragExtract.js';

export type GlosaFinding = {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  details: Record<string, unknown>;
};

export function evaluateGlosa(extraction: ExtractionResult, projectDescription: string): GlosaFinding[] {
  const findings: GlosaFinding[] = [];
  const desc = projectDescription.toLowerCase();

  for (const row of extraction.timesheet) {
    if ((row.hourlyRate ?? 0) > SUFRAMA_RULES.maxResearcherHourlyRate) {
      findings.push({
        code: 'HOURLY_RATE_CAP',
        severity: 'error',
        message: `${row.researcher}: hora acima do teto regulamentar (R$ ${SUFRAMA_RULES.maxResearcherHourlyRate}/h).`,
        details: { researcher: row.researcher, hourlyRate: row.hourlyRate },
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
        details: expense,
      });
    }
    const hay = `${expense.description} ${extraction.rawPreview}`.toLowerCase();
    const eligible = SUFRAMA_RULES.eligibleExpenseKeywords.some((k) => hay.includes(k));
    if (!eligible) {
      findings.push({
        code: 'EXPENSE_SCOPE',
        severity: 'warning',
        message: `Gasto pode estar fora do escopo tecnológico PD&I: ${expense.description.slice(0, 80)}`,
        details: expense,
      });
    }
  }

  if (extraction.activities.length === 0) {
    findings.push({
      code: 'NO_INNOVATION_ACTIVITY',
      severity: 'warning',
      message: 'Não foi possível extrair descrição de atividades de inovação no relatório.',
      details: {},
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
        details: { sample: extraction.activities[0]?.description },
      });
    }
  }

  return findings;
}
