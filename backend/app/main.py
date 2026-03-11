"""FastAPI application entry."""
from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import API_PREFIX
from .routers import auth, config, panel_config, subscription, outbounds

app = FastAPI(title="sing-box Panel API", version="0.1.0")

@app.on_event("startup")
def startup_migrate_parts():
    """启动时：若 parts 为空且存在 config.json，则按块解析并写入 parts。"""
    import logging
    try:
        from .services.config_service import ensure_parts_from_config
        ensure_parts_from_config()
    except Exception as e:
        logging.getLogger(__name__).warning("Startup migrate config to parts skipped or failed: %s", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=API_PREFIX, tags=["auth"])
app.include_router(config.router, prefix=API_PREFIX, tags=["config"])
app.include_router(panel_config.router, prefix=API_PREFIX, tags=["panel-config"])
app.include_router(subscription.router, prefix=API_PREFIX, tags=["subscription"])
app.include_router(outbounds.router, prefix=API_PREFIX, tags=["outbounds"])

# Static frontend: default to frontend/dist next to backend, or STATIC_DIR in Docker
_static_dir = os.environ.get("STATIC_DIR")
if _static_dir:
    _frontend_dist = Path(_static_dir)
else:
    _frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")


@app.get("/api/health")
def health():
    return {"status": "ok"}
