"""
默认配置：严格依照 @black-duty/sing-box-schema（schema.zh.json）的 $defs 定义生成。
仅包含 schema 中声明的属性，字段顺序与 schema 一致；不包含已废弃或 schema 外的字段。
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# LogOptions ($defs/LogOptions)
# properties: disabled, level, output, timestamp
# ---------------------------------------------------------------------------
DEFAULT_LOG: dict[str, Any] = {
    "disabled": False,
    "level": "debug",  # enum: trace|debug|info|warn|error|fatal|panic
    "output": "/logs/sing-box.log",
    "timestamp": True,
}

# ---------------------------------------------------------------------------
# NTPOptions ($defs/NTPOptions)
# properties: enabled, interval, write_to_system, server, server_port, ...
# ---------------------------------------------------------------------------
DEFAULT_NTP: dict[str, Any] = {
    "enabled": False,
    "interval": "30m",
    "server": "time.apple.com",
    "server_port": 123,
}

# ---------------------------------------------------------------------------
# DNSOptions ($defs/DNSOptions)
# properties: servers, rules, final, reverse_mapping, fakeip, strategy,
#   disable_cache, disable_expire, independent_cache, cache_capacity, client_subnet
# servers[]: DNSServer anyOf -> UDPDNSServerOptions (required: type"udp", server; optional: tag, server_port)
# fakeip: LegacyDNSFakeIPOptions { enabled, inet4_range, inet6_range }
# strategy: __schema18 enum ""|prefer_ipv4|prefer_ipv6|ipv4_only|ipv6_only
# ---------------------------------------------------------------------------
DEFAULT_DNS: dict[str, Any] = {
    "servers": [
        {
            "type": "udp",
            "tag": "dns_resolver",
            "server": "223.5.5.5",
            "server_port": 53,
        },
    ],
    "rules": [],
    "final": "dns_resolver",
    "reverse_mapping": False,
    "fakeip": {
        "enabled": False,
        "inet4_range": "198.18.0.0/15",
        "inet6_range": "fd00::/108",
    },
    "strategy": "prefer_ipv4",
    "disable_cache": False,
    "disable_expire": False,
    "independent_cache": False,
    "cache_capacity": 0,
    "client_subnet": "",
}

# ---------------------------------------------------------------------------
# RouteOptions ($defs/RouteOptions)
# properties: rules, rule_set, final, find_process, auto_detect_interface, ...
# ---------------------------------------------------------------------------
DEFAULT_ROUTE: dict[str, Any] = {
    "rules": [],
    "rule_set": [],
    "final": "select",
}

# ---------------------------------------------------------------------------
# Inbound anyOf -> MixedInboundOptions ($defs/MixedInboundOptions)
# required: type; properties: type(const mixed), tag, set_system_proxy, listen, listen_port, sniff, sniff_override_destination, ...
# ---------------------------------------------------------------------------
DEFAULT_INBOUNDS: list[dict[str, Any]] = [
    {
        "type": "mixed",
        "tag": "mixed_in_direct",
        "set_system_proxy": False,
        "listen": "0.0.0.0",
        "listen_port": 2081,
        "sniff": True,
        "sniff_override_destination": False,
    },
    {
        "type": "mixed",
        "tag": "mixed_in_proxy",
        "set_system_proxy": False,
        "listen": "0.0.0.0",
        "listen_port": 2082,
        "sniff": True,
        "sniff_override_destination": False,
    },
    {
        "type": "mixed",
        "tag": "mixed_in_rule",
        "set_system_proxy": False,
        "listen": "0.0.0.0",
        "listen_port": 2083,
        "sniff": True,
        "sniff_override_destination": False,
    },
]

# ---------------------------------------------------------------------------
# Outbound anyOf -> DirectOutboundOptions, SelectorOutbound（schema 无 BlockOutbound）
# DirectOutboundOptions: type(const direct), tag
# SelectorOutbound: required type, tag, outbounds; optional default
# ---------------------------------------------------------------------------
DEFAULT_OUTBOUNDS: list[dict[str, Any]] = [
    {"type": "direct", "tag": "direct_out"},
    {
        "type": "selector",
        "tag": "select",
        "outbounds": ["direct_out"],
        "default": "direct_out",
    },
]

# ---------------------------------------------------------------------------
# ExperimentalOptions ($defs/ExperimentalOptions)
# properties: cache_file, clash_api, v2ray_api, debug
# CacheFileOptions: enabled, path, cache_id, store_fakeip, store_rdrc, rdrc_timeout
# ClashAPIOptions: external_controller, external_ui, external_ui_download_url,
#   external_ui_download_detour, secret, default_mode, access_control_allow_origin, access_control_allow_private_network
# V2RayAPIOptions: listen, stats { enabled, inbounds, outbounds, users }
# ---------------------------------------------------------------------------
DEFAULT_EXPERIMENTAL: dict[str, Any] = {
    "cache_file": {
        "enabled": True,
        "path": "",
        "cache_id": "",
        "store_fakeip": False,
        "store_rdrc": False,
        "rdrc_timeout": "7d",
    },
    "clash_api": {
        "external_controller": "127.0.0.1:9090",
        "external_ui": "",
        "external_ui_download_url": "",
        "external_ui_download_detour": "",
        "secret": "",
        "default_mode": "Rule",
        "access_control_allow_origin": [],
        "access_control_allow_private_network": False,
    },
    "v2ray_api": {
        "listen": "",
        "stats": {
            "enabled": False,
            "inbounds": [],
            "outbounds": [],
            "users": [],
        },
    },
}


def get_default_parts() -> dict[str, dict[str, Any] | list[Any]]:
    """Return default content for each part (module name -> dict or list)."""
    return {
        "log": dict(DEFAULT_LOG),
        "ntp": dict(DEFAULT_NTP),
        "dns": dict(DEFAULT_DNS),
        "route": dict(DEFAULT_ROUTE),
        "inbounds": list(DEFAULT_INBOUNDS),
        "outbounds": list(DEFAULT_OUTBOUNDS),
        "experimental": dict(DEFAULT_EXPERIMENTAL),
    }


def get_default_merged_config() -> dict[str, Any]:
    """Return full default config (merge of all parts)."""
    return dict(get_default_parts())
