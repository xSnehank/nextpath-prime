"""The database connection: one SQLAlchemy engine per URL, one transaction per request.

Routers never write SQL; they pass the connection to app/repositories/. In mock mode no database is opened.
"""

from collections.abc import Iterator
from functools import cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import Connection

from app.config import Settings, get_settings


def _driver_url(url: str) -> str:
    """Supabase gives postgresql://...; SQLAlchemy needs to be told to use psycopg 3."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url.removeprefix(prefix)
    return url


@cache
def engine_for(url: str) -> Engine:
    return create_engine(
        _driver_url(url),
        pool_pre_ping=True,  # drop connections the pooler closed while idle
        pool_size=5,
        max_overflow=5,
        pool_recycle=300,
        # prepare_threshold=None: Supabase's poolers don't support psycopg's prepared statements.
        connect_args={"prepare_threshold": None, "connect_timeout": 10},
    )


def get_connection(settings: Annotated[Settings, Depends(get_settings)]) -> Iterator[Connection | None]:
    """A connection inside one transaction: committed if the request succeeds, rolled back if it raises.

    Yields None in mock mode, where nothing touches the database.
    """
    if settings.use_mocks or settings.database_url is None:
        yield None
        return
    with engine_for(settings.database_url.get_secret_value()).begin() as connection:
        yield connection


# In live mode this is always a Connection; routers only use it after checking settings.use_mocks.
ConnDep = Annotated[Connection, Depends(get_connection)]
