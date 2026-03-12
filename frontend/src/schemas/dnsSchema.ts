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

/** 表单/列表用的 DNS 服务器项（与包内 DnsServer 一致，含 type/server 等） */
export type DnsServer = Record<string, unknown> & {
  type?: string;
  tag?: string;
  server?: string;
  server_port?: number;
  path?: string;
  domain_resolver?: string;
  detour?: string;
  /** Local */
  prefer_go?: boolean;
  /** Hosts */
  /** DHCP */
  interface?: string;
  /** FakeIP server type */
  inet4_range?: string;
  inet6_range?: string;
  /** Tailscale */
  endpoint?: string;
  accept_default_resolvers?: boolean;
  /** Resolved */
  service?: string;
  /** Legacy (deprecated) */
  address?: string;
  address_resolver?: string;
  strategy?: string;
};

/** 表单/列表用的 DNS 规则项（与包内 DnsRule 一致；outbound 已废弃，使用 action） */
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

/** fakeip 子结构（DNSOptions.fakeip） */
export type DnsFakeip = NonNullable<DnsConfig["fakeip"]>;

/** 用于 strategy 等 select 的“空”选项；Radix Select 不允许 SelectItem value 为空字符串 */
export const SELECT_EMPTY_VALUE = "__empty__";

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
    label: schemaLabel(
      "DNSOptions",
      ["disable_cache"],
      "禁用 DNS 缓存",
      "disable_cache",
    ),
    type: "boolean",
  },
  {
    key: "disable_expire",
    path: "disable_expire",
    label: schemaLabel(
      "DNSOptions",
      ["disable_expire"],
      "禁用缓存过期",
      "disable_expire",
    ),
    type: "boolean",
  },
  {
    key: "independent_cache",
    path: "independent_cache",
    label: schemaLabel(
      "DNSOptions",
      ["independent_cache"],
      "各 DNS 独立缓存",
      "independent_cache",
    ),
    type: "boolean",
  },
  {
    key: "cache_capacity",
    path: "cache_capacity",
    label: schemaLabel(
      "DNSOptions",
      ["cache_capacity"],
      "LRU 缓存容量（≥1024）",
      "cache_capacity",
    ),
    type: "number",
    placeholder: "0 表示忽略",
  },
  {
    key: "reverse_mapping",
    path: "reverse_mapping",
    label: schemaLabel(
      "DNSOptions",
      ["reverse_mapping"],
      "反向 IP 映射",
      "reverse_mapping",
    ),
    type: "boolean",
  },
  {
    key: "client_subnet",
    path: "client_subnet",
    label: schemaLabel(
      "DNSOptions",
      ["client_subnet"],
      "EDNS Client Subnet",
      "client_subnet",
    ),
    type: "string",
    placeholder: "如 0.0.0.0/0",
  },
];

/** fakeip 子表单 schema */
export const DNS_FAKEIP_SCHEMA: SchemaField[] = [
  {
    key: "enabled",
    path: "fakeip.enabled",
    label: schemaLabel(
      "DNSOptions",
      ["fakeip", "enabled"],
      "启用 FakeIP",
      "enabled",
    ),
    type: "boolean",
  },
  {
    key: "inet4_range",
    path: "fakeip.inet4_range",
    label: schemaLabel(
      "DNSOptions",
      ["fakeip", "inet4_range"],
      "FakeIP IPv4 段",
      "inet4_range",
    ),
    type: "string",
    placeholder: "如 198.18.0.0/15",
  },
  {
    key: "inet6_range",
    path: "fakeip.inet6_range",
    label: schemaLabel(
      "DNSOptions",
      ["fakeip", "inet6_range"],
      "FakeIP IPv6 段",
      "inet6_range",
    ),
    type: "string",
    placeholder: "如 fd00::/108",
  },
];

// --- DNS Server 按 type 分类的表单 schema（对应 https://sing-box.sagernet.org/configuration/dns/server/）---

/** DNS 服务器 type 选项（新 schema 格式，不含 legacy） */
export const DNS_SERVER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "udp", label: "UDP" },
  { value: "tcp", label: "TCP" },
  { value: "tls", label: "TLS" },
  { value: "quic", label: "QUIC" },
  { value: "https", label: "HTTPS" },
  { value: "h3", label: "HTTP/3" },
  { value: "local", label: "Local" },
  { value: "hosts", label: "Hosts" },
  { value: "dhcp", label: "DHCP" },
  { value: "fakeip", label: "FakeIP" },
  { value: "tailscale", label: "Tailscale" },
  { value: "resolved", label: "Resolved" },
];

