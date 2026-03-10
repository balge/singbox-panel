"""Fetch subscription URL and parse to list of sing-box outbounds."""
import base64
import re
import httpx

from .subscription_parser import parse_share_link

# Looks like base64: no spaces, mainly alphanumeric + / + =
BASE64_RE = re.compile(r"^[A-Za-z0-9+/=]+$")
SUB_TIMEOUT = 30.0


def _decode_body(body: str) -> str:
    body = body.strip()
    # Single line or few lines of base64 -> decode once
    if "\n" not in body or body.count("\n") <= 2:
        candidate = body.replace("\n", "").replace("\r", "")
        if len(candidate) >= 32 and BASE64_RE.match(candidate):
            try:
                return base64.standard_b64decode(candidate).decode("utf-8", errors="replace")
            except Exception:
                pass
    # Multi-line base64 (each line is a link encoded?)
    lines = body.splitlines()
    if lines and len(lines) <= 5 and BASE64_RE.match(lines[0].strip()):
        try:
            decoded = base64.standard_b64decode(lines[0].strip()).decode("utf-8", errors="replace")
            if "://" in decoded:
                return decoded + "\n" + "\n".join(
                    base64.standard_b64decode(l.strip()).decode("utf-8", errors="replace")
                    for l in lines[1:]
                    if l.strip()
                )
        except Exception:
            pass
    return body


def fetch_and_parse(url: str) -> list[dict]:
    with httpx.Client(timeout=SUB_TIMEOUT, follow_redirects=True) as client:
        r = client.get(url, headers={"User-Agent": "clash"})
        r.raise_for_status()
        body = r.text
    content = _decode_body(body)
    outbounds: list[dict] = []
    seen_tags: set[str] = set()
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        ob = parse_share_link(line)
        if ob:
            tag = ob.get("tag", "node")
            base_tag = tag
            c = 0
            while tag in seen_tags:
                c += 1
                tag = f"{base_tag}_{c}"
            seen_tags.add(tag)
            ob["tag"] = tag
            outbounds.append(ob)
    return outbounds
