import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { request, setAuthToken, getAuthToken } from '../services/apiClient';
import { applyProfileOverlay, writeProfileOverlay } from './profileOverlay';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  avatarUrl?: string;
};

type AuthResponse = { token: string; user: AuthUser };

type ProfileInput = { name: string; email: string; avatarFile?: File; avatarPreview?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = getAuthToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      setAuthToken(stored);
      try {
        const data = await request<{ user: AuthUser }>('/auth/me');
        if (!cancelled) {
          setUser(applyProfileOverlay(data.user));
          setToken(stored);
        }
      } catch {
        setAuthToken(null);
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(applyProfileOverlay(data.user));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(applyProfileOverlay(data.user));
  }, []);

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const current = user;
    if (!current) throw new Error('Não autenticado');

    let nextUser = { ...current, name: input.name, email: input.email };
    if (input.avatarPreview) nextUser = { ...nextUser, avatarUrl: input.avatarPreview };

    try {
      const data = await request<AuthResponse>('/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.name, email: input.email }),
      });
      if (data.token) {
        setAuthToken(data.token);
        setToken(data.token);
      }
      nextUser = { ...nextUser, ...data.user, avatarUrl: data.user.avatarUrl ?? nextUser.avatarUrl };
    } catch {
      /* overlay local até a API ser atualizada */
    }

    if (input.avatarFile) {
      try {
        const form = new FormData();
        form.append('file', input.avatarFile);
        const data = await request<{ user: AuthUser }>('/auth/me/avatar', {
          method: 'POST',
          body: form,
        });
        nextUser = { ...nextUser, ...data.user, avatarUrl: data.user.avatarUrl ?? nextUser.avatarUrl };
      } catch {
        /* mantém preview local */
      }
    }

    writeProfileOverlay(current.id, {
      name: nextUser.name,
      email: nextUser.email,
      avatarUrl: nextUser.avatarUrl,
    });
    setUser(applyProfileOverlay(nextUser));
  }, [user]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, updateProfile, logout }),
    [user, token, loading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
