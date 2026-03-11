/**
 * Inbounds 模块：类型与校验使用 @black-duty/sing-box-schema（Inbound），表单 UI 使用 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/inbound/
 */

import { Inbound } from "@black-duty/sing-box-schema"
import type { SchemaField } from "@/schemas/dnsSchema"
import { schemaLabel } from "@/lib/schemaZh"

/** 单条入站配置（与包 Inbound 解析结果兼容，用于 UI 编辑） */
export type InboundEntry = Record<string, unknown> & {
  type?: string
  tag?: string
  set_system_proxy?: boolean
  listen?: string
  listen_port?: number
  sniff?: boolean
  sniff_override_destination?: boolean
}

/** 入站列表类型（API 返回与保存的即为数组） */
export type InboundsConfig = InboundEntry[]

/** 默认单条 mixed 入站，对应 parts/inbounds.json 中一项 */
export const DEFAULT_INBOUND_ENTRY: InboundEntry = {
  type: "mixed",
  tag: "mixed_in",
  set_system_proxy: false,
  listen: "0.0.0.0",
  listen_port: 2081,
  sniff: true,
  sniff_override_destination: false,
}

/** 默认列表（与 parts/inbounds.json 一致） */
export const DEFAULT_INBOUNDS: InboundsConfig = [
  { ...DEFAULT_INBOUND_ENTRY, tag: "mixed_in_direct", listen_port: 2081 },
  { ...DEFAULT_INBOUND_ENTRY, tag: "mixed_in_proxy", listen_port: 2082 },
  { ...DEFAULT_INBOUND_ENTRY, tag: "mixed_in_rule", listen_port: 2083 },
]

function mergeOneEntry(raw: unknown): InboundEntry {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return { ...DEFAULT_INBOUND_ENTRY }
  const o = raw as Record<string, unknown>
  return {
    type: typeof o.type === "string" ? o.type : DEFAULT_INBOUND_ENTRY.type,
    tag: typeof o.tag === "string" ? o.tag : DEFAULT_INBOUND_ENTRY.tag,
    set_system_proxy:
      typeof o.set_system_proxy === "boolean"
        ? o.set_system_proxy
        : DEFAULT_INBOUND_ENTRY.set_system_proxy,
    listen: typeof o.listen === "string" ? o.listen : DEFAULT_INBOUND_ENTRY.listen,
    listen_port:
      typeof o.listen_port === "number"
        ? o.listen_port
        : DEFAULT_INBOUND_ENTRY.listen_port,
    sniff:
      typeof o.sniff === "boolean" ? o.sniff : DEFAULT_INBOUND_ENTRY.sniff,
    sniff_override_destination:
      typeof o.sniff_override_destination === "boolean"
        ? o.sniff_override_destination
        : DEFAULT_INBOUND_ENTRY.sniff_override_destination,
    ...o,
  }
}

/** 从 API 返回的 JSON 合并为 InboundsConfig */
export function mergeInboundsFromJson(obj: unknown): InboundsConfig {
  if (!Array.isArray(obj)) return [...DEFAULT_INBOUNDS]
  return obj.map(mergeOneEntry)
}

/** 使用 @black-duty/sing-box-schema 校验 inbounds 数组；保存前调用 */
export function validateInbounds(
  data: unknown
): { success: true; data: InboundsConfig } | { success: false; error: string } {
  if (!Array.isArray(data)) return { success: false, error: "入站配置应为数组" }
  for (let i = 0; i < data.length; i++) {
    const result = Inbound.safeParse(data[i])
    if (!result.success) {
      const issues =
        "issues" in result.error
          ? (result.error as {
              issues: { path: (string | number)[]; message: string }[]
            }).issues
          : []
      const first = issues[0]
      const msg = first
        ? `[${i}] ${first.path.length ? `${first.path.join(".")}: ` : ""}${first.message}`
        : result.error.message || "校验失败"
      return { success: false, error: msg }
    }
  }
  return { success: true, data: data as InboundsConfig }
}

// --- 单条入站表单 schema（mixed 常用字段，中文标签来自 schema.zh.json）---

export const INBOUND_ENTRY_SCHEMA: SchemaField[] = [
  {
    key: "type",
    path: "type",
    label: schemaLabel("MixedInboundOptions", ["type"], "类型", "type"),
    type: "select",
    options: [
      { value: "mixed", label: "mixed" },
      { value: "direct", label: "direct" },
      { value: "socks", label: "socks" },
      { value: "http", label: "http" },
      { value: "tun", label: "tun" },
      { value: "redirect", label: "redirect" },
    ],
    placeholder: "mixed",
  },
  {
    key: "tag",
    path: "tag",
    label: schemaLabel("MixedInboundOptions", ["tag"], "标签", "tag"),
    type: "string",
    placeholder: "入站唯一标识",
  },
  {
    key: "set_system_proxy",
    path: "set_system_proxy",
    label: schemaLabel("MixedInboundOptions", ["set_system_proxy"], "设置系统代理", "set_system_proxy"),
    type: "boolean",
  },
  {
    key: "listen",
    path: "listen",
    label: schemaLabel("MixedInboundOptions", ["listen"], "监听地址", "listen"),
    type: "string",
    placeholder: "0.0.0.0",
  },
  {
    key: "listen_port",
    path: "listen_port",
    label: schemaLabel("MixedInboundOptions", ["listen_port"], "监听端口", "listen_port"),
    type: "number",
    placeholder: "2081",
  },
  {
    key: "sniff",
    path: "sniff",
    label: schemaLabel("MixedInboundOptions", ["sniff"], "嗅探", "sniff"),
    type: "boolean",
  },
  {
    key: "sniff_override_destination",
    path: "sniff_override_destination",
    label: schemaLabel("MixedInboundOptions", ["sniff_override_destination"], "嗅探覆盖目标地址", "sniff_override_destination"),
    type: "boolean",
  },
]