/** 各 type 对应的表单字段（仅常用字段；不含 domain_resolver、detour） */
export const DNS_SERVER_SCHEMA_BY_TYPE: Record<string, SchemaField[]> = {
  udp: [
    { key: "tag", label: schemaLabel("UDPDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_resolver" },
    { key: "server", label: schemaLabel("UDPDNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 223.5.5.5" },
    { key: "server_port", label: schemaLabel("UDPDNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 53" },
  ],
  tcp: [
    { key: "tag", label: schemaLabel("TCPDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_tcp" },
    { key: "server", label: schemaLabel("TCPDNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 223.5.5.5" },
    { key: "server_port", label: schemaLabel("TCPDNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 53" },
  ],
  tls: [
    { key: "tag", label: schemaLabel("TLSDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_tls" },
    { key: "server", label: schemaLabel("TLSDNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 1.1.1.1" },
    { key: "server_port", label: schemaLabel("TLSDNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 853" },
  ],
  quic: [
    { key: "tag", label: schemaLabel("QUICDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_quic" },
    { key: "server", label: schemaLabel("QUICDNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 1.1.1.1" },
    { key: "server_port", label: schemaLabel("QUICDNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 853" },
  ],
  https: [
    { key: "tag", label: schemaLabel("HTTPSDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_doh" },
    { key: "server", label: schemaLabel("HTTPSDNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 1.1.1.1" },
    { key: "server_port", label: schemaLabel("HTTPSDNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 443" },
    { key: "path", label: schemaLabel("HTTPSDNSServerOptions", ["path"], "路径", "path"), type: "string", placeholder: "默认 /dns-query" },
  ],
  h3: [
    { key: "tag", label: schemaLabel("HTTP3DNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_h3" },
    { key: "server", label: schemaLabel("HTTP3DNSServerOptions", ["server"], "服务器地址", "server"), type: "string", placeholder: "如 1.1.1.1" },
    { key: "server_port", label: schemaLabel("HTTP3DNSServerOptions", ["server_port"], "端口", "server_port"), type: "number", placeholder: "默认 443" },
    { key: "path", label: schemaLabel("HTTP3DNSServerOptions", ["path"], "路径", "path"), type: "string", placeholder: "默认 /dns-query" },
  ],
  local: [
    { key: "tag", label: schemaLabel("LocalDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_local" },
    { key: "prefer_go", label: schemaLabel("LocalDNSServerOptions", ["prefer_go"], "优先通过 Go 拨号解析", "prefer_go"), type: "boolean" },
  ],
  hosts: [
    { key: "tag", label: schemaLabel("HostsDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_hosts" },
    { key: "path", label: schemaLabel("HostsDNSServerOptions", ["path"], "主机文件路径", "path"), type: "string", placeholder: "可选，默认 /etc/hosts" },
  ],
  dhcp: [
    { key: "tag", label: schemaLabel("DHCPDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_dhcp" },
    { key: "interface", label: schemaLabel("DHCPDNSServerOptions", ["interface"], "监听接口", "interface"), type: "string", placeholder: "可选" },
  ],
  fakeip: [
    { key: "tag", label: schemaLabel("FakeIPDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_fakeip" },
    { key: "inet4_range", label: schemaLabel("FakeIPDNSServerOptions", ["inet4_range"], "IPv4 段", "inet4_range"), type: "string", placeholder: "如 198.18.0.0/15" },
    { key: "inet6_range", label: schemaLabel("FakeIPDNSServerOptions", ["inet6_range"], "IPv6 段", "inet6_range"), type: "string", placeholder: "如 fd00::/108" },
  ],
  tailscale: [
    { key: "tag", label: schemaLabel("TailscaleDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_ts" },
    { key: "endpoint", label: schemaLabel("TailscaleDNSServerOptions", ["endpoint"], "Tailscale 端点 tag", "endpoint"), type: "string", placeholder: "必填" },
    { key: "accept_default_resolvers", label: schemaLabel("TailscaleDNSServerOptions", ["accept_default_resolvers"], "接受默认解析器回退", "accept_default_resolvers"), type: "boolean" },
  ],
  resolved: [
    { key: "tag", label: schemaLabel("ResolvedDNSServerOptions", ["tag"], "标签", "tag"), type: "string", placeholder: "如 dns_resolved" },
    { key: "service", label: schemaLabel("ResolvedDNSServerOptions", ["service"], "Resolved 服务 tag", "service"), type: "string", placeholder: "必填" },
    { key: "accept_default_resolvers", label: schemaLabel("ResolvedDNSServerOptions", ["accept_default_resolvers"], "接受默认解析器回退", "accept_default_resolvers"), type: "boolean" },
  ],
};

/** 根据 server 推断 type（新格式用 type，否则返回 udp 作为默认） */
export function getDnsServerType(server: DnsServer): string {
  const t = server.type;
  if (t && typeof t === "string" && DNS_SERVER_TYPE_OPTIONS.some((o) => o.value === t)) return t;
  return "udp";
}

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

/** 从 API 返回的 JSON 转为 DnsConfigState（API 始终为当前 schema 格式，仅对缺失键填默认值） */
export function mergeDnsFromJson(obj: unknown): DnsConfigState {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ...DEFAULT_DNS };
  }
  const o = obj as Record<string, unknown>;
  return {
    ...DEFAULT_DNS,
    ...o,
    servers: Array.isArray(o.servers) ? o.servers as DnsServer[] : (DEFAULT_DNS.servers ?? []),
    rules: Array.isArray(o.rules) ? o.rules as DnsRule[] : (DEFAULT_DNS.rules ?? []),
    fakeip:
      o.fakeip && typeof o.fakeip === "object" && !Array.isArray(o.fakeip)
        ? { ...DEFAULT_DNS.fakeip, ...(o.fakeip as Record<string, unknown>) }
        : DEFAULT_DNS.fakeip,
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
