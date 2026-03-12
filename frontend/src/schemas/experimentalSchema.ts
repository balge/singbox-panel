/**
 * Experimental 模块：类型与校验使用 @black-duty/sing-box-schema，表单 UI 使用 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/zh/configuration/experimental/
 */

import {
  ExperimentalOptions,
  type ExperimentalOptions as ExperimentalConfigSchema,
} from "@black-duty/sing-box-schema"
import type { SchemaField } from "@/schemas/dnsSchema"
import { schemaLabel } from "@/lib/schemaZh"

/** 实验功能配置类型（与包一致） */
export type ExperimentalConfig = ExperimentalConfigSchema

/** 默认配置 */
export const DEFAULT_EXPERIMENTAL: ExperimentalConfig = {
  cache_file: {
    enabled: true,
    path: "",
    cache_id: "",
    store_fakeip: false,
    store_rdrc: false,
    rdrc_timeout: "7d",
  },
  clash_api: {
    external_controller: "127.0.0.1:9090",
    external_ui: "",
    external_ui_download_url: "",
    external_ui_download_detour: "",
    secret: "",
    default_mode: "Rule",
    access_control_allow_origin: [],
    access_control_allow_private_network: false,
  },
  v2ray_api: {
    listen: "",
    stats: {
      enabled: false,
      inbounds: [],
      outbounds: [],
      users: [],
    },
  },
}

/** 从 API 返回的 JSON 转为 ExperimentalConfig（仅对缺失键填默认值） */
export function mergeExperimentalFromJson(obj: unknown): ExperimentalConfig {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return { ...DEFAULT_EXPERIMENTAL }
  const o = obj as Record<string, unknown>
  const cache_file = o.cache_file && typeof o.cache_file === "object" && !Array.isArray(o.cache_file)
    ? { ...DEFAULT_EXPERIMENTAL.cache_file, ...(o.cache_file as Record<string, unknown>) }
    : DEFAULT_EXPERIMENTAL.cache_file
  const clash_api = o.clash_api && typeof o.clash_api === "object" && !Array.isArray(o.clash_api)
    ? { ...DEFAULT_EXPERIMENTAL.clash_api, ...(o.clash_api as Record<string, unknown>) }
    : DEFAULT_EXPERIMENTAL.clash_api
  const v2ray_api = o.v2ray_api && typeof o.v2ray_api === "object" && !Array.isArray(o.v2ray_api)
    ? {
        ...DEFAULT_EXPERIMENTAL.v2ray_api,
        ...(o.v2ray_api as Record<string, unknown>),
        stats:
          (o.v2ray_api as Record<string, unknown>).stats &&
          typeof (o.v2ray_api as Record<string, unknown>).stats === "object" &&
          !Array.isArray((o.v2ray_api as Record<string, unknown>).stats)
            ? {
                ...DEFAULT_EXPERIMENTAL.v2ray_api?.stats,
                ...((o.v2ray_api as Record<string, unknown>).stats as Record<string, unknown>),
              }
            : DEFAULT_EXPERIMENTAL.v2ray_api?.stats,
      }
    : DEFAULT_EXPERIMENTAL.v2ray_api
  return { cache_file, clash_api, v2ray_api } as ExperimentalConfig
}

/** 使用 @black-duty/sing-box-schema 校验 experimental 配置；保存前调用 */
export function validateExperimental(
  data: unknown
):
  | { success: true; data: ExperimentalConfig }
  | { success: false; error: string } {
  const result = ExperimentalOptions.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  const issues =
    "issues" in result.error
      ? (result.error as {
          issues: { path: (string | number)[]; message: string }[]
        }).issues
      : []
  const first = issues[0]
  const msg = first
    ? `${first.path.length ? `${first.path.join(".")}: ` : ""}${first.message}`
    : result.error.message || "校验失败"
  return { success: false, error: msg }
}

// --- 表单 schema（中文标签 + 英文字段名）---

