/**
 * Log 模块：类型与校验使用 @black-duty/sing-box-schema，表单 UI 使用 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/log/
 */

import {
  LogOptions,
  type LogOptions as LogConfigSchema,
} from "@black-duty/sing-box-schema"
import type { SchemaField } from "@/schemas/dnsSchema"
import { schemaLabel } from "@/lib/schemaZh"

/** 日志配置类型（与包一致） */
export type LogConfig = LogConfigSchema

/** 默认配置，对应 parts/log.json */
export const DEFAULT_LOG: LogConfig = {
  disabled: false,
  level: "debug",
  output: "/logs/sing-box.log",
  timestamp: true,
}

const LOG_LEVEL_OPTIONS = [
  { value: "trace", label: "trace" },
  { value: "debug", label: "debug" },
  { value: "info", label: "info" },
  { value: "warn", label: "warn" },
  { value: "error", label: "error" },
  { value: "fatal", label: "fatal" },
  { value: "panic", label: "panic" },
] as const

/** 从 API 返回的 JSON 合并为 LogConfig */
export function mergeLogFromJson(obj: unknown): LogConfig {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return { ...DEFAULT_LOG }
  const o = obj as Record<string, unknown>
  return {
    disabled:
      typeof o.disabled === "boolean" ? o.disabled : DEFAULT_LOG.disabled,
    level:
      typeof o.level === "string" && LOG_LEVEL_OPTIONS.some((opt) => opt.value === o.level)
        ? (o.level as LogConfig["level"])
        : DEFAULT_LOG.level,
    output: typeof o.output === "string" ? o.output : DEFAULT_LOG.output,
    timestamp:
      typeof o.timestamp === "boolean" ? o.timestamp : DEFAULT_LOG.timestamp,
  }
}

/** 使用 @black-duty/sing-box-schema 校验 log 配置；保存前调用 */
export function validateLog(
  data: unknown
): { success: true; data: LogConfig } | { success: false; error: string } {
  const result = LogOptions.safeParse(data)
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

// --- 表单 schema（中文标签来自 schema.zh.json）---

export const LOG_SCHEMA: SchemaField[] = [
  {
    key: "disabled",
    path: "disabled",
    label: schemaLabel("LogOptions", ["disabled"], "禁用日志", "disabled"),
    type: "boolean",
  },
  {
    key: "level",
    path: "level",
    label: schemaLabel("LogOptions", ["level"], "日志等级", "level"),
    type: "select",
    options: [...LOG_LEVEL_OPTIONS],
    placeholder: "trace / debug / info 等",
  },
  {
    key: "output",
    path: "output",
    label: schemaLabel("LogOptions", ["output"], "输出文件路径", "output"),
    type: "string",
    placeholder: "留空则输出到控制台",
  },
  {
    key: "timestamp",
    path: "timestamp",
    label: schemaLabel("LogOptions", ["timestamp"], "每行添加时间", "timestamp"),
    type: "boolean",
  },
]
