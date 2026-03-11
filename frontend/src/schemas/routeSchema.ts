/**
 * Route 模块：类型与校验使用 @black-duty/sing-box-schema，表单 UI 使用 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/route/
 */

import {
  RouteOptions,
  type RouteOptions as RouteConfigSchema,
} from "@black-duty/sing-box-schema"
import type { SchemaField } from "@/schemas/dnsSchema"
import { schemaLabel } from "@/lib/schemaZh"

/** 路由配置类型（与包一致） */
export type RouteConfig = RouteConfigSchema

/** 默认配置，对应 parts/route.json 顶层 */
export const DEFAULT_ROUTE: RouteConfig = {
  final: "select",
  rules: [],
  rule_set: [],
}

/** 从 API 返回的 JSON 合并为 RouteConfig */
export function mergeRouteFromJson(obj: unknown): RouteConfig {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return { ...DEFAULT_ROUTE }
  const o = obj as Record<string, unknown>
  return {
    final: typeof o.final === "string" ? o.final : DEFAULT_ROUTE.final,
    rules: Array.isArray(o.rules) ? o.rules : DEFAULT_ROUTE.rules ?? [],
    rule_set: Array.isArray(o.rule_set) ? o.rule_set : DEFAULT_ROUTE.rule_set ?? [],
  }
}

/** 使用 @black-duty/sing-box-schema 校验 route 配置；保存前调用 */
export function validateRoute(
  data: unknown
): { success: true; data: RouteConfig } | { success: false; error: string } {
  const result = RouteOptions.safeParse(data)
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

// --- 表单 schema：仅默认出站 final ---

export const ROUTE_FINAL_SCHEMA: SchemaField[] = [
  {
    key: "final",
    path: "final",
    label: schemaLabel("RouteOptions", ["final"], "默认出站", "final"),
    type: "string",
    placeholder: "如 select、direct_out",
  },
]
