/**
 * Inbounds 模块：类型与校验使用 @black-duty/sing-box-schema（Inbound），表单 UI 按入站类型使用不同 schema。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/zh/configuration/inbound/
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

/** 从 API 返回的 JSON 转为 InboundsConfig（仅对非数组填默认值） */
export function mergeInboundsFromJson(obj: unknown): InboundsConfig {
  if (!Array.isArray(obj)) return [...DEFAULT_INBOUNDS]
  return obj.map((entry) =>
    entry && typeof entry === "object" && !Array.isArray(entry)
      ? { ...DEFAULT_INBOUND_ENTRY, ...(entry as Record<string, unknown>) } as InboundEntry
      : { ...DEFAULT_INBOUND_ENTRY }
  )
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

// --- 入站类型选项（与 https://sing-box.sagernet.org/zh/configuration/inbound/ 一致）---

export const INBOUND_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "direct", label: "direct" },
  { value: "mixed", label: "mixed" },
  { value: "socks", label: "socks" },
  { value: "http", label: "http" },
  { value: "shadowsocks", label: "shadowsocks" },
  { value: "vmess", label: "vmess" },
  { value: "trojan", label: "trojan" },
  { value: "naive", label: "naive" },
  { value: "hysteria", label: "hysteria" },
  { value: "shadowtls", label: "shadowtls" },
  { value: "tuic", label: "tuic" },
  { value: "hysteria2", label: "hysteria2" },
  { value: "vless", label: "vless" },
  { value: "anytls", label: "anytls" },
  { value: "tun", label: "tun" },
  { value: "redirect", label: "redirect" },
  { value: "tproxy", label: "tproxy" },
]

// --- 通用字段（listen / listen_port 等，多处复用）---

const listenField = (def: string): SchemaField => ({
  key: "listen",
  path: "listen",
  label: schemaLabel(def, ["listen"], "监听地址", "listen"),
  type: "string",
  placeholder: "0.0.0.0",
})
const listenPortField = (def: string): SchemaField => ({
  key: "listen_port",
  path: "listen_port",
  label: schemaLabel(def, ["listen_port"], "监听端口", "listen_port"),
  type: "number",
  placeholder: "2081",
})
const tagField = (def: string): SchemaField => ({
  key: "tag",
  path: "tag",
  label: schemaLabel(def, ["tag"], "标签", "tag"),
  type: "string",
  placeholder: "入站唯一标识",
})
const sniffField = (def: string): SchemaField => ({
  key: "sniff",
  path: "sniff",
  label: schemaLabel(def, ["sniff"], "嗅探", "sniff"),
  type: "boolean",
})
const sniffOverrideField = (def: string): SchemaField => ({
  key: "sniff_override_destination",
  path: "sniff_override_destination",
  label: schemaLabel(def, ["sniff_override_destination"], "嗅探覆盖目标地址", "sniff_override_destination"),
  type: "boolean",
})

// --- 按入站类型区分的表单 schema（参考 schema.zh.json 各 *InboundOptions）---

