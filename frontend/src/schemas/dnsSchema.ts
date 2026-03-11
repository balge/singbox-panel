/**
 * DNS 模块：类型与校验使用 @black-duty/sing-box-schema，表单 UI 使用本地 schema 描述。
 * @see https://github.com/BlackDuty/sing-box-schema
 * @see https://sing-box.sagernet.org/configuration/dns/
 */

import {
  DNSOptions,
  type DNSOptions as DnsConfigSchema,
} from "@black-duty/sing-box-schema";
import { schemaLabel } from "@/lib/schemaZh";

/** 顶层 DNS 配置类型（与包一致，用于校验结果） */
export type DnsConfig = DnsConfigSchema;

/** 表单/列表用的 DNS 服务器项（兼容 legacy tag+address 等），与包内 DnsServer 兼容 */
export type DnsServer = Record<string, unknown> & {
  tag?: string;
  address?: string;
  address_resolver?: string;
  strategy?: string;
  detour?: string;
};

/** 表单/列表用的 DNS 规则项，与包内 DnsRule 兼容；outbound 已废弃（1.12.0），使用 action（rule_action） */
export type DnsRule = Record<string, unknown> & {
  server?: string;
  clash_mode?: string;
  rule_set?: string[];
  package_name?: string[];
  /** 规则动作：route（含 server/strategy 等）、route-options、reject、predefined */
  action?: DnsRuleAction;
};

/** DNS 规则动作：route | route-options | reject | predefined（见 https://sing-box.sagernet.org/configuration/dns/rule_action/） */
export type DnsRuleAction =
  | {
      action: "route";
      server: string;
      strategy?: string;
      disable_cache?: boolean;
      rewrite_ttl?: number | null;
      client_subnet?: string | null;
    }
  | {
      action: "route-options";
      disable_cache?: boolean;
      rewrite_ttl?: number | null;
      client_subnet?: string | null;
    }
  | {
      action: "reject";
      method?: "default" | "drop";
      no_drop?: boolean;
    }
  | {
      action: "predefined";
      rcode?: string;
      answer?: string[];
      ns?: string[];
      extra?: string[];
    };

/** 页面 state 与 merge 使用的类型（servers/rules 为 UI 可编辑形状） */
export type DnsConfigState = Omit<DnsConfig, "servers" | "rules"> & {
  servers?: DnsServer[];
  rules?: DnsRule[];
};

/** Legacy fakeip 子结构（DNSOptions.fakeip） */
export type DnsFakeip = NonNullable<DnsConfig["fakeip"]>;

/** 用于 strategy 等 select 的“空”选项；Radix Select 不允许 SelectItem value 为空字符串 */
export const SELECT_EMPTY_VALUE = "__empty__"

const STRATEGY_OPTIONS = [
  { value: SELECT_EMPTY_VALUE, label: "（空）" },
  { value: "prefer_ipv4", label: "prefer_ipv4" },
  { value: "prefer_ipv6", label: "prefer_ipv6" },
  { value: "ipv4_only", label: "ipv4_only" },
  { value: "ipv6_only", label: "ipv6_only" },
] as const;

// --- 表单渲染用 schema（中文标签 + 字段名），与 sing-box 文档一致 ---

export type SchemaFieldBase = {
  key: string;
  label: string;
  path?: string;
};

export type SchemaField =
  | (SchemaFieldBase & { type: "string"; placeholder?: string })
  | (SchemaFieldBase & { type: "number"; placeholder?: string })
  | (SchemaFieldBase & { type: "boolean" })
  | (SchemaFieldBase & {
      type: "select";
      options: { value: string; label?: string }[];
      placeholder?: string;
    })
  | (SchemaFieldBase & { type: "array"; placeholder?: string })
  | (SchemaFieldBase & { type: "password"; placeholder?: string });

function pathKey(p: string): string {
  return p || "";
}

