"""Application paths and settings."""
import os
from pathlib import Path

# 统一目录：panels 下放 config.json、parts、logs、panel_config、backups（规则走 parts/route 等模块）
_raw = os.environ.get("PANELS_DIR", "/panels")
PANELS_DIR = Path(_raw).resolve()
CONFIG_PATH = PANELS_DIR / "config.json"
PARTS_DIR = PANELS_DIR / "parts"
LOG_DIR = PANELS_DIR / "logs"
PANEL_CONFIG_PATH = PANELS_DIR / "panel_config.json"
BACKUP_DIR = PANELS_DIR / "backups"

USE_PARTS = os.environ.get("USE_PARTS", "true").lower() in ("1", "true", "yes")

# Optional: restart sing-box after apply (e.g. "killall -HUP sing-box" or "docker restart sing-box")
# Comma-separated command, e.g. SINGBOX_RESTART_CMD=killall,-HUP,sing-box
SINGBOX_RESTART_CMD_RAW = os.environ.get("SINGBOX_RESTART_CMD", "")
SINGBOX_RESTART_CMD = [p.strip() for p in SINGBOX_RESTART_CMD_RAW.split(",") if p.strip()] if SINGBOX_RESTART_CMD_RAW else []

# Auth (env)
PANEL_USERNAME = os.environ.get("PANEL_USERNAME", "admin")
PANEL_PASSWORD = os.environ.get("PANEL_PASSWORD", "admin")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h

# API
API_PREFIX = "/api"
