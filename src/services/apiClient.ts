const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json() as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function uploadDocument(
  projectId: string,
  file: File,
  fields: { category: string; phase: string; uploadedBy?: string },
): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', fields.category);
  form.append('phase', fields.phase);
  form.append('uploadedBy', fields.uploadedBy ?? 'Usuário');

  const res = await fetch(`${BASE}/projects/${projectId}/documents`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new ApiError(body.error ?? 'Falha no upload', res.status);
  }

  return res.json();
}
