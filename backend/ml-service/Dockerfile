FROM python:3.11-slim

WORKDIR /app

# System dependencies (ML libraries için gerekli)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ML model paketi (mailmind-model)
# Volume'dan mount edilecek veya COPY ile kopyalanacak
COPY ../../mailmind-model /app/mailmind-model

# Model dosyaları (volume'dan mount edilecek)
RUN mkdir -p /app/models

# Application code
COPY . .

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8003/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]

