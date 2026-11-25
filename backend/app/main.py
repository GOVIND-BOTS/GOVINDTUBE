from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import close_database, connect_database
from .routes import auth, videos


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_database()
    yield
    await close_database()


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Range", "If-Range", "If-None-Match"],
    expose_headers=["Accept-Ranges", "Content-Range", "Content-Length", "ETag"],
)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(videos.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"name": "GOVIND TUBE", "message": "Watch. Create. Share. Discover."}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "govind-tube-api"}
