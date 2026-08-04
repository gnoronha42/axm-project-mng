const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'axm_token';

let memoryToken: string | null = localStorage.getItem(TOKEN_KEY);

export function getAuthToken(): string | null {
  return memoryToken;
}

export function setAuthToken(token: string | null) {
  memoryToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const headers = new Headers(extra);
  if (memoryToken) headers.set('Authorization', `Bearer ${memoryToken}`);
  return headers;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: authHeaders(options?.headers),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
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
  onProgress?: (pct: number) => void,
): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', fields.category);
  form.append('phase', fields.phase);
  form.append('uploadedBy', fields.uploadedBy ?? 'Usuário');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/projects/${projectId}/documents`);
    if (memoryToken) xhr.setRequestHeader('Authorization', `Bearer ${memoryToken}`);

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(undefined);
        }
        return;
      }

      let message = xhr.statusText || 'Falha no upload';
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* ignore */
      }
      reject(new ApiError(message, xhr.status));
    };

    xhr.onerror = () => reject(new ApiError('Erro de rede no upload', 0));
    xhr.onabort = () => reject(new ApiError('Upload cancelado', 0));

    xhr.send(form);
  });
}
