# MailMind - Docker ve Mikroservis Yapılandırması

## 🐳 Docker Yapısı

### Root `docker-compose.yml`
Tüm servisleri bir arada çalıştırmak için

```yaml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mailmind
      POSTGRES_USER: mailmind
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mailmind"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: mailmind
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Search Engine
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Object Storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # API Gateway
  api-gateway:
    build:
      context: ./backend/api-gateway
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - auth-service
      - mail-service
      - ml-service
    volumes:
      - ./backend/api-gateway/nginx.conf:/etc/nginx/nginx.conf
    environment:
      - BACKEND_URL=http://backend
    networks:
      - mailmind-network

  # Backend Services
  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://mailmind:${POSTGRES_PASSWORD}@postgres:5432/mailmind
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ALGORITHM=HS256
    volumes:
      - ./backend/auth-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8001 --reload
    networks:
      - mailmind-network

  mail-service:
    build:
      context: ./backend/mail-service
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      storage-service:
        condition: service_started
      ml-service:
        condition: service_started
    environment:
      - DATABASE_URL=postgresql://mailmind:${POSTGRES_PASSWORD}@postgres:5432/mailmind
      - REDIS_URL=redis://redis:6379/0
      - RABBITMQ_URL=amqp://mailmind:${RABBITMQ_PASSWORD}@rabbitmq:5672/
      - STORAGE_SERVICE_URL=http://storage-service:8005
      - ML_SERVICE_URL=http://ml-service:8003
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    volumes:
      - ./backend/mail-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8002 --reload
    networks:
      - mailmind-network

  ml-service:
    build:
      context: ./backend/ml-service
      dockerfile: Dockerfile
    ports:
      - "8003:8003"
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS_URL=redis://redis:6379/1
      - MODEL_PATH=/app/models
      - CACHE_TTL=86400
    volumes:
      - ./mailmind-model:/app/mailmind-model
      - ./mailmind-model/model:/app/models
      - ./backend/ml-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8003 --reload
    networks:
      - mailmind-network

  user-service:
    build:
      context: ./backend/user-service
      dockerfile: Dockerfile
    ports:
      - "8004:8004"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://mailmind:${POSTGRES_PASSWORD}@postgres:5432/mailmind
    volumes:
      - ./backend/user-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8004 --reload
    networks:
      - mailmind-network

  storage-service:
    build:
      context: ./backend/storage-service
      dockerfile: Dockerfile
    ports:
      - "8005:8005"
    depends_on:
      minio:
        condition: service_healthy
    environment:
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
      - MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - MINIO_BUCKET=attachments
    volumes:
      - ./backend/storage-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8005 --reload
    networks:
      - mailmind-network

  search-service:
    build:
      context: ./backend/search-service
      dockerfile: Dockerfile
    ports:
      - "8006:8006"
    depends_on:
      elasticsearch:
        condition: service_healthy
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    volumes:
      - ./backend/search-service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8006 --reload
    networks:
      - mailmind-network

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api-gateway
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost/api/v1
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
    networks:
      - mailmind-network

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  elasticsearch_data:
  minio_data:

networks:
  mailmind-network:
    driver: bridge
```

---

## 🐳 Dockerfile'lar

### Backend Service Dockerfile (Ortak)

`backend/{service}/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### ML Service Dockerfile

`backend/ml-service/Dockerfile`:
```dockerfile
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

# ML model paketi
COPY ../../mailmind-model /app/mailmind-model

# Model dosyaları (volume'dan mount edilebilir)
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
```

### Frontend Dockerfile

`frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

## 🔧 Service-Specific Configurations

### API Gateway Nginx Config

`backend/api-gateway/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server auth-service:8001;
        server mail-service:8002;
        server ml-service:8003;
        server user-service:8004;
        server storage-service:8005;
        server search-service:8006;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name localhost;

        # API routes
        location /api/v1/auth/ {
            limit_req zone=api_limit burst=20;
            proxy_pass http://auth-service:8001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/v1/mails/ {
            limit_req zone=api_limit burst=20;
            proxy_pass http://mail-service:8002/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/v1/ml/ {
            limit_req zone=api_limit burst=10;
            proxy_pass http://ml-service:8003/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## 🚀 Development Workflow

### Docker Compose Commands

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Belirli bir servis loglarını izle
docker-compose logs -f ml-service

# Servisleri durdur
docker-compose down

# Servisleri durdur ve volumes'u sil
docker-compose down -v

# Belirli bir servisi rebuild et
docker-compose build ml-service
docker-compose up -d ml-service

# Servis durumunu kontrol et
docker-compose ps

# Health check
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
```

### Service Development

```bash
# Sadece database'leri çalıştır
docker-compose up -d postgres redis rabbitmq

# Backend servisi local'de çalıştır (database container'lara bağlanır)
cd backend/mail-service
python -m uvicorn main:app --reload --port 8002

# Frontend local'de çalıştır
cd frontend
npm run dev
```

---

## 📦 Production Docker Compose

Production için ayrı `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Production services (scaled)
  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
    restart: always

  mail-service:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '2'
          memory: 1G

  ml-service:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
    # GPU support (opsiyonel)
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]
```

---

## 🔐 Environment Variables

`.env.example`:
```env
# Database
POSTGRES_PASSWORD=secure_password_here
DATABASE_URL=postgresql://mailmind:secure_password_here@postgres:5432/mailmind

# Redis
REDIS_URL=redis://redis:6379/0

# RabbitMQ
RABBITMQ_PASSWORD=secure_password_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 📊 Health Checks

Her servis `/health` endpoint'i:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "checks": {
            "database": "ok",
            "redis": "ok",
            "model": "loaded"
        }
    }
```

---

## 🧪 Testing in Docker

### Integration Tests

```dockerfile
# Test stage
FROM python:3.11-slim AS test
WORKDIR /app
COPY requirements.txt requirements-test.txt ./
RUN pip install --no-cache-dir -r requirements-test.txt
COPY . .
CMD ["pytest", "tests/"]
```

Run tests:
```bash
docker-compose run --rm auth-service pytest
```

---

## 📈 Monitoring in Docker

### Prometheus Config

`docker-compose.monitoring.yml`:
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 🚢 Deployment

### Docker Registry

```bash
# Build
docker build -t mailmind/ml-service:1.0.0 ./backend/ml-service

# Tag
docker tag mailmind/ml-service:1.0.0 registry.example.com/mailmind/ml-service:1.0.0

# Push
docker push registry.example.com/mailmind/ml-service:1.0.0
```

### Kubernetes (Future)

Kubernetes deployment için ayrı manifest'ler hazırlanacak (infrastructure/kubernetes/)

