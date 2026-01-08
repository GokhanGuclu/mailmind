"""
MailMind - Mail Service
Mail gönderme/alma ve yönetim servisi
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(
    title="MailMind Mail Service",
    description="Mail gönderme/alma ve yönetim servisi",
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
        "service": "MailMind Mail Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mail-service",
        "version": "1.0.0"
    }


# API Routes (sonra eklenecek)
# @app.get("/api/v1/mails")
# @app.get("/api/v1/mails/{mail_id}")
# @app.post("/api/v1/mails")
# @app.patch("/api/v1/mails/{mail_id}")
# @app.delete("/api/v1/mails/{mail_id}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True
    )

