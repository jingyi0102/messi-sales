import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import type { Account } from '../types/auth';

interface AuthContextValue {
  currentUser: Account | null;
  isAuthLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await authService.ensureDefaultAdmin();
        setCurrentUser(await authService.restoreSession());
      } finally {
        setAuthLoading(false);
      }
    }
    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthLoading,
      login: async (username, password) => {
        const account = await authService.login(username, password);
        setCurrentUser(account);
        return Boolean(account);
      },
      logout: async () => {
        await authService.logout();
        setCurrentUser(null);
      },
    }),
    [currentUser, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
