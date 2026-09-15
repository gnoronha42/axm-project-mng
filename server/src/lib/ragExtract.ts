import { SUFRAMA_RULES } from './suframaRules.js';

export type ExtractedActivity = { description: string };
export type ExtractedTimesheet = { researcher: string; hours: number; hourlyRate?: number };
export type ExtractedExpense = { description: string; amount: number; invoice?: string };

export type ExtractionResult = {
  activities: ExtractedActivity[];
  timesheet: ExtractedTimesheet[];
  expenses: ExtractedExpense[];
  rawPreview: string;
  model: string;
};

function extractPdfStrings(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const chunks: string[] = [];
  const re = /\((?:\\.|[^\\)]){4,}\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const inner = match[0]
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')');
    if (/[A-Za-zÀ-ÿ]/.test(inner)) chunks.push(inner);
  }
  return chunks.join('\n');
}

export function bufferToText(buffer: Buffer, mimeType: string, filename: string): string {
  const lower = filename.toLowerCase();
  if (mimeType.includes('text') || lower.endsWith('.txt') || lower.endsWith('.md')) {
    return buffer.toString('utf8');
  }
  if (mimeType.includes('pdf') || lower.endsWith('.pdf')) {
    return extractPdfStrings(buffer);
  }
  return buffer.toString('utf8');
}

function parseMoney(raw: string): number | null {
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function extractHeuristic(text: string): ExtractionResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const activities: ExtractedActivity[] = [];
  const timesheet: ExtractedTimesheet[] = [];
  const expenses: ExtractedExpense[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (SUFRAMA_RULES.eligibleExpenseKeywords.some((k) => lower.includes(k)) && line.length > 12) {
      activities.push({ description: line.slice(0, 280) });
    }

    const hoursMatch = line.match(/(.{3,60}?)\s+(\d+(?:[.,]\d+)?)\s*h(?:oras?)?/i);
    const rateMatch = line.match(/R\$\s*([\d.]+,\d{2}|\d+)/i);
    if (hoursMatch && /pesquis|engenheir|cientist|analista|desenvolv/i.test(line)) {
      const hours = Number(hoursMatch[2].replace(',', '.'));
      const hourlyRate = rateMatch ? parseMoney(rateMatch[1]) ?? undefined : undefined;
      timesheet.push({ researcher: hoursMatch[1].replace(/[-:|]/g, '').trim(), hours, hourlyRate });
    }

    const nfMatch = line.match(/NF[-\s]?(\d{3,})/i);
    const moneyMatch = line.match(/R\$\s*([\d.]+,\d{2}|\d+)/i);
    if (moneyMatch && (nfMatch || /despesa|gasto|nota|fatura|compra/i.test(line))) {
      const amount = parseMoney(moneyMatch[1]);
      if (amount != null) {
        expenses.push({
          description: line.slice(0, 220),
          amount,
          invoice: nfMatch?.[1],
        });
      }
    }
  }

  return {
    activities: uniqueBy(activities, (a) => a.description).slice(0, 20),
    timesheet: uniqueBy(timesheet, (t) => `${t.researcher}-${t.hours}`).slice(0, 30),
    expenses: uniqueBy(expenses, (e) => `${e.invoice}-${e.amount}-${e.description}`).slice(0, 30),
    rawPreview: text.slice(0, 4000),
    model: 'heuristic-v1',
  };
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export async function extractWithOptionalLlm(text: string): Promise<ExtractionResult> {
  const base = extractHeuristic(text);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return base;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Extraia JSON {activities:[{description}], timesheet:[{researcher,hours,hourlyRate}], expenses:[{description,amount,invoice}]} de relatórios de PD&I. Sem markdown.',
          },
          { role: 'user', content: text.slice(0, 12000) },
        ],
      }),
    });
    if (!res.ok) return base;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as Partial<ExtractionResult>;
    return {
      activities: parsed.activities?.length ? parsed.activities : base.activities,
      timesheet: parsed.timesheet?.length ? parsed.timesheet : base.timesheet,
      expenses: parsed.expenses?.length ? parsed.expenses : base.expenses,
      rawPreview: base.rawPreview,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    };
  } catch {
    return base;
  }
}
