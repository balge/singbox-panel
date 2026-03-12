import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SchemaForm } from "@/components/SchemaForm"
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
  DEFAULT_INBOUND_ENTRY,
  DEFAULT_INBOUNDS,
  getInboundSchemaForType,
  type InboundEntry,
  type InboundsConfig,
  mergeInboundsFromJson,
  validateInbounds,
} from "@/schemas/inboundsSchema"

export function InboundsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<InboundsConfig>(DEFAULT_INBOUNDS)
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
      .getModule("inbounds")
      .then((res) => {
        if (cancelled) return
        setData(mergeInboundsFromJson(res))
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

  async function saveInbounds(next: InboundsConfig) {
    const validation = validateInbounds(next)
    if (!validation.success) {
      setError(validation.error)
      return
    }
    setError("")
    setSaving(true)
    try {
      await configApi.saveModule("inbounds", validation.data)
      setData(validation.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  function addInboundAndSave(entry: InboundEntry) {
    const next = [...data, entry]
    setData(next)
    setAddModalOpen(false)
    saveInbounds(next)
  }

  function updateInbound(index: number, entry: InboundEntry) {
    const list = [...data]
    list[index] = entry
    setData(list)
    setEditingIndex(null)
    saveInbounds(list)
  }

  function removeInboundAndSave(index: number) {
    const next = data.filter((_, i) => i !== index)
    setData(next)
    if (editingIndex === index) setEditingIndex(null)
    else if (editingIndex != null && editingIndex > index)
      setEditingIndex(editingIndex - 1)
    saveInbounds(next)
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
          <h1 className="text-2xl font-semibold tracking-tight">入站设置</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          编辑 inbounds 模块，字段参考
          <a
            href="https://sing-box.sagernet.org/zh/configuration/inbound/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 text-primary underline"
          >
            sing-box 入站配置
          </a>
          ，对应 parts/inbounds.json
        </p>

        <div className="space-y-8">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">入站列表</h2>
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
                  暂无入站，点击「添加」新增
                </p>
              ) : (
                data.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-sm">
                        {entry.tag || "(无 tag)"} — {entry.type ?? "mixed"} :{entry.listen_port ?? ""}
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
                          onClick={() => setDeleteConfirm({ open: true, index: i })}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                    {editingIndex === i && (
                      <InboundForm
                        entry={entry}
                        onSave={(next) => updateInbound(i, next)}
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
            <DialogTitle>添加入站</DialogTitle>
          </DialogHeader>
          <AddInboundForm
            defaultEntry={{
              ...DEFAULT_INBOUND_ENTRY,
              tag: `mixed_in_${data.length}`,
              listen_port: 2080 + data.length + 1,
            }}
            onSave={(entry) => addInboundAndSave(entry)}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((prev) => ({ ...prev, open }))
        }
        title="删除入站"
        description="确定删除该入站？"
        onConfirm={() => {
          if (deleteConfirm.index !== null) {
            removeInboundAndSave(deleteConfirm.index)
          }
        }}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="destructive"
      />
    </div>
  )
}

function AddInboundForm({
  defaultEntry,
  onSave,
  onCancel,
}: {
  defaultEntry: InboundEntry
  onSave: (entry: InboundEntry) => void
  onCancel: () => void
}) {
  const [localEntry, setLocalEntry] = useState<InboundEntry>(() => ({
    ...defaultEntry,
  }))

  return (
    <div className="grid gap-4">
      <SchemaForm
        schema={getInboundSchemaForType((localEntry.type as string) || "mixed")}
        data={localEntry as unknown as Record<string, unknown>}
        onChange={(next) =>
          setLocalEntry({
            ...localEntry,
            ...(next as Record<string, unknown>),
          } as InboundEntry)
        }
      />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" onClick={() => onSave(localEntry)}>
          确认添加
        </Button>
      </DialogFooter>
    </div>
  )
}

function InboundForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: InboundEntry
  onSave: (entry: InboundEntry) => void
  onCancel: () => void
}) {
  const [localEntry, setLocalEntry] = useState<InboundEntry>(() => ({ ...entry }))

  return (
    <div className="grid gap-4 pt-2 border-t">
      <SchemaForm
        schema={getInboundSchemaForType((localEntry.type as string) || "mixed")}
        data={localEntry as unknown as Record<string, unknown>}
        onChange={(next) =>
          setLocalEntry({
            ...localEntry,
            ...(next as Record<string, unknown>),
          } as InboundEntry)
        }
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={() => onSave(localEntry)}>
          保存
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}
