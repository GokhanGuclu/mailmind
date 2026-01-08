# MailMind - Mimari Tasarım

## 🏗️ Mikroservis Mimarisi

### Servis Listesi

#### 1. **API Gateway**
- **Teknoloji**: Nginx / Kong / Traefik
- **Görev**: 
  - Tüm isteklerin tek giriş noktası
  - Rate limiting
  - Authentication/Authorization kontrolü
  - Load balancing
  - SSL termination
  - Request routing

#### 2. **Frontend Service** (Next.js)
- **Port**: 3000
- **Görev**:
  - Web arayüzü
  - SSR/SSG
  - Client-side routing
  - State management (Zustand/Redux)
  - Real-time updates (WebSocket)

#### 3. **Auth Service** (FastAPI)
- **Port**: 8001
- **Görev**:
  - User registration/login
  - JWT token generation/validation
  - OAuth2 (Google, GitHub, etc.)
  - Password reset
  - Session management
- **Database**: PostgreSQL (users, sessions, tokens)

#### 4. **Mail Service** (FastAPI)
- **Port**: 8002
- **Görev**:
  - Mail gönderme (SMTP)
  - Mail alma (IMAP)
  - Mail listesi/detay
  - Mail silme/arşivleme
  - Klasör yönetimi
  - Filtreler ve kurallar
- **Database**: PostgreSQL (mails, folders, filters)
- **Queue**: RabbitMQ/Redis (async mail processing)

#### 5. **ML Service** (FastAPI)
- **Port**: 8003
- **Görev**:
  - Mail kategorizasyon (tahmin_yap)
  - Batch processing
  - Model inference
  - Model versioning
- **Model**: mailmind-model paketi
- **Cache**: Redis (prediction cache)

#### 6. **User Service** (FastAPI)
- **Port**: 8004
- **Görev**:
  - User profile management
  - Preferences
  - Settings
  - Account management
- **Database**: PostgreSQL

#### 7. **Storage Service** (FastAPI + MinIO)
- **Port**: 8005
- **Görev**:
  - Attachment storage
  - File upload/download
  - Image processing
  - Virus scanning
- **Storage**: MinIO (S3-compatible) veya AWS S3

#### 8. **Search Service** (FastAPI + Elasticsearch)
- **Port**: 8006
- **Görev**:
  - Full-text search
  - Advanced filtering
  - Search indexing
- **Search Engine**: Elasticsearch veya OpenSearch

## 🔄 Servisler Arası İletişim

### Synchronous (HTTP/REST)
```
Frontend → API Gateway → Auth Service
Frontend → API Gateway → Mail Service
Mail Service → ML Service (kategorizasyon)
Mail Service → Storage Service (attachment)
```

### Asynchronous (Message Queue)
```
Mail Service → RabbitMQ → ML Service (batch kategorizasyon)
Mail Service → RabbitMQ → Search Service (indexing)
Mail Service → RabbitMQ → Notification Service (email alerts)
```

### Event-Driven (WebSocket/SSE)
```
Frontend ←→ API Gateway ←→ Mail Service (real-time updates)
```

## 📊 Veri Akışı

### Mail Gönderme Akışı
```
1. Frontend → API Gateway → Mail Service
2. Mail Service → Validation
3. Mail Service → Storage Service (attachment varsa)
4. Mail Service → RabbitMQ (async processing)
5. Mail Service → SMTP Server (gönderme)
6. Mail Service → PostgreSQL (kaydetme)
7. Mail Service → ML Service (kategorizasyon)
8. Mail Service → Search Service (indexing)
9. Frontend ← WebSocket (notification)
```

### Mail Alma Akışı
```
1. IMAP Server → Mail Service (polling/webhook)
2. Mail Service → Storage Service (attachment)
3. Mail Service → ML Service (kategorizasyon)
4. Mail Service → PostgreSQL (kaydetme)
5. Mail Service → Search Service (indexing)
6. Frontend ← WebSocket (yeni mail notification)
```

### Kategorizasyon Akışı
```
1. Mail Service → ML Service API (POST /categorize)
2. ML Service → Model Load (mailmind-model)
3. ML Service → Prediction
4. ML Service → Redis Cache (opsiyonel)
5. ML Service → Response (tahmin, olasiliklar)
6. Mail Service → Update Mail (category field)
```

## 🗄️ Veritabanı Yapısı

### PostgreSQL Database (Ana)
- **Users Database**: auth-service
- **Mail Database**: mail-service
- **User Management**: user-service

### Redis
- **Session Storage**: Auth Service
- **Cache Layer**: ML Service, Mail Service
- **Rate Limiting**: API Gateway
- **Pub/Sub**: Real-time notifications

### Elasticsearch
- **Mail Index**: Full-text search
- **Metadata Index**: Filtering

### MinIO/S3
- **Attachments**: Dosya depolama
- **Avatars**: User profile images

## 🔐 Güvenlik Katmanları

1. **API Gateway**: Rate limiting, DDoS protection
2. **Auth Service**: JWT validation, OAuth2
3. **Service-to-Service**: mTLS (mutual TLS)
4. **Database**: Connection encryption, credentials management
5. **Storage**: Encrypted at rest
6. **API**: HTTPS only, CORS policy

## 📈 Scalability Stratejisi

### Horizontal Scaling
- Her servis bağımsız scale edilebilir
- Stateless servisler (session Redis'te)
- Load balancer ile dağıtım

### Caching Strategy
- **Redis**: Hot data (mail listesi, user sessions)
- **CDN**: Static assets (frontend)
- **Application Cache**: ML predictions

### Database Sharding
- User-based sharding (gelecekte)
- Mail data partitioning

## 🔍 Monitoring ve Logging

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Jaeger**: Distributed tracing

### Logging
- **ELK Stack**: Centralized logging
  - Elasticsearch: Log storage
  - Logstash: Log processing
  - Kibana: Log visualization

### Health Checks
- Her servis `/health` endpoint'i
- Liveness ve readiness probes
- Database connection checks

## 🚀 Deployment Model

### Docker Containers
Her servis ayrı container:
- `frontend:latest`
- `api-gateway:latest`
- `auth-service:latest`
- `mail-service:latest`
- `ml-service:latest`
- `user-service:latest`
- `storage-service:latest`
- `search-service:latest`

### Docker Compose (Development)
Tüm servisleri aynı anda çalıştırma

### Kubernetes (Production)
- Deployments
- Services
- Ingress
- ConfigMaps
- Secrets
- PersistentVolumes

## 📦 Servis Bağımlılıkları

```
Frontend → API Gateway
API Gateway → Auth Service (auth check)
API Gateway → Mail Service
API Gateway → User Service
Mail Service → ML Service
Mail Service → Storage Service
Mail Service → Search Service
Mail Service → PostgreSQL
Auth Service → PostgreSQL
User Service → PostgreSQL
ML Service → Redis (cache)
Storage Service → MinIO
Search Service → Elasticsearch
```

## 🔄 Servis Versiyonlama

- **Semantic Versioning**: v1.0.0, v1.1.0, v2.0.0
- **API Versioning**: `/api/v1/`, `/api/v2/`
- **Backward Compatibility**: Eski versiyonlar desteklenir

## 🧪 Testing Strategy

### Unit Tests
- Her servis kendi unit testlerine sahip

### Integration Tests
- Servisler arası iletişim testleri
- Database integration tests

### E2E Tests
- Frontend → Backend → Database flow
- Playwright/Cypress

### Load Tests
- K6 veya Locust
- Performance benchmarking

