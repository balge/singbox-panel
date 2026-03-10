import { createContext, useCallback, useContext, useState } from 'react';

type AuthContextType = {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await import('./api').then((m) => m.login(username, password));
    import('./api').then((m) => m.setToken(access_token));
    setToken(access_token);
  }, []);

  const logout = useCallback(() => {
    import('./api').then((m) => m.clearToken());
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
