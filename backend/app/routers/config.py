"""Config API: sing-box config at /config.json."""
from typing import Any

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..services.config_service import read_config, write_config

router = APIRouter(prefix="/config")


@router.get("", response_model=dict[str, Any])
def get_config(_: str = Depends(get_current_user)):
    """Get full sing-box config."""
    return read_config()


@router.put("")
def put_config(
    body: dict[str, Any],
    _: str = Depends(get_current_user),
):
    """Save sing-box config (only sing-box fields; panel does not send panel-only data)."""
    write_config(body)
    return {"ok": True}
