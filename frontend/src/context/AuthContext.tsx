import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setUnauthorizedHandler } from '../api/client';
import type { User } from '../types';

const TOKEN_KEY = 'stylehub_token';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    if (user) return;
    let cancelled = false;
    api
      .get<User>('/users/me', token)
      .then((profile) => !cancelled && setUser(profile))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [token, user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ access_token: string }>('/auth/login', { email, password });
    const profile = await api.get<User>('/users/me', response.access_token);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    setUser(profile);
    setToken(response.access_token);
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      await api.post('/auth/register', { full_name: fullName, email, password });
      await login(email, password);
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, ready, login, register, logout }),
    [token, user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
