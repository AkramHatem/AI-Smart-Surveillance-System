from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import get_settings
from app.api.v1.router import router as v1_router
from app.services.storage_service import ensure_bucket

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("Starting up SurveillanceAI backend…")
    try:
        ensure_bucket()
        logger.info("MinIO bucket ready")
    except Exception as e:
        logger.warning(f"MinIO not reachable at startup (will retry on first request): {e}")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("Shutting down…")


app = FastAPI(
    title="SurveillanceAI API",
    description="AI-powered incident detection and emergency response system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(v1_router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "env": settings.app_env}


@app.get("/", tags=["health"])
async def root():
    return {
        "message": "SurveillanceAI API",
        "docs": "/docs",
        "version": "1.0.0",
    }
