"""Config API: sing-box config, module parts, merge, apply, backup."""
import logging
import subprocess
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException

from ..config import CONFIG_PATH, SINGBOX_RESTART_CMD
from ..deps import get_current_user
from ..services.config_service import (
    CONFIG_MODULES,
    backup_config,
    list_backups,
    read_merged_config,
    restore_config,
    write_config,
    write_merged_config,
    write_part_and_merge,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/config")


def _run_restart() -> None:
    """Run optional restart command. Raises on failure."""
    if not SINGBOX_RESTART_CMD:
        return
    try:
        subprocess.run(
            SINGBOX_RESTART_CMD,
            timeout=15,
            check=True,
            capture_output=True,
        )
        logger.info("Restart command completed: %s", SINGBOX_RESTART_CMD)
    except subprocess.CalledProcessError as e:
        logger.warning("Restart command failed: %s stderr=%s", e, e.stderr)
        raise
    except Exception as e:
        logger.exception("Restart command error: %s", e)
        raise


@router.get("", response_model=dict[str, Any])
def get_config(_: str = Depends(get_current_user)):
    """Get full sing-box config (merged from parts when USE_PARTS)."""
    return read_merged_config()


@router.put("")
def put_config(
    body: dict[str, Any] = Body(...),
    _: str = Depends(get_current_user),
):
    """Save full sing-box config; when USE_PARTS also updates parts."""
    if not body:
        raise HTTPException(status_code=400, detail="Request body is empty")
    try:
        logger.info("Writing full config to %s", CONFIG_PATH)
        write_config(body)
        return {"ok": True}
    except OSError as e:
        logger.exception("Failed to write config to %s", CONFIG_PATH)
        raise HTTPException(status_code=500, detail=f"Write failed: {e!s}") from e


@router.get("/merge", response_model=dict[str, Any])
def get_merge(_: str = Depends(get_current_user)):
    """Get merged config from all parts (preview)."""
    return read_merged_config()


@router.get("/{module}", response_model=dict[str, Any] | list[Any])
def get_module(
    module: str,
    _: str = Depends(get_current_user),
):
    """Get one module config (log, ntp, inbounds, outbounds, route, dns, experimental)."""
    if module not in CONFIG_MODULES:
        raise HTTPException(status_code=404, detail=f"Unknown module: {module}")
    try:
        from ..services.config_service import read_part
        return read_part(module)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{module}")
def post_module(
    module: str,
    body: dict[str, Any] | list[Any] = Body(...),
    _: str = Depends(get_current_user),
):
    """Save one module config; when using parts, also merge and update config.json."""
    if module not in CONFIG_MODULES:
        raise HTTPException(status_code=404, detail=f"Unknown module: {module}")
    try:
        write_part_and_merge(module, body)
        return {"ok": True}
    except OSError as e:
        logger.exception("Failed to write part %s", module)
        raise HTTPException(status_code=500, detail=f"Write failed: {e!s}") from e


@router.post("/apply")
def post_apply(_: str = Depends(get_current_user)):
    """Merge parts into config.json, then optionally run restart command."""
    try:
        data = read_merged_config()
        write_merged_config(data)
        _run_restart()
        return {"ok": True}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.exception("Apply failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backup")
def post_backup(_: str = Depends(get_current_user)):
    """Create a timestamped backup of current merged config."""
    try:
        path, filename = backup_config()
        return {"ok": True, "path": str(path), "filename": filename}
    except OSError as e:
        logger.exception("Backup failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Backup failed: {e!s}") from e


@router.get("/backups/list", response_model=list[str])
def get_backups(_: str = Depends(get_current_user)):
    """List backup filenames (newest first)."""
    return list_backups()


@router.post("/backups/restore")
def post_restore(
    body: dict[str, Any] = Body(...),
    _: str = Depends(get_current_user),
):
    """Restore from backup by filename."""
    filename = body.get("filename") if isinstance(body, dict) else None
    if not filename or not isinstance(filename, str):
        raise HTTPException(status_code=400, detail="filename is required")
    try:
        restore_config(filename.strip())
        return {"ok": True}
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except OSError as e:
        logger.exception("Restore failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Restore failed: {e!s}") from e
