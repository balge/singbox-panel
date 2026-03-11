import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { configApi } from "@/lib/api"
import {
  DEFAULT_DNS,
  DNS_FAKEIP_SCHEMA,
  DNS_TOP_SCHEMA,
  type DnsConfigState,
  type DnsRule,
  type DnsServer,
  mergeDnsFromJson,
  validateDns,
} from "@/schemas/dnsSchema"
import { SchemaForm } from "@/components/SchemaForm"
import {
  schemaLabel,
  DNS_SERVERS_LABEL,
  DNS_RULES_LABEL,
  DNS_RULE_FIELD_LABELS,
} from "@/lib/schemaZh"

function arrToStr(arr: string[] | undefined): string {
  return Array.isArray(arr) ? arr.join("\n") : ""
}
function strToArr(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
}

export function DnsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DnsConfigState>(DEFAULT_DNS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editingServerIndex, setEditingServerIndex] = useState<number | null>(null)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [addServerOpen, setAddServerOpen] = useState(false)
  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    kind: "server" | "rule" | null
    index: number
  }>({ open: false, kind: null, index: -1 })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    configApi
      .getModule("dns")
      .then((res) => {
        if (cancelled) return
        setData(mergeDnsFromJson(res))
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

  async function saveDns(next: DnsConfigState) {
    const validation = validateDns(next)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setError("")
    setSaving(true)
    try {
      await configApi.saveModule("dns", validation.data)
      setData(mergeDnsFromJson(validation.data))
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  async function saveTopSection() {
    await saveDns(data)
  }

  async function saveFakeipSection() {
    await saveDns(data)
  }

  const servers = data.servers ?? []
  const rules = data.rules ?? []

  const addServerAndSave = (server: DnsServer) => {
    const next: DnsConfigState = {
      ...data,
      servers: [...(data.servers ?? []), server],
    }
    setData(next)
    setAddServerOpen(false)
    saveDns(next)
  }

  const updateServerAndSave = (index: number, server: DnsServer) => {
    const list = [...(data.servers ?? [])]
    list[index] = server
    const next = { ...data, servers: list }
    setData(next)
    setEditingServerIndex(null)
    saveDns(next)
  }

  const removeServerAndSave = (index: number) => {
    const next = {
      ...data,
      servers: (data.servers ?? []).filter((_, i) => i !== index),
    }
    setData(next)
    if (editingServerIndex === index) setEditingServerIndex(null)
    else if (editingServerIndex != null && editingServerIndex > index)
      setEditingServerIndex(editingServerIndex - 1)
    saveDns(next)
  }

  const addRuleAndSave = (rule: DnsRule) => {
    const next: DnsConfigState = {
      ...data,
      rules: [...(data.rules ?? []), rule],
    }
    setData(next)
    setAddRuleOpen(false)
    saveDns(next)
  }

  const updateRuleAndSave = (index: number, rule: DnsRule) => {
    const list = [...(data.rules ?? [])]
    list[index] = rule
    const next = { ...data, rules: list }
    setData(next)
    setEditingRuleIndex(null)
    saveDns(next)
  }

  const removeRuleAndSave = (index: number) => {
    const next = {
      ...data,
      rules: (data.rules ?? []).filter((_, i) => i !== index),
    }
    setData(next)
    if (editingRuleIndex === index) setEditingRuleIndex(null)
    else if (editingRuleIndex != null && editingRuleIndex > index)
      setEditingRuleIndex(editingRuleIndex - 1)
    saveDns(next)
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
          <h1 className="text-2xl font-semibold tracking-tight">DNS 设置</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 DNS 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/configuration/dns/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box DNS 配置
          </a>
          ，对应 parts/dns.json
        </p>

        <div className="space-y-8">
          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">全局选项</h2>
            <SchemaForm
              schema={DNS_TOP_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as DnsConfigState)}
            />
            <Button
              type="button"
              disabled={saving}
              onClick={() => saveTopSection()}
            >
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">FakeIP（fakeip）</h2>
            <SchemaForm
              schema={DNS_FAKEIP_SCHEMA}
              data={dataAsRecord}
              onChange={(next) => setData(next as unknown as DnsConfigState)}
            />
            <Button
              type="button"
              disabled={saving}
              onClick={() => saveFakeipSection()}
            >
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{DNS_SERVERS_LABEL}</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddServerOpen(true)}
              >
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {servers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无服务器，点击「添加」新增
                </p>
              ) : (
                servers.map((s, i) => {
                  const item = s as DnsServer
                  return (
                    <div
                      key={i}
                      className="rounded-md border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-mono text-sm">
                          {item.tag || "(无 tag)"} — {item.address || "(无 address)"}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingServerIndex(
                                editingServerIndex === i ? null : i
                              )
                            }
                          >
                            {editingServerIndex === i ? "收起" : "编辑"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ open: true, kind: "server", index: i })}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                      {editingServerIndex === i && (
                        <ServerForm
                          server={item}
                          onSave={(server) => updateServerAndSave(i, server)}
                          onCancel={() => setEditingServerIndex(null)}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{DNS_RULES_LABEL}</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddRuleOpen(true)}
              >
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无规则，点击「添加」新增
                </p>
              ) : (
                rules.map((r, i) => {
                  const item = r as DnsRule
                  return (
                    <div
                      key={i}
                      className="rounded-md border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-mono text-sm">
                          server: {item.server || "(未设置)"}
                          {item.outbound ? ` · outbound: ${item.outbound}` : ""}
                          {item.clash_mode
                            ? ` · clash_mode: ${item.clash_mode}`
                            : ""}
                          {item.rule_set?.length
                            ? ` · rule_set: ${item.rule_set.length} 项`
                            : ""}
                          {item.package_name?.length
                            ? ` · package_name: ${item.package_name.length} 项`
                            : ""}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingRuleIndex(
                                editingRuleIndex === i ? null : i
                              )
                            }
                          >
                            {editingRuleIndex === i ? "收起" : "编辑"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ open: true, kind: "rule", index: i })}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                      {editingRuleIndex === i && (
                        <RuleForm
                          rule={item}
                          onSave={(rule) => updateRuleAndSave(i, rule)}
                          onCancel={() => setEditingRuleIndex(null)}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <Dialog open={addServerOpen} onOpenChange={setAddServerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 DNS 服务器</DialogTitle>
          </DialogHeader>
          <AddServerForm
            server={{ tag: "", address: "" }}
            onSave={(server) => addServerAndSave(server)}
            onCancel={() => setAddServerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 DNS 规则</DialogTitle>
          </DialogHeader>
          <AddRuleForm
            rule={{ server: "" }}
            onSave={(rule) => addRuleAndSave(rule)}
            onCancel={() => setAddRuleOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={
          deleteConfirm.kind === "server" ? "删除 DNS 服务器" : "删除 DNS 规则"
        }
        description={
          deleteConfirm.kind === "server"
            ? "确定删除该 DNS 服务器？"
            : "确定删除该 DNS 规则？"
        }
        onConfirm={() => {
          if (deleteConfirm.kind === "server")
            removeServerAndSave(deleteConfirm.index)
          else if (deleteConfirm.kind === "rule")
            removeRuleAndSave(deleteConfirm.index)
        }}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="destructive"
      />
    </div>
  )
}

function AddServerForm({
  server,
  onSave,
  onCancel,
}: {
  server: DnsServer
  onSave: (s: DnsServer) => void
  onCancel: () => void
}) {
  const [tag, setTag] = useState(server.tag ?? "")
  const [address, setAddress] = useState(server.address ?? "")
  const [address_resolver, setAddressResolver] = useState(
    server.address_resolver ?? ""
  )
  const [strategy, setStrategy] = useState(server.strategy ?? "")
  const [detour, setDetour] = useState(server.detour ?? "")

  const handleSave = () => {
    onSave({
      ...server,
      tag: tag.trim() || undefined,
      address: address.trim() || undefined,
      address_resolver: address_resolver.trim() || undefined,
      strategy: strategy.trim() ? strategy : undefined,
      detour: detour.trim() || undefined,
    })
  }

  return (
    <div className="grid gap-3">
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["tag"], "标签", "tag")}</Label>
        <Input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="如 dns_proxys"
        />
      </div>
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["address"], "地址", "address")}</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="如 https://1.1.1.1/dns-query"
        />
      </div>
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["address_resolver"], "用于解析地址的 DNS 服务器 tag", "address_resolver")}</Label>
        <Input
          value={address_resolver}
          onChange={(e) => setAddressResolver(e.target.value)}
          placeholder="可选"
        />
      </div>
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["strategy"], "默认解析策略", "strategy")}</Label>
        <Input
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          placeholder="prefer_ipv4 / ipv4_only 等"
        />
      </div>
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["detour"], "出站 tag", "detour")}</Label>
        <Input
          value={detour}
          onChange={(e) => setDetour(e.target.value)}
          placeholder="出站 tag"
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" onClick={handleSave}>
          确认添加
        </Button>
      </DialogFooter>
    </div>
  )
}

function AddRuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: DnsRule
  onSave: (r: DnsRule) => void
  onCancel: () => void
}) {
  const [server, setServer] = useState(rule.server ?? "")
  const [outbound, setOutbound] = useState(rule.outbound ?? "")
  const [clash_mode, setClashMode] = useState(rule.clash_mode ?? "")
  const [rule_set, setRuleSet] = useState(arrToStr(rule.rule_set))
  const [package_name, setPackageName] = useState(arrToStr(rule.package_name))

  const handleSave = () => {
    onSave({
      ...rule,
      server: server || undefined,
      outbound: outbound || undefined,
      clash_mode: clash_mode || undefined,
      rule_set: strToArr(rule_set).length ? strToArr(rule_set) : undefined,
      package_name: strToArr(package_name).length
        ? strToArr(package_name)
        : undefined,
    })
  }

  return (
    <div className="grid gap-3">
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.server}</Label>
        <Input
          value={server}
          onChange={(e) => setServer(e.target.value)}
          placeholder="DNS 服务器 tag"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.outbound}</Label>
        <Input
          value={outbound}
          onChange={(e) => setOutbound(e.target.value)}
          placeholder="如 any"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.clash_mode}</Label>
        <Input
          value={clash_mode}
          onChange={(e) => setClashMode(e.target.value)}
          placeholder="如 direct / global"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.rule_set}</Label>
        <textarea
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={rule_set}
          onChange={(e) => setRuleSet(e.target.value)}
          placeholder="如 geosite:cn"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.package_name}</Label>
        <textarea
          className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={package_name}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="Android 包名"
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" onClick={handleSave}>
          确认添加
        </Button>
      </DialogFooter>
    </div>
  )
}

