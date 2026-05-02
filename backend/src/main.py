from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded

from .core.config import get_settings
from .core.database import init_db, engine
from .core.limiter import limiter
from .api.v1.router import api_router

# Import all models so Base.metadata knows about them
from .models import Company, User, Contact, Product, PurchaseOrder, PurchaseInvoice, ExpenseClaim, ETaxSubmission

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Thai ACC API...", env=settings.env)
    init_db()
    yield
    # Shutdown
    logger.info("Shutting down Thai ACC API...")


app = FastAPI(
    title="Thai ACC API",
    description="Thai cloud accounting SaaS - PEAK Alternative",
    version="0.2.2-alpha",
    lifespan=lifespan,
)
app.state.limiter = limiter

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    db_ok = False
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": "0.2.2-alpha"
    }


@app.get("/")
async def root():
    return {"message": "Thai ACC API", "docs": "/docs", "version": "0.2.2-alpha"}
