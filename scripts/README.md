# MailMind Test Scripts

Bu klasör test scriptlerini içerir.

## Test Scripts

### `test-services.sh` (Linux/Mac)
Tüm servislerin durumunu test eder.

```bash
chmod +x scripts/test-services.sh
./scripts/test-services.sh
```

### `test-services.ps1` (Windows PowerShell)
Windows için test scripti.

```powershell
.\scripts\test-services.ps1
```

## Manuel Test

### Docker Servislerini Başlat
```bash
docker-compose up -d
```

### Servis Durumunu Kontrol Et
```bash
docker-compose ps
```

### Logları İzle
```bash
docker-compose logs -f
```

### Belirli Bir Servisin Loglarını İzle
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Servisleri Durdur
```bash
docker-compose down
```

### Servisleri Durdur ve Volumes'u Sil
```bash
docker-compose down -v
```

## Health Check URLs

### Database Servisleri
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **RabbitMQ Management**: http://localhost:15672 (user: mailmind, pass: mailmind_dev_password)
- **Elasticsearch**: http://localhost:9200
- **MinIO Console**: http://localhost:9001 (user: minioadmin, pass: minioadmin123)

### Backend Servisleri (Eğer çalışıyorsa)
- **Auth Service**: http://localhost:8001/health
- **Mail Service**: http://localhost:8002/health
- **ML Service**: http://localhost:8003/health
- **User Service**: http://localhost:8004/health
- **Storage Service**: http://localhost:8005/health
- **Search Service**: http://localhost:8006/health

## API Dokümantasyonu (Eğer çalışıyorsa)

Her backend servis FastAPI Swagger UI'ye sahiptir:
- http://localhost:8001/docs (Auth Service)
- http://localhost:8002/docs (Mail Service)
- http://localhost:8003/docs (ML Service)
- http://localhost:8004/docs (User Service)
- http://localhost:8005/docs (Storage Service)
- http://localhost:8006/docs (Search Service)

