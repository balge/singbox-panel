/**
 * 从 @black-duty/sing-box-schema 的 schema.zh.json 读取 description 作为表单 label。
 * 升级包后无需改中文文案，由包的 description 驱动。
 */

import schemaZh from "@black-duty/sing-box-schema/schema.zh.json";

type Defs = Record<
  string,
  { properties?: Record<string, unknown>; description?: string }
>;

const defs: Defs = (schemaZh as { $defs?: Defs }).$defs ?? {};

/**
 * 根据 $defs 与属性路径解析出 description。
 * @param rootDef 顶层定义名，如 "DNSOptions"、"ExperimentalOptions"
 * @param path 属性路径，如 ["final"]、["cache_file", "enabled"]、["v2ray_api", "stats", "enabled"]
 */
export function getDescriptionZh(rootDef: string, ...path: string[]): string {
  let current: unknown = defs[rootDef];
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (!current || typeof current !== "object" || !("properties" in current))
      return "";
    const props = (current as { properties?: Record<string, unknown> })
      .properties;
    if (!props || !(key in props)) return "";
    const prop = props[key] as Record<string, unknown>;
    if (prop && typeof prop.$ref === "string") {
      const refName = String(prop.$ref).replace("#/$defs/", "");
      current = defs[refName];
      continue;
    }
    if (i === path.length - 1 && prop && typeof prop.description === "string") {
      return prop.description;
    }
    if (prop && typeof prop === "object" && "properties" in prop) {
      current = prop;
    } else {
      return "";
    }
  }
  return "";
}

function defDesc(defName: string): string {
  const d = defs[defName];
  return d && typeof d.description === "string" ? d.description : "";
}

/** 表单 label：优先用包的 description，否则用 fallback，可选追加（英文字段名） */
export function schemaLabel(
  rootDef: string,
  path: string[],
  fallback: string,
  enKey?: string,
): string {
  const desc = getDescriptionZh(rootDef, ...path);
  const base = desc || fallback;
  return enKey ? `${base}（${enKey}）` : base;
}

// --- 供 DNS servers / rules 表单 label 参考（来自 schema.zh.json）---

/** DNS 服务器列表区块标题 */
export const DNS_SERVERS_LABEL = schemaLabel(
  "DNSOptions",
  ["servers"],
  "DNS 服务器",
  "servers",
);

/** DNS 规则列表区块标题 */
export const DNS_RULES_LABEL = schemaLabel(
  "DNSOptions",
  ["rules"],
  "DNS 规则",
  "rules",
);

/** DNS 规则表单字段 label（rule 的 server 在 schema 中为内联描述；outbound 已废弃，使用 action） */
export const DNS_RULE_FIELD_LABELS = {
  server: "目标服务器的标签（route 时必填）（server）",
  clash_mode: `${defDesc("__schema64") || "匹配 Clash 模式"}（clash_mode）`,
  rule_set: `${defDesc("__schema73") || "匹配规则集"}（rule_set，每行一项）`,
  package_name: `${defDesc("__schema61") || "匹配 Android 应用包名"}（package_name，每行一项）`,
  /** 规则动作（rule_action） */
  action: "规则动作（action）",
  action_route: "route（路由到服务器）",
  action_route_options: "route-options（路由选项）",
  action_reject: "reject（拒绝）",
  action_predefined: "predefined（预定义响应）",
  action_server: "目标服务器（server）",
  action_strategy: "域名策略（strategy）",
  action_disable_cache: "禁用缓存（disable_cache）",
  action_rewrite_ttl: "重写 TTL（rewrite_ttl）",
  action_client_subnet: "客户端子网（client_subnet）",
  action_method: "拒绝方式（method）",
  action_no_drop: "no_drop",
  action_rcode: "响应码（rcode）",
  action_answer: "answer（每行一条）",
  action_ns: "ns（每行一条）",
  action_extra: "extra（每行一条）",
};
