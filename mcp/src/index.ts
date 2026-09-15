#!/usr/bin/env node
/**
 * Servidor MCP (stdio / JSON-RPC 2.0) — ferramentas fiscais Suframa e sandbox SAGAT.
 */
import { MCP_TOOLS, callTool } from './tools.js';

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method?: string; params?: Record<string, unknown> };

async function handle(msg: Rpc) {
  const id = msg.id ?? null;
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'axm-mcp', version: '1.0.0' },
        capabilities: { tools: {} },
      },
    };
  }
  if (msg.method === 'notifications/initialized') return null;
  if (msg.method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } };
  }
  if (msg.method === 'tools/call') {
    const name = String(msg.params?.name ?? '');
    const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
    try {
      const result = await callTool(name, args);
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : 'erro' },
      };
    }
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Método desconhecido: ${msg.method}` } };
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let idx: number;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    const parsed = JSON.parse(line) as Rpc;
    const out = await handle(parsed);
    if (out) process.stdout.write(`${JSON.stringify(out)}\n`);
  }
});
