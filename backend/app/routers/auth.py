"""Auth API router."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth_utils import authenticate_user, create_access_token
from ..deps import get_current_user

router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    if not authenticate_user(req.username, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(req.username)
    return LoginResponse(access_token=token)


class MeResponse(BaseModel):
    username: str


@router.get("/me", response_model=MeResponse)
def me(username: str = Depends(get_current_user)):
    return MeResponse(username=username)


@router.post("/logout")
def logout():
    return {"ok": True}
