"""OAuth 2.0 authorization-code flow for Google and GitHub.

Flow, for either provider:

  1. Browser hits  GET /api/auth/oauth/{provider}/login   → 302 to the provider.
  2. User consents; the provider redirects back to
     GET /api/auth/oauth/{provider}/callback?code=...&state=...
  3. We exchange the code for an access token, read the profile, upsert a User,
     mint our own JWT, and bounce the browser to the frontend with that token.

State is a short-lived signed JWT rather than a server-side session, so the API
stays stateless and works across Render's multiple workers.
"""

import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.security import create_access_token
from app.db.models import Recruiter, Student, User
from app.db.postgres import get_session

router = APIRouter(prefix="/api/auth/oauth", tags=["auth"])

STATE_TTL_MINUTES = 10

PROVIDERS = {
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
    },
    "github": {
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "emails_url": "https://api.github.com/user/emails",
        "scope": "read:user user:email",
    },
}


def _credentials(provider: str) -> tuple[str, str]:
    if provider == "google":
        if not settings.google_oauth_enabled:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google sign-in is not configured on this server.")
        return settings.google_client_id, settings.google_client_secret

    if provider == "github":
        if not settings.github_oauth_enabled:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "GitHub sign-in is not configured on this server.")
        return settings.github_client_id, settings.github_client_secret

    raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown OAuth provider: {provider}")


def _redirect_uri(provider: str) -> str:
    return f"{settings.backend_base_url.rstrip('/')}/api/auth/oauth/{provider}/callback"


def _issue_state(provider: str, role: str) -> str:
    payload = {
        "provider": provider,
        "role": role,
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=STATE_TTL_MINUTES),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _read_state(state: str, provider: str) -> dict:
    try:
        payload = jwt.decode(state, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth state is invalid or has expired. Start again.")

    if payload.get("provider") != provider:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth state does not match this provider.")
    return payload


@router.get("/providers")
async def available_providers() -> dict:
    """Lets the sign-in page show only the buttons this deployment can serve."""
    return {"google": settings.google_oauth_enabled, "github": settings.github_oauth_enabled}


@router.get("/{provider}/login")
async def oauth_login(provider: str, role: str = Query("student", pattern="^(student|recruiter)$")):
    client_id, _ = _credentials(provider)
    config = PROVIDERS[provider]

    params = {
        "client_id": client_id,
        "redirect_uri": _redirect_uri(provider),
        "scope": config["scope"],
        "state": _issue_state(provider, role),
        "response_type": "code",
    }
    if provider == "google":
        # Always show the account chooser rather than silently reusing a session.
        params["prompt"] = "select_account"

    return RedirectResponse(f"{config['authorize_url']}?{httpx.QueryParams(params)}", status_code=302)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    frontend = settings.frontend_base_url.rstrip("/")

    if error:
        return RedirectResponse(f"{frontend}/auth/callback?error={httpx.QueryParams({'e': error})['e']}", status_code=302)
    if not code or not state:
        return RedirectResponse(f"{frontend}/auth/callback?error=missing_code", status_code=302)

    client_id, client_secret = _credentials(provider)

    try:
        payload = _read_state(state, provider)
        profile = await _fetch_profile(provider, code, client_id, client_secret)
        token_payload = await _upsert_oauth_user(provider, profile, payload.get("role", "student"))
    except HTTPException as exc:
        detail = httpx.QueryParams({"e": str(exc.detail)})["e"]
        return RedirectResponse(f"{frontend}/auth/callback?error={detail}", status_code=302)

    params = httpx.QueryParams({"token": token_payload["access_token"], "role": token_payload["user"]["role"]})
    return RedirectResponse(f"{frontend}/auth/callback?{params}", status_code=302)


async def _fetch_profile(provider: str, code: str, client_id: str, client_secret: str) -> dict:
    """Exchange the one-time code for a token, then read name + email."""
    config = PROVIDERS[provider]

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_response = await client.post(
            config["token_url"],
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code >= 400:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"{provider} rejected the authorization code.")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"{provider} did not return an access token.")

        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        user_response = await client.get(config["userinfo_url"], headers=headers)
        user_response.raise_for_status()
        data = user_response.json()

        if provider == "google":
            email, name = data.get("email"), data.get("name") or data.get("given_name")
        else:
            email, name = data.get("email"), data.get("name") or data.get("login")
            if not email:
                # GitHub hides the address unless it is public — ask the emails endpoint.
                emails = await client.get(config["emails_url"], headers=headers)
                if emails.status_code < 400:
                    verified = [e for e in emails.json() if e.get("verified")]
                    primary = next((e for e in verified if e.get("primary")), None) or (verified[0] if verified else None)
                    email = primary.get("email") if primary else None

    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Could not read a verified email from {provider}.")

    return {"email": email.lower(), "name": name or email.split("@")[0]}


async def _upsert_oauth_user(provider: str, profile: dict, role: str) -> dict:
    """Sign in an existing user, or create one on first social login."""
    async with get_session() as session:
        result = await session.execute(select(User).where(User.email == profile["email"]))
        user = result.scalar_one_or_none()

        if user:
            # Remember the provider so the password path can explain itself later.
            if not user.oauth_provider:
                user.oauth_provider = provider
            if not user.is_verified:
                user.is_verified = True
            await session.commit()
            return _oauth_token(user)

        user = User(
            name=profile["name"],
            email=profile["email"],
            password_hash=None,
            role=role,
            oauth_provider=provider,
            is_verified=True,
        )
        session.add(user)
        try:
            await session.flush()
        except IntegrityError:
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already registered.")

        if role == "student":
            session.add(Student(user_id=user.id, name=user.name, email=user.email))
        elif role == "recruiter":
            session.add(Recruiter(user_id=user.id, name=user.name, email=user.email, company=user.name))

        await session.commit()
        return _oauth_token(user)


def _oauth_token(user: User) -> dict:
    return {
        "access_token": create_access_token(user.id, user.role),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
        },
    }
