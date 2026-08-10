from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.modules.auth import service
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest):
    return await service.register_user(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    return await service.login_user(payload.email, payload.password)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user
