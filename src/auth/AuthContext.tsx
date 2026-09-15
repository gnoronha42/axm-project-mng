import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { request, setAuthToken, getAuthToken } from '../services/apiClient';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
};

type AuthResponse = { token: string; user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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
          setUser(data.user);
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
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
