"""Outbounds API: validate single outbound JSON."""
import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException

from ..deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/outbounds")

# Known outbound types per sing-box docs
OUTBOUND_TYPES = frozenset({
    "direct", "block", "dns", "selector", "urltest",
    "vmess", "vless", "trojan", "shadowsocks", "hysteria", "hysteria2", "tuic", "wireguard", "socks", "http",
})


def _validate_outbound_struct(data: Any) -> list[str]:
    """Structural validation only. Returns list of error messages."""
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["Body must be a JSON object"]
    if "type" not in data:
        errors.append("Missing field: type")
    else:
        t = data.get("type")
        if not isinstance(t, str):
            errors.append("Field 'type' must be a string")
        elif t not in OUTBOUND_TYPES:
            errors.append(f"Unknown outbound type: {t}")
    if "tag" not in data:
        errors.append("Missing field: tag")
    elif not isinstance(data.get("tag"), str):
        errors.append("Field 'tag' must be a string")
    return errors


@router.post("/validate")
def validate_outbound(
    body: dict[str, Any] = Body(...),
    _: str = Depends(get_current_user),
):
    """Validate a single outbound object. Returns { valid: bool, errors?: list[str] }."""
    errors = _validate_outbound_struct(body)
    if errors:
        return {"valid": False, "errors": errors}
    return {"valid": True}
