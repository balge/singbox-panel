"""Parse share links (vless, vmess, trojan, hysteria2, ss) to sing-box outbound dict."""
import base64
import json
import re
from urllib.parse import parse_qs, unquote, urlparse

from .tag_sanitize import sanitize_tag


def _parse_vless(line: str) -> dict | None:
    # vless://uuid@host:port?params#fragment
    if not line.strip().lower().startswith("vless://"):
        return None
    try:
        parsed = urlparse(line.strip())
        netloc = parsed.netloc
        fragment = unquote(parsed.fragment or "")
        tag = sanitize_tag(fragment) if fragment else "vless"
        if "@" not in netloc:
            return None
        auth, host_port = netloc.rsplit("@", 1)
        uuid = auth
        if ":" in host_port:
            host, port_s = host_port.rsplit(":", 1)
            port = int(port_s)
        else:
            host, port = host_port, 443
        params = parse_qs(parsed.query or "")
        get_one = lambda k, d=None: (params.get(k) or [d])[0]

        transport_type = get_one("type", "tcp")
        security = get_one("security", "tls")
        sni = get_one("sni") or host
        fp = get_one("fp", "chrome")
        flow = get_one("flow", "")
        path = get_one("path", "/")
        path = unquote(path) if path else "/"
        host_header = get_one("host") or host

        out: dict = {
            "type": "vless",
            "tag": tag,
            "server": host,
            "server_port": port,
            "uuid": uuid,
            "flow": flow,
            "packet_encoding": "xudp",
        }

        # TLS
        tls: dict = {
            "enabled": security in ("tls", "reality"),
            "insecure": get_one("allowInsecure") == "1" or get_one("insecure") == "1",
            "server_name": sni,
        }
        if get_one("security") == "reality":
            pbk = get_one("pbk")
            sid = get_one("sid", "")
            if pbk:
                tls["reality"] = {"enabled": True, "public_key": pbk, "short_id": sid}
        tls["utls"] = {"enabled": True, "fingerprint": fp or "chrome"}
        out["tls"] = tls

        # Transport
        if transport_type == "ws":
            out["transport"] = {
                "type": "ws",
                "path": path,
                "headers": {"Host": [host_header]},
                "max_early_data": 2048,
                "early_data_header_name": "Sec-WebSocket-Protocol",
            }
        elif transport_type != "tcp":
            out["transport"] = {"type": transport_type, "path": path, "headers": {"Host": [host_header]}}
        # tcp: no transport key

        return out
    except Exception:
        return None


def _parse_vmess(line: str) -> dict | None:
    # vmess://base64(json)
    if not line.strip().lower().startswith("vmess://"):
        return None
    try:
        b64 = line.strip()[8:].strip()
        raw = base64.standard_b64decode(b64).decode("utf-8")
        obj = json.loads(raw)
        pid = obj.get("ps") or obj.get("name") or "vmess"
        tag = sanitize_tag(pid)
        out = {
            "type": "vmess",
            "tag": tag,
            "server": obj.get("add", ""),
            "server_port": int(obj.get("port", 443)),
            "uuid": obj.get("id", ""),
            "alter_id": int(obj.get("aid", 0)),
            "security": obj.get("scy", "auto"),
        }
        if obj.get("tls"):
            out["tls"] = {"enabled": True, "server_name": obj.get("sni") or obj.get("add"), "insecure": False}
        if obj.get("net") == "ws":
            h = obj.get("host") or obj.get("add")
            out["transport"] = {
                "type": "ws",
                "path": obj.get("path", "/"),
                "headers": {"Host": [h] if h else []},
            }
        elif obj.get("net") == "tcp":
            pass
        return out
    except Exception:
        return None


def _parse_trojan(line: str) -> dict | None:
    # trojan://password@host:port?params#fragment
    if not line.strip().lower().startswith("trojan://"):
        return None
    try:
        parsed = urlparse(line.strip())
        netloc = parsed.netloc
        fragment = unquote(parsed.fragment or "")
        tag = sanitize_tag(fragment) if fragment else "trojan"
        if "@" not in netloc:
            return None
        password, host_port = netloc.rsplit("@", 1)
        password = unquote(password)
        if ":" in host_port:
            host, port_s = host_port.rsplit(":", 1)
            port = int(port_s)
        else:
            host, port = host_port, 443
        params = parse_qs(parsed.query or "")
        get_one = lambda k, d=None: (params.get(k) or [d])[0]
        sni = get_one("sni") or get_one("peer") or host
        out = {
            "type": "trojan",
            "tag": tag,
            "server": host,
            "server_port": port,
            "password": password,
            "tls": {"enabled": True, "server_name": sni, "insecure": get_one("allowInsecure") == "1"},
        }
        return out
    except Exception:
        return None


def _parse_hysteria2(line: str) -> dict | None:
    # hysteria2://password@host:port/?params#fragment
    if not line.strip().lower().startswith("hysteria2://"):
        return None
    try:
        parsed = urlparse(line.strip())
        netloc = parsed.netloc
        fragment = unquote(parsed.fragment or "")
        tag = sanitize_tag(fragment) if fragment else "hysteria2"
        if "@" in netloc:
            password, host_port = netloc.rsplit("@", 1)
            password = unquote(password)
        else:
            password = ""
            host_port = netloc
        if ":" in host_port:
            host, port_s = host_port.rsplit(":", 1)
            port = int(port_s)
        else:
            host, port = host_port, 443
        params = parse_qs(parsed.query or "")
        get_one = lambda k, d=None: (params.get(k) or [d])[0]
        sni = get_one("sni") or host
        insecure = get_one("insecure") == "1" or get_one("insecure") == "true"
        out = {
            "type": "hysteria2",
            "tag": tag,
            "server": host,
            "server_port": port,
            "password": password,
            "tls": {"enabled": True, "server_name": sni, "insecure": insecure},
        }
        return out
    except Exception:
        return None


def _parse_ss(line: str) -> dict | None:
    # ss://base64(method:password)@host:port#fragment  or  ss://base64(method:password@host:port)#fragment
    if not line.strip().lower().startswith("ss://"):
        return None
    try:
        rest = line.strip()[5:]
        fragment = ""
        if "#" in rest:
            rest, fragment = rest.split("#", 1)
        fragment = unquote(fragment)
        tag = sanitize_tag(fragment) if fragment else "ss"
        if "@" in rest:
            userinfo, host_port = rest.rsplit("@", 1)
            raw = base64.standard_b64decode(userinfo + "==").decode("utf-8")
            method, password = raw.split(":", 1)
        else:
            raw = base64.standard_b64decode(rest.split("#")[0] + "==").decode("utf-8")
            if "@" in raw:
                method, rest = raw.split(":", 1)
                password, host_port = rest.rsplit("@", 1)
            else:
                return None
        if ":" in host_port:
            host, port_s = host_port.rsplit(":", 1)
            port = int(port_s)
        else:
            host, port = host_port, 443
        out = {
            "type": "shadowsocks",
            "tag": tag,
            "server": host,
            "server_port": port,
            "method": method,
            "password": password,
        }
        return out
    except Exception:
        return None


def parse_share_link(line: str) -> dict | None:
    line = line.strip()
    if not line:
        return None
    for parser in (_parse_vless, _parse_vmess, _parse_trojan, _parse_hysteria2, _parse_ss):
        out = parser(line)
        if out:
            return out
    return None
