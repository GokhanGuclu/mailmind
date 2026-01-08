"""
MailMind - ML Service
Mail kategorizasyon servisi (makine öğrenmesi)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys

# mailmind-model paketini path'e ekle
sys.path.insert(0, "/app/mailmind-model")

app = FastAPI(
    title="MailMind ML Service",
    description="Mail kategorizasyon servisi",
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
        "service": "MailMind ML Service",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": False  # Model yükleme durumu (sonra eklenecek)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "model_loaded": False  # Model yükleme durumu
    }


# API Routes (sonra eklenecek)
# @app.post("/api/v1/ml/categorize")
# @app.post("/api/v1/ml/categorize/batch")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=True
    )

