import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { authApi } from "@/lib/api"
import { clearToken, setToken } from "@/lib/token"

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; username: string }
  | { status: "unauthenticated" }

type AuthContextValue = {
  state: AuthState
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me()
      setState({ status: "authenticated", username: data.username })
    } catch {
      setState({ status: "unauthenticated" })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await authApi.login({ username, password })
      setToken(data.access_token)
      await refresh()
    },
    [refresh]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearToken()
      setState({ status: "unauthenticated" })
    }
  }, [])

  return (
    <AuthContext.Provider value={{ state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
