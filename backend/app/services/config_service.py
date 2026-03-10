"""Config and panel config file I/O."""
import json
from pathlib import Path
from typing import Any

from ..config import CONFIG_PATH, PANEL_CONFIG_PATH, RULES_DIR


def read_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_config(data: dict[str, Any]) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_panel_config() -> dict[str, Any]:
    if not PANEL_CONFIG_PATH.exists():
        return {"subscriptions": [], "custom_rule_sets": []}
    with open(PANEL_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_panel_config(data: dict[str, Any]) -> None:
    PANEL_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PANEL_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def ensure_rules_dir() -> Path:
    RULES_DIR.mkdir(parents=True, exist_ok=True)
    return RULES_DIR


def write_local_rule(tag: str, rules_content: list[dict[str, Any]]) -> Path:
    ensure_rules_dir()
    path = RULES_DIR / f"{tag}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rules_content, f, ensure_ascii=False, indent=2)
    return path
