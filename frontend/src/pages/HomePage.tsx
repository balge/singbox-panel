import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export function HomePage() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  if (state.status !== "authenticated") return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Singbox Panel
      </h1>
      <p className="text-muted-foreground">
        已登录：{state.username}
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate("/experimental")}>
          实验功能
        </Button>
        <Button variant="outline" onClick={() => navigate("/dns")}>
          DNS 设置
        </Button>
        <Button variant="outline" onClick={() => navigate("/log")}>
          日志设置
        </Button>
        <Button variant="outline" onClick={() => navigate("/ntp")}>
          NTP 设置
        </Button>
        <Button variant="outline" onClick={() => navigate("/inbounds")}>
          入站设置
        </Button>
        <Button variant="outline" onClick={() => navigate("/outbounds")}>
          出站设置
        </Button>
        <Button variant="outline" onClick={() => navigate("/route")}>
          路由设置
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  )
}
