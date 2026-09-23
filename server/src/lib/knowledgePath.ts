import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function resolveKnowledgeDir(): string {
  const candidates = [
    process.env.KNOWLEDGE_DIR,
    path.resolve(here, '../../knowledge/suframa'),
    path.resolve(here, '../../../knowledge/suframa'),
    '/app/knowledge/suframa',
  ].filter((p): p is string => Boolean(p));

  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'catalog.json'))) return dir;
  }
  return candidates[0] ?? path.resolve(here, '../../../knowledge/suframa');
}

export function resolveKnowledgeFile(filename: string): string | null {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return null;
  const full = path.join(resolveKnowledgeDir(), safe);
  return existsSync(full) ? full : null;
}