function ServerForm({
  server,
  onSave,
  onCancel,
}: {
  server: DnsServer
  onSave: (s: DnsServer) => void
  onCancel: () => void
}) {
  const [tag, setTag] = useState(server.tag ?? "")
  const [address, setAddress] = useState(server.address ?? "")
  const [address_resolver, setAddressResolver] = useState(
    server.address_resolver ?? ""
  )
  const [strategy, setStrategy] = useState(server.strategy ?? "")
  const [detour, setDetour] = useState(server.detour ?? "")

  const handleSave = () => {
    onSave({
      ...server,
      tag: tag.trim() || undefined,
      address: address.trim() || undefined,
      address_resolver: address_resolver.trim() || undefined,
      strategy: strategy.trim() ? strategy : undefined,
      detour: detour.trim() || undefined,
    })
  }

  return (
    <div className="grid gap-3 pt-2 border-t">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>{schemaLabel("LegacyDNSServer", ["tag"], "标签", "tag")}</Label>
          <Input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="如 dns_proxys"
          />
        </div>
        <div className="space-y-1">
          <Label>{schemaLabel("LegacyDNSServer", ["address"], "地址", "address")}</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="如 https://1.1.1.1/dns-query"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>{schemaLabel("LegacyDNSServer", ["address_resolver"], "用于解析地址的 DNS 服务器 tag", "address_resolver")}</Label>
          <Input
            value={address_resolver}
            onChange={(e) => setAddressResolver(e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="space-y-1">
          <Label>{schemaLabel("LegacyDNSServer", ["strategy"], "默认解析策略", "strategy")}</Label>
          <Input
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="prefer_ipv4 / ipv4_only 等"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{schemaLabel("LegacyDNSServer", ["detour"], "出站 tag", "detour")}</Label>
        <Input
          value={detour}
          onChange={(e) => setDetour(e.target.value)}
          placeholder="出站 tag"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSave}>
          保存
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}

function RuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: DnsRule
  onSave: (r: DnsRule) => void
  onCancel: () => void
}) {
  const [server, setServer] = useState(rule.server ?? "")
  const [outbound, setOutbound] = useState(rule.outbound ?? "")
  const [clash_mode, setClashMode] = useState(rule.clash_mode ?? "")
  const [rule_set, setRuleSet] = useState(arrToStr(rule.rule_set))
  const [package_name, setPackageName] = useState(arrToStr(rule.package_name))

  const handleSave = () => {
    onSave({
      ...rule,
      server: server || undefined,
      outbound: outbound || undefined,
      clash_mode: clash_mode || undefined,
      rule_set: strToArr(rule_set).length ? strToArr(rule_set) : undefined,
      package_name: strToArr(package_name).length
        ? strToArr(package_name)
        : undefined,
    })
  }

  return (
    <div className="grid gap-3 pt-2 border-t">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>{DNS_RULE_FIELD_LABELS.server}</Label>
          <Input
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="DNS 服务器 tag"
          />
        </div>
        <div className="space-y-1">
          <Label>{DNS_RULE_FIELD_LABELS.outbound}</Label>
          <Input
            value={outbound}
            onChange={(e) => setOutbound(e.target.value)}
            placeholder="如 any"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.clash_mode}</Label>
        <Input
          value={clash_mode}
          onChange={(e) => setClashMode(e.target.value)}
          placeholder="如 direct / global"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.rule_set}</Label>
        <textarea
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={rule_set}
          onChange={(e) => setRuleSet(e.target.value)}
          placeholder="如 geosite:cn"
        />
      </div>
      <div className="space-y-1">
        <Label>{DNS_RULE_FIELD_LABELS.package_name}</Label>
        <textarea
          className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={package_name}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="Android 包名"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSave}>
          保存
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}
