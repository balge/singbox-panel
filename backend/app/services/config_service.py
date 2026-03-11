"""Config and panel config file I/O."""
import json
from pathlib import Path
from typing import Any

from ..config import (
    BACKUP_DIR,
    CONFIG_PATH,
    PANEL_CONFIG_PATH,
    PARTS_DIR,
    USE_PARTS,
)

# Module names and which are arrays in sing-box config
CONFIG_MODULES = ("log", "ntp", "inbounds", "outbounds", "route", "dns", "experimental")
ARRAY_MODULES = ("inbounds", "outbounds")


def _parts_path(module: str) -> Path:
    if module not in CONFIG_MODULES:
        raise ValueError(f"Unknown module: {module}")
    return PARTS_DIR / f"{module}.json"


def read_part(module: str) -> dict[str, Any] | list[Any]:
    """Read one module from parts/{module}.json. Returns {} or [] when file missing."""
    path = _parts_path(module)
    if not path.exists():
        return [] if module in ARRAY_MODULES else {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_part(module: str, data: dict[str, Any] | list[Any]) -> None:
    """Write one module to parts/{module}.json."""
    path = _parts_path(module)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_merged_config() -> dict[str, Any]:
    """Merge all parts into full config. If USE_PARTS and parts exist, merge from parts; else read single config.json.
    首次：若 parts 下无任何模块文件，则从 config.json 按块解析并写入 parts，再合并。"""
    if not USE_PARTS:
        return read_config()
    ensure_parts_from_config()
    if not PARTS_DIR.exists():
        return read_config()
    if not list_parts():
        return read_config()
    out: dict[str, Any] = {}
    for name in CONFIG_MODULES:
        part = read_part(name)
        if part if name in ARRAY_MODULES else (part and part != {}):
            out[name] = part
    return out


def write_merged_config(data: dict[str, Any]) -> None:
    """Write full config to config.json."""
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def split_config_to_parts(data: dict[str, Any]) -> dict[str, dict | list]:
    """Split full config into module dict for writing parts."""
    order = list(CONFIG_MODULES)
    result: dict[str, dict | list] = {}
    for name in order:
        val = data.get(name)
        if name in ARRAY_MODULES:
            result[name] = val if isinstance(val, list) else []
        else:
            result[name] = val if isinstance(val, dict) else {}
    return result


def write_config_from_parts(parts: dict[str, dict | list]) -> None:
    """Write each part to parts/{module}.json then merge to config.json."""
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    for module, data in parts.items():
        if module in CONFIG_MODULES:
            write_part(module, data)
    merged = read_merged_config()
    write_merged_config(merged)


def list_parts() -> list[str]:
    """List existing part filenames (without .json)."""
    if not PARTS_DIR.exists():
        return []
    return [f.stem for f in PARTS_DIR.glob("*.json") if f.stem in CONFIG_MODULES]


def ensure_parts_from_config() -> None:
    """首次：若 parts 下无模块 json，则从 config.json 按块解析并写入 parts（experimental、log、ntp、dns、inbounds、outbounds、route）。"""
    if not USE_PARTS:
        return
    if list_parts():
        return
    if not CONFIG_PATH.exists():
        return
    data = read_config()
    if not isinstance(data, dict):
        return
    parts = split_config_to_parts(data)
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    for module, part_data in parts.items():
        write_part(module, part_data)


def backup_config() -> tuple[Path, str]:
    """Write current merged config to BACKUP_DIR with timestamp filename. Returns (path, filename)."""
    from datetime import datetime
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    data = read_merged_config()
    filename = f"config_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
    path = BACKUP_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path, filename


def list_backups() -> list[str]:
    """List backup filenames (newest first)."""
    if not BACKUP_DIR.exists():
        return []
    files = sorted(BACKUP_DIR.glob("config_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    return [f.name for f in files]


def restore_config(filename: str) -> None:
    """Restore from a backup file: read backup, split to parts, write parts and merged config."""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise ValueError("Invalid filename")
    path = BACKUP_DIR / filename
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Backup not found: {filename}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("Backup is not a valid config object")
    parts = split_config_to_parts(data)
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    for module, part_data in parts.items():
        write_part(module, part_data)
    write_merged_config(read_merged_config())


def read_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_config(data: dict[str, Any]) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if USE_PARTS:
        parts = split_config_to_parts(data)
        PARTS_DIR.mkdir(parents=True, exist_ok=True)
        for module, part_data in parts.items():
            write_part(module, part_data)


def read_panel_config() -> dict[str, Any]:
    if not PANEL_CONFIG_PATH.exists():
        return {"subscriptions": [], "custom_rule_sets": []}
    with open(PANEL_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_panel_config(data: dict[str, Any]) -> None:
    PANEL_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PANEL_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

