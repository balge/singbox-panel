import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    )
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
