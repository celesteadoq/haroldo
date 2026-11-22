import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSessionUser: () => Promise<AuthUser | null>;
  setUserData: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSessionUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await authService.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        const me = await authService.getMe();
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const loggedUser = await authService.login(payload);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthUser> => {
    const createdUser = await authService.register(payload);
    setUser(createdUser);
    return createdUser;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshSessionUser,
      setUserData: setUser,
    }),
    [user, isLoading, login, register, logout, refreshSessionUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
