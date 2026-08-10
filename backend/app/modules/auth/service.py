from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import Recruiter, Student, User
from app.db.postgres import get_session
from app.modules.auth.schemas import RegisterRequest


async def register_user(payload: RegisterRequest) -> dict:
    email = payload.email.lower()

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_verified=True,
    )

    async with get_session() as session:
        session.add(user)
        try:
            await session.flush()
        except IntegrityError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        # Create the matching role-specific profile row.
        if payload.role == "student":
            session.add(
                Student(
                    user_id=user.id,
                    name=payload.name,
                    email=email,
                    branch=payload.branch or "",
                    year=payload.year or 1,
                )
            )
        elif payload.role == "recruiter":
            session.add(
                Recruiter(
                    user_id=user.id,
                    name=payload.name,
                    email=email,
                    company=payload.company or payload.name,
                )
            )

        await session.commit()

    return _token_payload(user.id, user.name, user.email, user.role, True)


async def login_user(email: str, password: str) -> dict:
    async with get_session() as session:
        result = await session.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return _token_payload(user.id, user.name, user.email, user.role, user.is_verified)


def _token_payload(user_id: str, name: str, email: str, role: str, is_verified: bool) -> dict:
    return {
        "access_token": create_access_token(user_id, role),
        "token_type": "bearer",
        "user": {"id": user_id, "name": name, "email": email, "role": role, "is_verified": is_verified},
    }