/** cache_file 区块 */
export const CACHE_FILE_SCHEMA: SchemaField[] = [
  {
    key: "enabled",
    path: "cache_file.enabled",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "enabled"], "启用", "enabled"),
    type: "boolean",
  },
  {
    key: "path",
    path: "cache_file.path",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "path"], "缓存文件路径", "path"),
    type: "string",
    placeholder: "默认 cache.db",
  },
  {
    key: "cache_id",
    path: "cache_file.cache_id",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "cache_id"], "缓存标识", "cache_id"),
    type: "string",
    placeholder: "留空则使用默认存储",
  },
  {
    key: "store_fakeip",
    path: "cache_file.store_fakeip",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "store_fakeip"], "存储 FakeIP", "store_fakeip"),
    type: "boolean",
  },
  {
    key: "store_rdrc",
    path: "cache_file.store_rdrc",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "store_rdrc"], "存储拒绝的 DNS 响应缓存", "store_rdrc"),
    type: "boolean",
  },
  {
    key: "rdrc_timeout",
    path: "cache_file.rdrc_timeout",
    label: schemaLabel("ExperimentalOptions", ["cache_file", "rdrc_timeout"], "拒绝的 DNS 响应缓存超时", "rdrc_timeout"),
    type: "select",
    options: [
      { value: "1d", label: "1d" },
      { value: "5d", label: "5d" },
      { value: "7d", label: "7d" },
      { value: "15d", label: "15d" },
      { value: "30d", label: "30d" },
    ],
    placeholder: "默认 7 天",
  },
]

/** clash_api 区块 */
export const CLASH_API_SCHEMA: SchemaField[] = [
  {
    key: "external_controller",
    path: "clash_api.external_controller",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "external_controller"], "RESTful API 监听地址", "external_controller"),
    type: "string",
    placeholder: "例如 127.0.0.1:9090，为空则禁用",
  },
  {
    key: "external_ui",
    path: "clash_api.external_ui",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "external_ui"], "静态网页资源目录", "external_ui"),
    type: "string",
    placeholder: "相对或绝对路径",
  },
  {
    key: "external_ui_download_url",
    path: "clash_api.external_ui_download_url",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "external_ui_download_url"], "静态资源 ZIP 下载地址", "external_ui_download_url"),
    type: "string",
    placeholder: "external_ui 为空时使用",
  },
  {
    key: "external_ui_download_detour",
    path: "clash_api.external_ui_download_detour",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "external_ui_download_detour"], "下载静态资源使用的出站", "external_ui_download_detour"),
    type: "string",
    placeholder: "留空则使用默认出站",
  },
  {
    key: "secret",
    path: "clash_api.secret",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "secret"], "API 密钥", "secret"),
    type: "password",
    placeholder: "可选，监听 0.0.0.0 时建议设置",
  },
  {
    key: "default_mode",
    path: "clash_api.default_mode",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "default_mode"], "默认模式", "default_mode"),
    type: "select",
    options: [{ value: "Rule", label: "Rule" }],
    placeholder: "默认 Rule",
  },
  {
    key: "access_control_allow_origin",
    path: "clash_api.access_control_allow_origin",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "access_control_allow_origin"], "允许的 CORS 来源", "access_control_allow_origin"),
    type: "array",
    placeholder: "每行一个来源，例如 http://127.0.0.1",
  },
  {
    key: "access_control_allow_private_network",
    path: "clash_api.access_control_allow_private_network",
    label: schemaLabel("ExperimentalOptions", ["clash_api", "access_control_allow_private_network"], "允许从私有网络访问", "access_control_allow_private_network"),
    type: "boolean",
  },
]

/** v2ray_api 顶层 */
export const V2RAY_API_SCHEMA: SchemaField[] = [
  {
    key: "listen",
    path: "v2ray_api.listen",
    label: schemaLabel("ExperimentalOptions", ["v2ray_api", "listen"], "gRPC API 监听地址", "listen"),
    type: "string",
    placeholder: "例如 127.0.0.1:8080，为空则禁用",
  },
]

/** v2ray_api.stats 子区块 */
export const V2RAY_STATS_SCHEMA: SchemaField[] = [
  {
    key: "enabled",
    path: "v2ray_api.stats.enabled",
    label: schemaLabel("ExperimentalOptions", ["v2ray_api", "stats", "enabled"], "启用统计", "enabled"),
    type: "boolean",
  },
  {
    key: "inbounds",
    path: "v2ray_api.stats.inbounds",
    label: schemaLabel("ExperimentalOptions", ["v2ray_api", "stats", "inbounds"], "统计流量的入站列表", "inbounds"),
    type: "array",
    placeholder: "每行一个入站 tag",
  },
  {
    key: "outbounds",
    path: "v2ray_api.stats.outbounds",
    label: schemaLabel("ExperimentalOptions", ["v2ray_api", "stats", "outbounds"], "统计流量的出站列表", "outbounds"),
    type: "array",
    placeholder: "每行一个出站 tag",
  },
  {
    key: "users",
    path: "v2ray_api.stats.users",
    label: schemaLabel("ExperimentalOptions", ["v2ray_api", "stats", "users"], "统计流量的用户列表", "users"),
    type: "array",
    placeholder: "每行一个用户名",
  },
]
