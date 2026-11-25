from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import connect_database, close_database
from .routes import auth, videos

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_database()
    yield
    await close_database()

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["GET","POST"], allow_headers=["Authorization","Content-Type"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(videos.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"name":"GOVIND TUBE","message":"Watch. Create. Share. Discover."}

@app.get("/health")
async def health():
    return {"status":"ok","service":"govind-tube-api"}