/** 顶层 DNS 表单 schema（final, strategy, disable_cache 等） */
export const DNS_TOP_SCHEMA: SchemaField[] = [
  {
    key: "final",
    path: "final",
    label: schemaLabel("DNSOptions", ["final"], "默认 DNS 服务器 tag", "final"),
    type: "string",
    placeholder: "留空则使用第一个 server",
  },
  {
    key: "strategy",
    path: "strategy",
    label: schemaLabel("DNSOptions", ["strategy"], "默认解析策略", "strategy"),
    type: "select",
    options: [...STRATEGY_OPTIONS],
  },
  {
    key: "disable_cache",
    path: "disable_cache",
    label: schemaLabel("DNSOptions", ["disable_cache"], "禁用 DNS 缓存", "disable_cache"),
    type: "boolean",
  },
  {
    key: "disable_expire",
    path: "disable_expire",
    label: schemaLabel("DNSOptions", ["disable_expire"], "禁用缓存过期", "disable_expire"),
    type: "boolean",
  },
  {
    key: "independent_cache",
    path: "independent_cache",
    label: schemaLabel("DNSOptions", ["independent_cache"], "各 DNS 独立缓存", "independent_cache"),
    type: "boolean",
  },
  {
    key: "cache_capacity",
    path: "cache_capacity",
    label: schemaLabel("DNSOptions", ["cache_capacity"], "LRU 缓存容量（≥1024）", "cache_capacity"),
    type: "number",
    placeholder: "0 表示忽略",
  },
  {
    key: "reverse_mapping",
    path: "reverse_mapping",
    label: schemaLabel("DNSOptions", ["reverse_mapping"], "反向 IP 映射", "reverse_mapping"),
    type: "boolean",
  },
  {
    key: "client_subnet",
    path: "client_subnet",
    label: schemaLabel("DNSOptions", ["client_subnet"], "EDNS Client Subnet", "client_subnet"),
    type: "string",
    placeholder: "如 0.0.0.0/0",
  },
];

/** fakeip 子表单 schema */
export const DNS_FAKEIP_SCHEMA: SchemaField[] = [
  {
    key: "enabled",
    path: "fakeip.enabled",
    label: schemaLabel("DNSOptions", ["fakeip", "enabled"], "启用 FakeIP", "enabled"),
    type: "boolean",
  },
  {
    key: "inet4_range",
    path: "fakeip.inet4_range",
    label: schemaLabel("DNSOptions", ["fakeip", "inet4_range"], "FakeIP IPv4 段", "inet4_range"),
    type: "string",
    placeholder: "如 198.18.0.0/15",
  },
  {
    key: "inet6_range",
    path: "fakeip.inet6_range",
    label: schemaLabel("DNSOptions", ["fakeip", "inet6_range"], "FakeIP IPv6 段", "inet6_range"),
    type: "string",
    placeholder: "如 fd00::/108",
  },
];

/** 默认 DNS 配置（用于空数据与合并） */
export const DEFAULT_DNS: DnsConfigState = {
  servers: [],
  rules: [],
  final: "",
  strategy: "prefer_ipv4",
  disable_cache: false,
  disable_expire: false,
  independent_cache: false,
  cache_capacity: 0,
  reverse_mapping: false,
  client_subnet: "",
  fakeip: {
    enabled: false,
    inet4_range: "198.18.0.0/15",
    inet6_range: "fd00::/108",
  },
};

