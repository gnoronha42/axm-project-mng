import { configuredLlm } from './llmExtract.js';

function stripFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export async function runRdLlm(system: string, user: string): Promise<{ raw: string; parsed: unknown; model: string }> {
  const cfg = configuredLlm();
  if (cfg.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!.trim(),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 4096,
        temperature: 0,
        system,
        messages: [{ role: 'user', content: user.slice(0, 60000) }],
      }),
    });
    if (!res.ok) throw new Error(`LLM Anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const raw = data.content?.find((b) => b.type === 'text')?.text ?? '';
    try {
      return { raw, parsed: JSON.parse(stripFence(raw)), model: cfg.model };
    } catch {
      return { raw, parsed: null, model: cfg.model };
    }
  }
  if (cfg.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user.slice(0, 50000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM OpenAI ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '';
    try {
      return { raw, parsed: JSON.parse(stripFence(raw)), model: cfg.model };
    } catch {
      return { raw, parsed: null, model: cfg.model };
    }
  }
  throw new Error('Nenhum provedor LLM configurado (defina ANTHROPIC_API_KEY ou OPENAI_API_KEY)');
}
