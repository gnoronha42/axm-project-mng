export type LlmJson = {
  activities?: { description: string }[];
  timesheet?: { researcher: string; hours: number; hourlyRate?: number }[];
  expenses?: { description: string; amount: number; invoice?: string }[];
};

function stripFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function parseLlmJson(raw: string): LlmJson | null {
  try {
    return JSON.parse(stripFence(raw)) as LlmJson;
  } catch {
    return null;
  }
}

const SYSTEM = [
  'Você extrai dados de relatórios técnicos de PD&I Suframa / SAGAT.',
  'Responda SOMENTE um JSON: {activities:[{description}], timesheet:[{researcher,hours,hourlyRate}], expenses:[{description,amount,invoice}]}.',
  'Horas inteiras. invoice é número da NF quando existir. Sem markdown.',
].join(' ');

export function configuredLlm(): { provider: 'anthropic' | 'openai' | null; model: string } {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return { provider: 'anthropic', model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5' };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { provider: 'openai', model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' };
  }
  return { provider: null, model: 'heuristic-v1' };
}

async function extractWithClaude(text: string, model: string, apiKey: string): Promise<LlmJson | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: 'user', content: text.slice(0, 14000) }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const content = data.content?.find((b) => b.type === 'text')?.text ?? '';
  return parseLlmJson(content);
}

async function extractWithOpenAi(text: string, model: string, apiKey: string): Promise<LlmJson | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: text.slice(0, 12000) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseLlmJson(data.choices?.[0]?.message?.content ?? '');
}

export async function extractJsonWithLlm(text: string): Promise<{ parsed: LlmJson | null; model: string }> {
  const cfg = configuredLlm();
  if (cfg.provider === 'anthropic') {
    const parsed = await extractWithClaude(text, cfg.model, process.env.ANTHROPIC_API_KEY!.trim());
    return { parsed, model: cfg.model };
  }
  if (cfg.provider === 'openai') {
    const parsed = await extractWithOpenAi(text, cfg.model, process.env.OPENAI_API_KEY!.trim());
    return { parsed, model: cfg.model };
  }
  return { parsed: null, model: 'heuristic-v1' };
}
