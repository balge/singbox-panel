/**
 * Outbounds 模块：类型与校验使用 @black-duty/sing-box-schema（Outbound），列表 + JSON 编辑。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/outbound/
 */

import { Outbound } from "@black-duty/sing-box-schema"

/** 单条出站配置（与包 Outbound 解析结果兼容） */
export type OutboundEntry = Record<string, unknown> & {
  type?: string
  tag?: string
}

/** 出站列表类型（API 返回与保存的即为数组） */
export type OutboundsConfig = OutboundEntry[]

/** 默认单条 direct 出站 */
export const DEFAULT_OUTBOUND_ENTRY: OutboundEntry = {
  type: "direct",
  tag: "direct_out",
}

/** 默认空列表 */
export const DEFAULT_OUTBOUNDS: OutboundsConfig = []

/** 从 API 返回的 JSON 转为 OutboundsConfig（仅对非数组填默认值） */
export function mergeOutboundsFromJson(obj: unknown): OutboundsConfig {
  if (!Array.isArray(obj)) return [...DEFAULT_OUTBOUNDS]
  return obj.map((entry) =>
    entry && typeof entry === "object" && !Array.isArray(entry)
      ? { ...DEFAULT_OUTBOUND_ENTRY, ...(entry as Record<string, unknown>) } as OutboundEntry
      : { ...DEFAULT_OUTBOUND_ENTRY }
  )
}

/** 使用 @black-duty/sing-box-schema 校验 outbounds 数组；保存前调用 */
export function validateOutbounds(
  data: unknown
): { success: true; data: OutboundsConfig } | { success: false; error: string } {
  if (!Array.isArray(data)) return { success: false, error: "出站配置应为数组" }
  for (let i = 0; i < data.length; i++) {
    const result = Outbound.safeParse(data[i])
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
  return { success: true, data: data as OutboundsConfig }
}
