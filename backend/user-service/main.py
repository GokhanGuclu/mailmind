"""
MailMind - User Service
Kullanıcı profil ve tercih yönetimi servisi
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(
    title="MailMind User Service",
    description="Kullanıcı profil ve tercih yönetimi servisi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MailMind User Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "user-service",
        "version": "1.0.0"
    }


# API Routes (sonra eklenecek)
# @app.get("/api/v1/users/me")
# @app.patch("/api/v1/users/me")
# @app.get("/api/v1/users/preferences")
# @app.patch("/api/v1/users/preferences")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True
    )