/** 从 API 返回的 JSON 合并为 DnsConfigState（填充默认、兼容不完整数据） */
export function mergeDnsFromJson(obj: unknown): DnsConfigState {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ...DEFAULT_DNS };
  }
  const o = obj as Record<string, unknown>;
  const servers: DnsServer[] = Array.isArray(o.servers)
    ? (o.servers as DnsServer[]).map((s) => ({ ...s }))
    : (DEFAULT_DNS.servers ?? []);
  const rules: DnsRule[] = Array.isArray(o.rules)
    ? (o.rules as DnsRule[]).map((r) => {
        const { outbound: _out, ...rest } = r as Record<string, unknown>;
        return {
          ...rest,
          rule_set: Array.isArray(rest.rule_set)
            ? [...(rest.rule_set as string[])]
            : undefined,
          package_name: Array.isArray(rest.package_name)
            ? [...(rest.package_name as string[])]
            : undefined,
        } as DnsRule;
      })
    : (DEFAULT_DNS.rules ?? []);
  const fakeipRaw = o.fakeip;
  const fakeip: DnsFakeip =
    fakeipRaw && typeof fakeipRaw === "object" && !Array.isArray(fakeipRaw)
      ? {
          enabled:
            typeof (fakeipRaw as Record<string, unknown>).enabled === "boolean"
              ? ((fakeipRaw as Record<string, unknown>).enabled as boolean)
              : (DEFAULT_DNS.fakeip?.enabled ?? false),
          inet4_range:
            typeof (fakeipRaw as Record<string, unknown>).inet4_range ===
            "string"
              ? ((fakeipRaw as Record<string, unknown>).inet4_range as string)
              : (DEFAULT_DNS.fakeip?.inet4_range ?? ""),
          inet6_range:
            typeof (fakeipRaw as Record<string, unknown>).inet6_range ===
            "string"
              ? ((fakeipRaw as Record<string, unknown>).inet6_range as string)
              : (DEFAULT_DNS.fakeip?.inet6_range ?? ""),
        }
      : { ...DEFAULT_DNS.fakeip };

  return {
    servers,
    rules,
    final: typeof o.final === "string" ? o.final : DEFAULT_DNS.final,
    strategy:
      typeof o.strategy === "string" && o.strategy !== "" &&
      STRATEGY_OPTIONS.some((opt) => opt.value === o.strategy && opt.value !== SELECT_EMPTY_VALUE)
        ? (o.strategy as DnsConfig["strategy"])
        : o.strategy === "" || o.strategy === undefined
          ? undefined
          : DEFAULT_DNS.strategy,
    disable_cache:
      typeof o.disable_cache === "boolean"
        ? o.disable_cache
        : DEFAULT_DNS.disable_cache,
    disable_expire:
      typeof o.disable_expire === "boolean"
        ? o.disable_expire
        : DEFAULT_DNS.disable_expire,
    independent_cache:
      typeof o.independent_cache === "boolean"
        ? o.independent_cache
        : DEFAULT_DNS.independent_cache,
    cache_capacity:
      typeof o.cache_capacity === "number"
        ? o.cache_capacity
        : DEFAULT_DNS.cache_capacity,
    reverse_mapping:
      typeof o.reverse_mapping === "boolean"
        ? o.reverse_mapping
        : DEFAULT_DNS.reverse_mapping,
    client_subnet:
      typeof o.client_subnet === "string"
        ? o.client_subnet
        : DEFAULT_DNS.client_subnet,
    fakeip,
  };
}

/** 使用 @black-duty/sing-box-schema 校验 DNS 配置；保存前调用，通过则返回包类型的 data 用于提交 */
export function validateDns(
  data: unknown,
): { success: true; data: DnsConfig } | { success: false; error: string } {
  const result = DNSOptions.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues =
    "issues" in result.error
      ? (
          result.error as {
            issues: { path: (string | number)[]; message: string }[];
          }
        ).issues
      : [];
  const first = issues[0];
  const msg = first
    ? `${first.path.length ? `${first.path.join(".")}: ` : ""}${first.message}`
    : result.error.message || "校验失败";
  return { success: false, error: msg };
}

/** 按 path 从对象取值，支持 "fakeip.enabled" */
export function getValueAtPath(
  data: Record<string, unknown>,
  path: string,
): unknown {
  const p = pathKey(path);
  if (!p) return undefined;
  const parts = p.split(".");
  let cur: unknown = data;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** 按 path 设置值，支持 "fakeip.enabled"；返回新对象，不修改原 data */
export function setValueAtPath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const p = pathKey(path);
  if (!p) return data;
  const parts = p.split(".");
  if (parts.length === 1) {
    return { ...data, [parts[0]]: value };
  }
  const [first, ...rest] = parts;
  const current = data[first];
  const child =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};
  const updatedChild =
    rest.length === 1
      ? { ...child, [rest[0]]: value }
      : (setValueAtPath(child, rest.join("."), value) as Record<
          string,
          unknown
        >);
  return { ...data, [first]: updatedChild };
}
