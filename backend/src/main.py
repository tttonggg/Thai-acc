from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.database import init_db
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
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_id": str(request.state.request_id) if hasattr(request.state, 'request_id') else None}
    )

# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    return {"message": "Thai ACC API", "docs": "/docs"}
