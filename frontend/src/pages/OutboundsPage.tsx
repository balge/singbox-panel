import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
  DEFAULT_OUTBOUND_ENTRY,
  DEFAULT_OUTBOUNDS,
  type OutboundEntry,
  type OutboundsConfig,
  mergeOutboundsFromJson,
  validateOutbounds,
} from "@/schemas/outboundsSchema"

export function OutboundsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<OutboundsConfig>(DEFAULT_OUTBOUNDS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    index: number | null
  }>({ open: false, index: null })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    configApi
      .getModule("outbounds")
      .then((res) => {
        if (cancelled) return
        setData(mergeOutboundsFromJson(res))
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

  async function saveOutbounds(next: OutboundsConfig) {
    const validation = validateOutbounds(next)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setError("")
    setSaving(true)
    try {
      await configApi.saveModule("outbounds", validation.data)
      setData(validation.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  function addOutboundAndSave(entry: OutboundEntry) {
    const next = [...data, entry]
    setData(next)
    setAddModalOpen(false)
    saveOutbounds(next)
  }

  function updateOutbound(index: number, entry: OutboundEntry) {
    const list = [...data]
    list[index] = entry
    setData(list)
    setEditingIndex(null)
    saveOutbounds(list)
  }

  function removeOutboundAndSave(index: number) {
    const next = data.filter((_, i) => i !== index)
    setData(next)
    if (editingIndex === index) setEditingIndex(null)
    else if (editingIndex != null && editingIndex > index)
      setEditingIndex(editingIndex - 1)
    saveOutbounds(next)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            返回
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">出站设置</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 outbounds 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/configuration/outbound/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box 出站配置
          </a>
          ，对应 parts/outbounds.json
        </p>

        <div className="space-y-8">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">出站列表</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setAddModalOpen(true)}
              >
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无出站，点击「添加」新增
                </p>
              ) : (
                data.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-sm">
                        {entry.tag || "(无 tag)"} — {entry.type ?? "—"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingIndex(editingIndex === i ? null : i)
                          }
                        >
                          {editingIndex === i ? "收起" : "编辑"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            setDeleteConfirm({ open: true, index: i })
                          }
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                    {editingIndex === i && (
                      <OutboundJsonForm
                        entry={entry}
                        onSave={(next) => updateOutbound(i, next)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    )}
                  </div>
                ))
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

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加出站</DialogTitle>
          </DialogHeader>
          <AddOutboundForm
            defaultEntry={{
              ...DEFAULT_OUTBOUND_ENTRY,
              tag: data.length ? `out_${data.length}` : "direct_out",
            }}
            onSave={(entry) => addOutboundAndSave(entry)}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((prev) => ({ ...prev, open }))
        }
        title="删除出站"
        description="确定删除该出站？"
        onConfirm={() => {
          if (deleteConfirm.index !== null) {
            removeOutboundAndSave(deleteConfirm.index)
          }
        }}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="destructive"
      />
    </div>
  )
}

function AddOutboundForm({
  defaultEntry,
  onSave,
  onCancel,
}: {
  defaultEntry: OutboundEntry
  onSave: (entry: OutboundEntry) => void
  onCancel: () => void
}) {
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(defaultEntry, null, 2)
  )
  const [parseError, setParseError] = useState("")

  const handleConfirm = () => {
    setParseError("")
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setParseError("JSON 格式错误")
      return
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setParseError("出站须为对象")
      return
    }
    onSave(parsed as OutboundEntry)
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        编辑下方 JSON，需包含 type、tag 等字段，参考
        <a
          href="https://sing-box.sagernet.org/configuration/outbound/"
          target="_blank"
          rel="noreferrer"
          className="ml-1 text-primary underline"
        >
          出站文档
        </a>
        。
      </p>
      <textarea
        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        spellCheck={false}
      />
      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" onClick={handleConfirm}>
          确认添加
        </Button>
      </DialogFooter>
    </div>
  )
}

function OutboundJsonForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: OutboundEntry
  onSave: (entry: OutboundEntry) => void
  onCancel: () => void
}) {
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(entry, null, 2)
  )
  const [parseError, setParseError] = useState("")

  const handleSave = () => {
    setParseError("")
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setParseError("JSON 格式错误")
      return
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setParseError("出站须为对象")
      return
    }
    onSave(parsed as OutboundEntry)
  }

  return (
    <div className="grid gap-3 pt-2 border-t">
      <textarea
        className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        spellCheck={false}
      />
      {parseError && (
        <p className="text-sm text-destructive">{parseError}</p>
      )}
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
