import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SchemaForm } from "@/components/SchemaForm"
import { configApi } from "@/lib/api"
import {
  DEFAULT_ROUTE,
  ROUTE_FINAL_SCHEMA,
  type RouteConfig,
  mergeRouteFromJson,
  validateRoute,
} from "@/schemas/routeSchema"

export function RoutePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<RouteConfig>(DEFAULT_ROUTE)
  const [loading, setLoading] = useState(true)
  const [sectionSaving, setSectionSaving] = useState<
    "final" | "rules" | "rule_set" | null
  >(null)
  const [error, setError] = useState("")
  const [rulesText, setRulesText] = useState("[]")
  const [ruleSetText, setRuleSetText] = useState("[]")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    configApi
      .getModule("route")
      .then((res) => {
        if (cancelled) return
        const merged = mergeRouteFromJson(res)
        setData(merged)
        setRulesText(JSON.stringify(merged.rules ?? [], null, 2))
        setRuleSetText(JSON.stringify(merged.rule_set ?? [], null, 2))
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

  async function saveRoute(
    next: RouteConfig,
    section: "final" | "rules" | "rule_set"
  ) {
    const validation = validateRoute(next)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setError("")
    setSectionSaving(section)
    try {
      await configApi.saveModule("route", validation.data)
      setData(validation.data)
      setRulesText(JSON.stringify(validation.data.rules ?? [], null, 2))
      setRuleSetText(JSON.stringify(validation.data.rule_set ?? [], null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSectionSaving(null)
    }
  }

  async function saveFinalSection() {
    await saveRoute(data, "final")
  }

  async function saveRulesSection() {
    let parsed: unknown
    try {
      parsed = JSON.parse(rulesText)
    } catch {
      setError("路由规则 JSON 格式错误")
      return
    }
    if (!Array.isArray(parsed)) {
      setError("路由规则应为数组")
      return
    }
    await saveRoute({ ...data, rules: parsed }, "rules")
  }

  async function saveRuleSetSection() {
    let parsed: unknown
    try {
      parsed = JSON.parse(ruleSetText)
    } catch {
      setError("规则集 JSON 格式错误")
      return
    }
    if (!Array.isArray(parsed)) {
      setError("规则集应为数组")
      return
    }
    await saveRoute({ ...data, rule_set: parsed }, "rule_set")
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
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            返回
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">路由设置</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 route 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/configuration/route/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box 路由配置
          </a>
          ，对应 parts/route.json
        </p>

        <div className="space-y-8">
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">默认出站（final）</h2>
            <SchemaForm
              schema={ROUTE_FINAL_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as RouteConfig)}
            />
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveFinalSection()}
            >
              {sectionSaving === "final" ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">路由规则（rules）</h2>
            <p className="text-sm text-muted-foreground">
              编辑 JSON 数组，每项为一条路由规则（含 action、outbound 及匹配条件等）。
            </p>
            <textarea
              className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              spellCheck={false}
            />
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveRulesSection()}
            >
              {sectionSaving === "rules" ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">规则集（rule_set）</h2>
            <p className="text-sm text-muted-foreground">
              编辑 JSON 数组，每项为规则集定义（tag、type、url、format 等）。
            </p>
            <textarea
              className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={ruleSetText}
              onChange={(e) => setRuleSetText(e.target.value)}
              spellCheck={false}
            />
            <Button
              type="button"
              disabled={sectionSaving !== null}
              onClick={() => saveRuleSetSection()}
            >
              {sectionSaving === "rule_set" ? "保存中…" : "保存"}
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
