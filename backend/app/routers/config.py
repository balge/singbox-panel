"""Config API: sing-box config at /config.json."""
import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException

from ..config import CONFIG_PATH
from ..deps import get_current_user
from ..services.config_service import read_config, write_config

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/config")


@router.get("", response_model=dict[str, Any])
def get_config(_: str = Depends(get_current_user)):
    """Get full sing-box config."""
    return read_config()


@router.put("")
def put_config(
    body: dict[str, Any] = Body(...),
    _: str = Depends(get_current_user),
):
    """Save sing-box config (only sing-box fields; panel does not send panel-only data)."""
    if not body:
        raise HTTPException(status_code=400, detail="Request body is empty")
    try:
        logger.info("Writing config to %s (dns.rules count: %s)", CONFIG_PATH, len((body.get("dns") or {}).get("rules") or []))
        write_config(body)
        return {"ok": True}
    except OSError as e:
        logger.exception("Failed to write config to %s", CONFIG_PATH)
        raise HTTPException(status_code=500, detail=f"Write failed: {e!s}") from e
