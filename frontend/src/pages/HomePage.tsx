import { useAuth } from "@/contexts/AuthContext"

export function HomePage() {
  const { state } = useAuth()

  if (state.status !== "authenticated") return null

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Singbox Panel
        </h1>
        <p className="text-muted-foreground">
          请从左侧菜单选择要配置的模块。
        </p>
      </div>
    </div>
  )
}
