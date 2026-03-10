/**
 * Central store: atoms are populated from config.json on page init.
 * Select options use stable ids; form stores id, save converts id → tag/label.
 */

import { atom } from "jotai";

export function genId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Option item: select 存 value=id，显示 label=tag，名称修改后其他引用自动同步 */
export type OptionItem = { id: string; tag: string };
export type SelectOption = { label: string; value: string };

// ─── DNS (config.dns) ─────────────────────────────────────────────────────
export type DnsServer = {
  id: string;
  tag: string;
  address: string;
  address_resolver_id?: string;
  strategy?: string;
  detour_id?: string;
};

export type DnsRule = {
  id: string;
  server_id: string;
  condition_type: string;
  outbound_id?: string;
  clash_mode?: string;
  rule_set_ids?: string[];
  package_name?: string;
  domain?: string;
  domain_suffix?: string;
  domain_keyword?: string;
  domain_regex?: string;
};

export const dnsServersAtom = atom<DnsServer[]>([]);
export const dnsRulesAtom = atom<DnsRule[]>([]);
/** final 使用的 DNS server 的 id */
export const dnsFinalAtom = atom<string | undefined>(undefined);
export const dnsStrategyAtom = atom<string | undefined>(undefined);

// ─── Inbounds (config.inbounds) ───────────────────────────────────────────
export type InboundItem = { id: string; tag: string; [k: string]: unknown };
export const inboundsAtom = atom<InboundItem[]>([]);

// ─── Outbounds (config.outbounds，含 selector/urltest/direct/block/dns) ───
export const outboundsAtom = atom<OptionItem[]>([]);

// ─── Route (config.route) ──────────────────────────────────────────────────
export type RouteRuleSetItem = {
  id: string;
  tag: string;
  type?: string;
  format?: string;
  url?: string;
  [k: string]: unknown;
};
export const routeRuleSetAtom = atom<RouteRuleSetItem[]>([]);
export type RouteRuleItem = Record<string, unknown>;
export const routeRulesAtom = atom<RouteRuleItem[]>([]);
export const routeFinalAtom = atom<string | undefined>(undefined);

// ─── Derived select option atoms（label/value，value 为 id） ────────────────

/** 来自 dnsServersAtom：label=server tag，value=server id */
export const dnsServerOptionsAtom = atom<SelectOption[]>((get) =>
  get(dnsServersAtom).map((s) => ({
    label: s.tag,
    value: s.id,
  })),
);

/** 来自 inboundsAtom：label=inbound tag，value=inbound id */
export const inboundOptionsAtom = atom<SelectOption[]>((get) =>
  get(inboundsAtom).map((inb) => ({
    label: inb.tag,
    value: inb.id,
  })),
);

/** 来自 routeRuleSetAtom：label=rule_set tag，value=rule_set id */
export const ruleSetOptionsAtom = atom<SelectOption[]>((get) =>
  get(routeRuleSetAtom).map((rs) => ({
    label: rs.tag,
    value: rs.id,
  })),
);

// ─── Parse config → values for atoms ───────────────────────────────────────

function collectOutboundTags(config: Record<string, unknown>): string[] {
  const outbounds = config.outbounds as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(outbounds)) return [];
  const tags = new Set<string>();
  for (const ob of outbounds) {
    if (ob.tag != null) tags.add(String(ob.tag));
    const nested = ob.outbounds as string[] | undefined;
    if (Array.isArray(nested)) nested.forEach((t) => t && tags.add(t));
  }
  return [...tags].sort();
}

export type ParsedConfig = {
  dnsServers: DnsServer[];
  dnsRules: DnsRule[];
  dnsFinal: string | undefined;
  dnsStrategy: string | undefined;
  inbounds: InboundItem[];
  outbounds: OptionItem[];
  routeRuleSet: RouteRuleSetItem[];
  routeRules: RouteRuleItem[];
  routeFinal: string | undefined;
};

