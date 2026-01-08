# MailMind - Deployment Stratejisi

## 🚀 Deployment Seçenekleri

### 1. Docker Compose (Development/Staging)
Basit ve hızlı deployment için

### 2. Kubernetes (Production)
Ölçeklenebilir ve production-ready

### 3. Cloud Platform (Production)
AWS, GCP, Azure - Managed services

---

## 🐳 Docker Compose Deployment

### Production Docker Compose

`docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api-gateway
    restart: always

  # Frontend (Production Build)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.mailmind.com/v1
    restart: always

  # Backend Services
  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 2
    restart: always

  mail-service:
    build:
      context: ./backend/mail-service
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 3
    restart: always

  # Database
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      POSTGRES_DB: mailmind
      POSTGRES_USER: mailmind
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    restart: always
    backup:
      schedule: "0 2 * * *"  # Daily at 2 AM

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus:/etc/prometheus
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: always

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

### Deployment Steps

```bash
# 1. Environment variables setup
cp .env.example .env.production
# Edit .env.production with production values

# 2. SSL certificates (Let's Encrypt)
certbot certonly --standalone -d mailmind.com -d www.mailmind.com

# 3. Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec auth-service alembic upgrade head
docker-compose -f docker-compose.prod.yml exec mail-service alembic upgrade head

# 5. Health check
curl https://api.mailmind.com/v1/health
```

---

## ☸️ Kubernetes Deployment

### Kubernetes Manifests

#### Namespace

`k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mailmind
```

#### ConfigMap

`k8s/configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mailmind-config
  namespace: mailmind
data:
  DATABASE_URL: "postgresql://mailmind:password@postgres-service:5432/mailmind"
  REDIS_URL: "redis://redis-service:6379/0"
  ML_SERVICE_URL: "http://ml-service:8003"
```

#### Secrets

`k8s/secrets.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mailmind-secrets
  namespace: mailmind
type: Opaque
data:
  POSTGRES_PASSWORD: <base64-encoded>
  JWT_SECRET: <base64-encoded>
  SMTP_PASSWORD: <base64-encoded>
```

#### Deployment - ML Service

`k8s/ml-service-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-service
  namespace: mailmind
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
      - name: ml-service
        image: mailmind/ml-service:1.0.0
        ports:
        - containerPort: 8003
        env:
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: mailmind-config
              key: REDIS_URL
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8003
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8003
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: model-volume
          mountPath: /app/models
      volumes:
      - name: model-volume
        persistentVolumeClaim:
          claimName: model-pvc
```

#### Service

`k8s/ml-service-service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-service
  namespace: mailmind
spec:
  selector:
    app: ml-service
  ports:
  - port: 8003
    targetPort: 8003
  type: ClusterIP
```

#### Ingress

`k8s/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mailmind-ingress
  namespace: mailmind
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.mailmind.com
    secretName: mailmind-tls
  rules:
  - host: api.mailmind.com
    http:
      paths:
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 8001
      - path: /api/v1/mails
        pathType: Prefix
        backend:
          service:
            name: mail-service
            port:
              number: 8002
```

### Deployment Commands

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl create secret generic mailmind-secrets \
  --from-env-file=.env.production \
  --namespace=mailmind

# 3. Create configmap
kubectl apply -f k8s/configmap.yaml

# 4. Deploy services
kubectl apply -f k8s/ml-service-deployment.yaml
kubectl apply -f k8s/ml-service-service.yaml

# 5. Deploy ingress
kubectl apply -f k8s/ingress.yaml

# 6. Check status
kubectl get pods -n mailmind
kubectl get services -n mailmind
kubectl logs -f deployment/ml-service -n mailmind
```

---

## ☁️ Cloud Deployment

### AWS ECS/Fargate

**Services:**
- ECS/Fargate: Container orchestration
- RDS: PostgreSQL
- ElastiCache: Redis
- S3: Object storage
- CloudFront: CDN
- Route53: DNS
- ACM: SSL certificates

### Google Cloud Platform (GCP)

**Services:**
- Cloud Run: Serverless containers
- Cloud SQL: PostgreSQL
- Cloud Memorystore: Redis
- Cloud Storage: Object storage
- Cloud Load Balancing
- Cloud DNS

### Azure

**Services:**
- Azure Container Instances
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Blob Storage
- Azure Front Door
- Azure DNS

---

## 🔄 CI/CD Pipeline

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t mailmind/ml-service:${{ github.sha }} ./backend/ml-service
          docker tag mailmind/ml-service:${{ github.sha }} mailmind/ml-service:latest

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push mailmind/ml-service:${{ github.sha }}
          docker push mailmind/ml-service:latest

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ml-service ml-service=mailmind/ml-service:${{ github.sha }} -n mailmind

      - name: Health check
        run: |
          sleep 30
          curl -f https://api.mailmind.com/v1/health || exit 1
```

---

## 📊 Monitoring ve Logging

### Prometheus + Grafana

**Metrics:**
- Request rate
- Response time
- Error rate
- CPU/Memory usage
- Database connections
- Queue length

### ELK Stack

**Logs:**
- Application logs
- Access logs
- Error logs
- Audit logs

### Alerting

**Alerts:**
- High error rate
- High response time
- Service down
- Disk space
- Memory usage

---

## 🔐 Security

### SSL/TLS
- Let's Encrypt certificates
- Auto-renewal
- HSTS headers

### Firewall
- WAF (Web Application Firewall)
- Rate limiting
- DDoS protection

### Secrets Management
- Kubernetes Secrets
- HashiCorp Vault
- AWS Secrets Manager

---

## 💾 Backup Strategy

### Database Backups
- Daily automated backups
- Retention: 30 days
- Off-site storage

### Storage Backups
- S3 versioning
- Cross-region replication
- Regular backup verification

### Recovery Plan
- Backup restore procedure
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 24 hours

---

## 📈 Scaling Strategy

### Horizontal Scaling
- Auto-scaling based on CPU/Memory
- Load balancer distribution
- Service mesh (Istio)

### Vertical Scaling
- Resource limits adjustment
- GPU support for ML Service (opsiyonel)

---

## 🔄 Rollback Strategy

### Blue-Green Deployment
- Two identical environments
- Switch traffic between environments
- Instant rollback

### Canary Deployment
- Gradual traffic shift
- Monitor metrics
- Rollback if issues

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing (unit, integration, E2E)
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation updated

### Deployment
- [ ] Backup current version
- [ ] Deploy new version
- [ ] Run migrations
- [ ] Health checks passing
- [ ] Smoke tests passing

### Post-Deployment
- [ ] Monitor metrics
- [ ] Check logs
- [ ] User acceptance testing
- [ ] Rollback plan ready

---

## 🚨 Incident Response

### Runbook
- Service down procedure
- Database issue procedure
- Performance degradation procedure
- Security incident procedure

### Escalation
- Level 1: On-call engineer
- Level 2: Senior engineer
- Level 3: CTO/Technical lead

