from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.models import Base

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None

# Hosted Postgres providers hand out psycopg-style URLs. asyncpg speaks a
# different dialect of the same string, so normalise rather than making every
# deployment hand-edit the URL:
#   postgresql://            → postgresql+asyncpg://
#   ?sslmode=require         → connect_args={"ssl": "require"}  (asyncpg rejects
#   &channel_binding=require   both parameters outright)
_SSL_PARAMS = {"sslmode", "channel_binding"}


def _normalise_url(raw: str) -> tuple[str, dict]:
    url = raw.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]

    parts = urlsplit(url)
    params = parse_qsl(parts.query, keep_blank_values=True)
    kept = [(k, v) for k, v in params if k.lower() not in _SSL_PARAMS]
    dropped = {k.lower(): v for k, v in params if k.lower() in _SSL_PARAMS}

    connect_args: dict = {}
    sslmode = dropped.get("sslmode")
    if sslmode and sslmode != "disable":
        connect_args["ssl"] = "require"
    elif parts.hostname and not parts.hostname.endswith((".localhost", "localhost", "127.0.0.1")):
        # Every managed provider requires TLS; only a local socket does not.
        connect_args["ssl"] = "require"

    return urlunsplit(parts._replace(query=urlencode(kept))), connect_args


def get_engine():
    global _engine, _session_factory
    if _engine is None:
        url, connect_args = _normalise_url(settings.database_url)
        _engine = create_async_engine(url, pool_pre_ping=True, connect_args=connect_args)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_session() -> AsyncSession:
    """Return a new session. Caller is responsible for closing/committing it."""
    get_engine()
    return _session_factory()


async def ping() -> bool:
    """Return True if the database is reachable."""
    try:
        async with get_session() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def init_db() -> None:
    """Create all tables if they don't already exist."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_engine() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
