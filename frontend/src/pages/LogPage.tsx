import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SchemaForm } from "@/components/SchemaForm"
import { configApi } from "@/lib/api"
import {
  DEFAULT_LOG,
  LOG_SCHEMA,
  type LogConfig,
  mergeLogFromJson,
  validateLog,
} from "@/schemas/logSchema"

export function LogPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<LogConfig>(DEFAULT_LOG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    configApi
      .getModule("log")
      .then((res) => {
        if (cancelled) return
        setData(mergeLogFromJson(res))
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const validation = validateLog(data)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setSaving(true)
    try {
      await configApi.saveModule("log", validation.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    )
  }

  const dataAsRecord = data as unknown as Record<string, unknown>

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            返回
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">日志设置</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 log 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/configuration/log/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box 日志配置
          </a>
          ，对应 parts/log.json
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">日志选项</h2>
            <SchemaForm
              schema={LOG_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as LogConfig)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </form>
      </div>
    </div>
  )
}
