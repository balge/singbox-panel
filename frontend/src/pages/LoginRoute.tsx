import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LoginPage } from "@/pages/LoginPage"

export function LoginRoute() {
  const { state } = useAuth()

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    )
  }

  if (state.status === "authenticated") {
    return <Navigate to="/" replace />
  }

  return <LoginPage />
}