export const INBOUND_SCHEMA_BY_TYPE: Record<string, SchemaField[]> = {
  direct: [
    tagField("DirectInboundOptions"),
    {
      key: "network",
      path: "network",
      label: schemaLabel("DirectInboundOptions", ["network"], "监听的网络协议", "network"),
      type: "select",
      options: [
        { value: "tcp", label: "tcp" },
        { value: "udp", label: "udp" },
      ],
      placeholder: "默认全部",
    },
    {
      key: "override_address",
      path: "override_address",
      label: schemaLabel("DirectInboundOptions", ["override_address"], "覆盖连接目标地址", "override_address"),
      type: "string",
      placeholder: "",
    },
    {
      key: "override_port",
      path: "override_port",
      label: schemaLabel("DirectInboundOptions", ["override_port"], "覆盖连接目标端口", "override_port"),
      type: "number",
      placeholder: "",
    },
    listenField("DirectInboundOptions"),
    listenPortField("DirectInboundOptions"),
    sniffField("DirectInboundOptions"),
    sniffOverrideField("DirectInboundOptions"),
  ],
  mixed: [
    tagField("MixedInboundOptions"),
    {
      key: "set_system_proxy",
      path: "set_system_proxy",
      label: schemaLabel("MixedInboundOptions", ["set_system_proxy"], "设置系统代理", "set_system_proxy"),
      type: "boolean",
    },
    listenField("MixedInboundOptions"),
    listenPortField("MixedInboundOptions"),
    sniffField("MixedInboundOptions"),
    sniffOverrideField("MixedInboundOptions"),
  ],
  socks: [
    tagField("SocksInboundOptions"),
    listenField("SocksInboundOptions"),
    listenPortField("SocksInboundOptions"),
    sniffField("SocksInboundOptions"),
    sniffOverrideField("SocksInboundOptions"),
  ],
  http: [
    tagField("HTTPInboundOptions"),
    {
      key: "set_system_proxy",
      path: "set_system_proxy",
      label: schemaLabel("HTTPInboundOptions", ["set_system_proxy"], "设置系统代理", "set_system_proxy"),
      type: "boolean",
    },
    listenField("HTTPInboundOptions"),
    listenPortField("HTTPInboundOptions"),
    sniffField("HTTPInboundOptions"),
    sniffOverrideField("HTTPInboundOptions"),
  ],
  shadowsocks: [
    tagField("ShadowsocksInboundOptions"),
    {
      key: "network",
      path: "network",
      label: schemaLabel("ShadowsocksInboundOptions", ["network"], "监听的网络协议", "network"),
      type: "select",
      options: [
        { value: "tcp", label: "tcp" },
        { value: "udp", label: "udp" },
      ],
      placeholder: "默认同时启用",
    },
    {
      key: "method",
      path: "method",
      label: schemaLabel("ShadowsocksInboundOptions", ["method"], "加密方法", "method"),
      type: "string",
      placeholder: "如 2022-blake3-aes-128-gcm",
    },
    {
      key: "password",
      path: "password",
      label: schemaLabel("ShadowsocksInboundOptions", ["password"], "Shadowsocks 密码", "password"),
      type: "password",
      placeholder: "2022 系列需 base64 密钥",
    },
    {
      key: "managed",
      path: "managed",
      label: schemaLabel("ShadowsocksInboundOptions", ["managed"], "SSM API 动态管理用户", "managed"),
      type: "boolean",
    },
    listenField("ShadowsocksInboundOptions"),
    listenPortField("ShadowsocksInboundOptions"),
    sniffField("ShadowsocksInboundOptions"),
    sniffOverrideField("ShadowsocksInboundOptions"),
  ],
  vmess: [
    tagField("VMessInboundOptions"),
    listenField("VMessInboundOptions"),
    listenPortField("VMessInboundOptions"),
    sniffField("VMessInboundOptions"),
    sniffOverrideField("VMessInboundOptions"),
  ],
  trojan: [
    tagField("TrojanInboundOptions"),
    listenField("TrojanInboundOptions"),
    listenPortField("TrojanInboundOptions"),
    sniffField("TrojanInboundOptions"),
    sniffOverrideField("TrojanInboundOptions"),
  ],
  naive: [
    tagField("NaiveInboundOptions"),
    listenField("NaiveInboundOptions"),
    listenPortField("NaiveInboundOptions"),
  ],
  hysteria: [
    tagField("HysteriaInboundOptions"),
    listenField("HysteriaInboundOptions"),
    listenPortField("HysteriaInboundOptions"),
  ],
  shadowtls: [
    tagField("ShadowTLSInboundOptions"),
    listenField("ShadowTLSInboundOptions"),
    listenPortField("ShadowTLSInboundOptions"),
  ],
  tuic: [
    tagField("TUICInboundOptions"),
    listenField("TUICInboundOptions"),
    listenPortField("TUICInboundOptions"),
  ],
  hysteria2: [
    tagField("Hysteria2InboundOptions"),
    listenField("Hysteria2InboundOptions"),
    listenPortField("Hysteria2InboundOptions"),
  ],
  vless: [
    tagField("VLESSInboundOptions"),
    listenField("VLESSInboundOptions"),
    listenPortField("VLESSInboundOptions"),
  ],
  anytls: [
    tagField("AnyTLSInboundOptions"),
    listenField("AnyTLSInboundOptions"),
    listenPortField("AnyTLSInboundOptions"),
  ],
  tun: [
    tagField("TunInboundOptions"),
    {
      key: "interface_name",
      path: "interface_name",
      label: schemaLabel("TunInboundOptions", ["interface_name"], "虚拟设备名称", "interface_name"),
      type: "string",
      placeholder: "默认自动选择",
    },
    {
      key: "address",
      path: "address",
      label: schemaLabel("TunInboundOptions", ["address"], "tun 接口的 IPv4/IPv6 前缀", "address"),
      type: "array",
      placeholder: "如 172.19.0.1/30",
    },
    {
      key: "mtu",
      path: "mtu",
      label: schemaLabel("TunInboundOptions", ["mtu"], "最大传输单元", "mtu"),
      type: "number",
      placeholder: "",
    },
    {
      key: "auto_route",
      path: "auto_route",
      label: schemaLabel("TunInboundOptions", ["auto_route"], "设置到 Tun 的默认路由", "auto_route"),
      type: "boolean",
    },
    {
      key: "stack",
      path: "stack",
      label: schemaLabel("TunInboundOptions", ["stack"], "TCP/IP 栈", "stack"),
      type: "select",
      options: [
        { value: "system", label: "system" },
        { value: "gvisor", label: "gvisor" },
        { value: "mixed", label: "mixed" },
      ],
    },
    listenField("TunInboundOptions"),
    listenPortField("TunInboundOptions"),
    sniffField("TunInboundOptions"),
    sniffOverrideField("TunInboundOptions"),
  ],
  redirect: [
    tagField("RedirectInboundOptions"),
    listenField("RedirectInboundOptions"),
    listenPortField("RedirectInboundOptions"),
    sniffField("RedirectInboundOptions"),
    sniffOverrideField("RedirectInboundOptions"),
  ],
  tproxy: [
    tagField("TProxyInboundOptions"),
    {
      key: "network",
      path: "network",
      label: schemaLabel("TProxyInboundOptions", ["network"], "监听的网络协议", "network"),
      type: "select",
      options: [
        { value: "tcp", label: "tcp" },
        { value: "udp", label: "udp" },
      ],
      placeholder: "默认所有",
    },
    listenField("TProxyInboundOptions"),
    listenPortField("TProxyInboundOptions"),
    sniffField("TProxyInboundOptions"),
    sniffOverrideField("TProxyInboundOptions"),
  ],
}

/** 根据入站类型返回完整表单 schema：type 选择 + tag + 该类型专属字段 */
export function getInboundSchemaForType(type: string): SchemaField[] {
  const typeField: SchemaField = {
    key: "type",
    path: "type",
    label: schemaLabel("MixedInboundOptions", ["type"], "类型", "type"),
    type: "select",
    options: INBOUND_TYPE_OPTIONS,
    placeholder: "mixed",
  }
  const typeFields = INBOUND_SCHEMA_BY_TYPE[type] ?? INBOUND_SCHEMA_BY_TYPE.mixed
  return [typeField, ...typeFields]
}

// --- 兼容：默认使用 mixed 的完整 schema ---

export const INBOUND_ENTRY_SCHEMA: SchemaField[] = getInboundSchemaForType("mixed")
