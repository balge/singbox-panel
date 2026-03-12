/**
 * NTP 模块：类型与校验使用 @black-duty/sing-box-schema，表单 UI 使用 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/ntp/
 */

import {
  NTPOptions,
  type NTPOptions as NtpConfigSchema,
} from "@black-duty/sing-box-schema"
import type { SchemaField } from "@/schemas/dnsSchema"
import { schemaLabel } from "@/lib/schemaZh"

/** NTP 配置类型（与包一致） */
export type NtpConfig = NtpConfigSchema

/** 默认配置，对应 parts/ntp.json */
export const DEFAULT_NTP: NtpConfig = {
  enabled: false,
  server: "time.apple.com",
  server_port: 123,
  interval: "30m",
}

/** 从 API 返回的 JSON 转为 NtpConfig（仅对缺失键填默认值） */
export function mergeNtpFromJson(obj: unknown): NtpConfig {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return { ...DEFAULT_NTP }
  return { ...DEFAULT_NTP, ...(obj as Record<string, unknown>) } as NtpConfig
}

/** 使用 @black-duty/sing-box-schema 校验 ntp 配置；保存前调用 */
export function validateNtp(
  data: unknown
): { success: true; data: NtpConfig } | { success: false; error: string } {
  const result = NTPOptions.safeParse(data)
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

// --- 表单 schema（中文标签）---

export const NTP_SCHEMA: SchemaField[] = [
  {
    key: "enabled",
    path: "enabled",
    label: schemaLabel("NTPOptions", ["enabled"], "启用 NTP 服务", "enabled"),
    type: "boolean",
  },
  {
    key: "server",
    path: "server",
    label: schemaLabel("NTPOptions", ["server"], "NTP 服务器地址", "server"),
    type: "string",
    placeholder: "如 time.apple.com",
  },
  {
    key: "server_port",
    path: "server_port",
    label: schemaLabel("NTPOptions", ["server_port"], "NTP 端口", "server_port"),
    type: "number",
    placeholder: "默认 123",
  },
  {
    key: "interval",
    path: "interval",
    label: schemaLabel("NTPOptions", ["interval"], "同步间隔", "interval"),
    type: "string",
    placeholder: "如 30m、1h",
  },
]
