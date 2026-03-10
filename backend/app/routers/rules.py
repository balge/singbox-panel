"""Rules API: add local rule set, write to /rule/{tag}.json."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user
from ..services.config_service import write_local_rule
from ..config import RULES_DIR

router = APIRouter(prefix="/rules")


class LocalRuleRequest(BaseModel):
    tag: str
    rules: list[dict[str, Any]]


@router.post("/local")
def add_local_rule(
    req: LocalRuleRequest,
    _: str = Depends(get_current_user),
):
    """Create or overwrite a local rule set file at /rule/{tag}.json."""
    tag = (req.tag or "").strip().replace("/", "_").replace("..", "")
    if not tag:
        raise HTTPException(status_code=400, detail="tag is required")
    try:
        path = write_local_rule(tag, req.rules)
        return {"path": str(path), "tag": tag}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/local/list")
def list_local_rules(_: str = Depends(get_current_user)):
    """List existing local rule files in /rule."""
    if not RULES_DIR.exists():
        return {"files": []}
    files = [f.stem for f in RULES_DIR.glob("*.json")]
    return {"files": files}
