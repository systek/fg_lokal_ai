from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from romby.bookings.router import router as bookings_router
from romby.rooms.router import router as rooms_router
from romby.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    seed_database()  # runs once at startup, before the first request
    yield


app = FastAPI(title="Romby", lifespan=lifespan)
app.include_router(rooms_router)
app.include_router(bookings_router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # FastAPI's default body is {"detail": ...}; the frontend reads "message".
    return JSONResponse({"status": exc.status_code, "message": exc.detail}, status_code=exc.status_code)


if __name__ == "__main__":
    # Lets you start the app with the run button in PyCharm/VS Code, or `python -m romby.main`.
    uvicorn.run("romby.main:app", host="localhost", port=8080, reload=True)
