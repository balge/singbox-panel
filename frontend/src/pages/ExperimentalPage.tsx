import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SchemaForm } from "@/components/SchemaForm"
import { configApi } from "@/lib/api"
import {
  CACHE_FILE_SCHEMA,
  CLASH_API_SCHEMA,
  DEFAULT_EXPERIMENTAL,
  type ExperimentalConfig,
  mergeExperimentalFromJson,
  validateExperimental,
  V2RAY_API_SCHEMA,
  V2RAY_STATS_SCHEMA,
} from "@/schemas/experimentalSchema"

export function ExperimentalPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<ExperimentalConfig>(DEFAULT_EXPERIMENTAL)
  const [loading, setLoading] = useState(true)
  const [sectionSaving, setSectionSaving] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    configApi
      .getModule("experimental")
      .then((res) => {
        if (cancelled) return
        setData(mergeExperimentalFromJson(res))
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

  async function saveSection(
    section: "cache_file" | "clash_api" | "v2ray_api",
    patch: Partial<ExperimentalConfig>
  ) {
    setError("")
    const next = { ...data, ...patch }
    const validation = validateExperimental(next)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setSectionSaving(section)
    try {
      await configApi.saveModule("experimental", validation.data)
      setData(validation.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSectionSaving(null)
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
          <h1 className="text-2xl font-semibold tracking-tight">实验功能</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 experimental 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/zh/configuration/experimental/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box 实验性配置
          </a>
          ，对应 parts/experimental.json
        </p>

        <div className="space-y-8">
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">缓存文件（cache_file）</h2>
            <SchemaForm
              schema={CACHE_FILE_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as ExperimentalConfig)}
            />
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveSection("cache_file", data)}
            >
              {sectionSaving === "cache_file" ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">Clash API（clash_api）</h2>
            <SchemaForm
              schema={CLASH_API_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as ExperimentalConfig)}
            />
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveSection("clash_api", data)}
            >
              {sectionSaving === "clash_api" ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">V2Ray API（v2ray_api）</h2>
            <SchemaForm
              schema={V2RAY_API_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as ExperimentalConfig)}
            />
            <div className="rounded-md border p-4 space-y-4 mt-4">
              <h3 className="text-sm font-medium">流量统计（stats）</h3>
              <SchemaForm
                schema={V2RAY_STATS_SCHEMA}
                data={dataAsRecord}
                onChange={(next) => setData(next as unknown as ExperimentalConfig)}
              />
            </div>
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveSection("v2ray_api", data)}
            >
              {sectionSaving === "v2ray_api" ? "保存中…" : "保存"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
