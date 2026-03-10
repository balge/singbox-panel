"""Subscription API: fetch URL and return parsed outbounds."""
from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_current_user
from ..services.subscription_service import fetch_and_parse
from pydantic import BaseModel

router = APIRouter(prefix="/subscription")


class FetchRequest(BaseModel):
    url: str


@router.post("/fetch")
def fetch_subscription(
    req: FetchRequest,
    _: str = Depends(get_current_user),
):
    """Fetch subscription URL and return list of sing-box outbounds."""
    try:
        outbounds = fetch_and_parse(req.url)
        return {"outbounds": outbounds}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
