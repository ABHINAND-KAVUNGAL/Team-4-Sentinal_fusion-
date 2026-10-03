from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered
from app.api import (
    auth, investigations, evidence, timeline, graph, findings, risk, reports, audit, system, search
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Ensure storage directories exist
os.makedirs(os.path.join(settings.STORAGE_PATH, "evidence"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_PATH, "reports"), exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sentinel Fusion - AI-assisted Digital Intelligence Fusion Platform for Digital Forensics & Investigations"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(investigations.router, prefix=settings.API_PREFIX)
app.include_router(evidence.router, prefix=settings.API_PREFIX)
app.include_router(timeline.router, prefix=settings.API_PREFIX)
app.include_router(graph.router, prefix=settings.API_PREFIX)
app.include_router(findings.router, prefix=settings.API_PREFIX)
app.include_router(risk.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)
app.include_router(system.router, prefix=settings.API_PREFIX)
app.include_router(search.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "api_docs": "/docs"
    }

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Hide internal stack trace from client, return consistent error shape
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"data": None, "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred during forensic processing."}}
    )
