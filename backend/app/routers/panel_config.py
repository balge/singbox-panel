"""Panel config API: /panel/panel_config.json (subscriptions, etc.)."""
from typing import Any

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..services.config_service import read_panel_config, write_panel_config

router = APIRouter(prefix="/panel-config")


@router.get("", response_model=dict[str, Any])
def get_panel_config(_: str = Depends(get_current_user)):
    return read_panel_config()


@router.put("")
def put_panel_config(
    body: dict[str, Any],
    _: str = Depends(get_current_user),
):
    write_panel_config(body)
    return {"ok": True}