export function parseConfig(config: Record<string, unknown>): ParsedConfig {
  const outboundTags = collectOutboundTags(config);
  const outbounds: OptionItem[] = [
    { id: "any", tag: "any" },
    ...outboundTags.map((tag) => ({ id: genId(), tag })),
  ];
  const tagToOutboundId = new Map<string, string>();
  outbounds.forEach((o) => tagToOutboundId.set(o.tag, o.id));

  const inboundsRaw = (config.inbounds ?? []) as Array<Record<string, unknown>>;
  const inbounds: InboundItem[] = inboundsRaw.map((inb) => ({
    id: genId(),
    tag: inb.tag != null ? String(inb.tag) : "",
    ...inb,
  }));

  const route = config.route as Record<string, unknown> | undefined;
  const ruleSetRaw = (route?.rule_set ?? []) as Array<Record<string, unknown>>;
  const routeRuleSet: RouteRuleSetItem[] = ruleSetRaw.map((rs) => ({
    id: genId(),
    tag: rs.tag != null ? String(rs.tag) : "",
    type: rs.type as string | undefined,
    format: rs.format as string | undefined,
    url: rs.url as string | undefined,
    ...rs,
  }));
  const tagToRuleSetId = new Map<string, string>();
  routeRuleSet.forEach((r) => r.tag && tagToRuleSetId.set(r.tag, r.id));

  const routeRules = (route?.rules ?? []) as RouteRuleItem[];
  const routeFinal = route?.final != null ? String(route.final) : undefined;

  const dns = config.dns as Record<string, unknown> | undefined;
  const serversRaw = (dns?.servers ?? []) as Array<Record<string, unknown>>;
  const dnsServers: DnsServer[] = serversRaw.map((s) => {
    const id = genId();
    const tag = s.tag != null ? String(s.tag) : "";
    const address = s.address != null ? String(s.address) : "";
    const detour = s.detour != null ? String(s.detour) : undefined;
    return {
      id,
      tag,
      address,
      address_resolver_id: undefined,
      strategy: s.strategy as string | undefined,
      detour_id: detour ? tagToOutboundId.get(detour) : undefined,
    };
  });
  const serverTagToId = new Map(dnsServers.map((s) => [s.tag, s.id]));
  dnsServers.forEach((s, i) => {
    const ar = serversRaw[i]?.address_resolver;
    if (ar != null) {
      const aid = serverTagToId.get(String(ar));
      if (aid) s.address_resolver_id = aid;
    }
  });
  const dnsServersByTag = new Map(dnsServers.map((s) => [s.tag, s.id]));

  const rulesRaw = (dns?.rules ?? []) as Array<Record<string, unknown>>;
  for (const r of rulesRaw) {
    const arr = Array.isArray(r.rule_set) ? (r.rule_set as string[]) : [];
    for (const t of arr) {
      if (t && !tagToRuleSetId.has(t)) {
        const rid = genId();
        routeRuleSet.push({ id: rid, tag: t });
        tagToRuleSetId.set(t, rid);
      }
    }
  }
  const dnsRules: DnsRule[] = rulesRaw.map((r) => {
    const serverTag = r.server != null ? String(r.server) : "";
    const server_id = serverTag
      ? (dnsServersByTag.get(serverTag) ?? genId())
      : "";
    const outboundVal = r.outbound;
    const outboundTag =
      outboundVal == null
        ? undefined
        : Array.isArray(outboundVal)
          ? (outboundVal as string[])[0]
          : String(outboundVal);
    const outbound_id = outboundTag
      ? (tagToOutboundId.get(outboundTag) ??
        (outboundTag === "any" ? "any" : undefined))
      : undefined;
    const ruleSetTags = Array.isArray(r.rule_set)
      ? (r.rule_set as string[])
      : [];
    const rule_set_ids = ruleSetTags
      .map((t) => tagToRuleSetId.get(t))
      .filter(Boolean) as string[];

    const hasOther =
      (Array.isArray(r.domain) && (r.domain as string[]).length) ||
      (Array.isArray(r.domain_suffix) &&
        (r.domain_suffix as string[]).length) ||
      (Array.isArray(r.domain_keyword) &&
        (r.domain_keyword as string[]).length) ||
      (Array.isArray(r.domain_regex) && (r.domain_regex as string[]).length);
    const condition_type = outboundTag
      ? "outbound"
      : r.clash_mode
        ? "clash_mode"
        : rule_set_ids.length
          ? "rule_set"
          : Array.isArray(r.package_name) && (r.package_name as string[]).length
            ? "package_name"
            : hasOther
              ? "other"
              : "outbound";

    return {
      id: genId(),
      server_id,
      condition_type,
      outbound_id,
      clash_mode: r.clash_mode as string | undefined,
      rule_set_ids: rule_set_ids.length ? rule_set_ids : undefined,
      package_name: Array.isArray(r.package_name)
        ? (r.package_name as string[]).join("\n")
        : undefined,
      domain: Array.isArray(r.domain)
        ? (r.domain as string[]).join("\n")
        : undefined,
      domain_suffix: Array.isArray(r.domain_suffix)
        ? (r.domain_suffix as string[]).join("\n")
        : undefined,
      domain_keyword: Array.isArray(r.domain_keyword)
        ? (r.domain_keyword as string[]).join("\n")
        : undefined,
      domain_regex: Array.isArray(r.domain_regex)
        ? (r.domain_regex as string[]).join("\n")
        : undefined,
    };
  });

  const finalTag = dns?.final != null ? String(dns.final) : undefined;
  const dnsFinal = finalTag ? dnsServersByTag.get(finalTag) : undefined;
  const dnsStrategy = dns?.strategy as string | undefined;

  return {
    dnsServers,
    dnsRules,
    dnsFinal,
    dnsStrategy,
    inbounds,
    outbounds,
    routeRuleSet,
    routeRules,
    routeFinal,
  };
}
