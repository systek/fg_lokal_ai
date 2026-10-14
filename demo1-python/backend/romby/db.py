from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

# In-memory SQLite: no Docker, no external database, works offline.
# Every new connection to "sqlite://" gets its own empty database, so StaticPool makes
# the whole app share one connection. check_same_thread=False is needed because FastAPI
# runs plain `def` endpoints in a thread pool.
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
SessionLocal = sessionmaker(engine)


class Base(DeclarativeBase):
    pass


def get_session() -> Iterator[Session]:
    # One session per request; FastAPI closes it when the response has been sent.
    with SessionLocal() as session:
        yield session


# Declare a parameter with this type and FastAPI injects the request's session.
SessionDep = Annotated[Session, Depends(get_session)]
