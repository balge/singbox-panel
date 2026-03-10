"""Application paths and settings."""
import os
from pathlib import Path

# Fixed paths (Docker volumes)
CONFIG_PATH = Path(os.environ.get("CONFIG_PATH", "/config.json"))
PANEL_CONFIG_PATH = Path(os.environ.get("PANEL_CONFIG_PATH", "/panel/panel_config.json"))
RULES_DIR = Path(os.environ.get("RULES_DIR", "/rule"))
LOG_DIR = Path(os.environ.get("LOG_DIR", "/log"))

# Auth (env)
PANEL_USERNAME = os.environ.get("PANEL_USERNAME", "admin")
PANEL_PASSWORD = os.environ.get("PANEL_PASSWORD", "admin")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h

# API
API_PREFIX = "/api"
