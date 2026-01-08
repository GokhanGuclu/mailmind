# MailMind - Tam Özellikli Mail Servisi

MailMind, makine öğrenmesi destekli otomatik kategorizasyon özelliği ile modern bir e-posta servisidir.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker ve Docker Compose
- Python 3.11+ (backend geliştirme için)
- Node.js 20+ (frontend geliştirme için)

### Kurulum

1. **Repository'yi klonlayın**
```bash
git clone <repository-url>
cd MakineOgrenmesi
```

2. **Environment variables ayarlayın**
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

3. **Docker servislerini başlatın**
```bash
docker-compose up -d
```

Bu komut şu servisleri başlatır:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672, Management UI: 15672)
- Elasticsearch (port 9200)
- MinIO (port 9000, Console: 9001)

4. **Servis durumunu kontrol edin**
```bash
docker-compose ps
```

5. **Logları izleyin**
```bash
docker-compose logs -f
```

## 📁 Proje Yapısı

```
MailMind/
├── backend/              # Backend mikroservisler
│   ├── auth-service/     # Authentication servisi
│   ├── mail-service/     # Mail işlemleri servisi
│   ├── ml-service/       # ML kategorizasyon servisi
│   ├── user-service/     # Kullanıcı yönetimi
│   ├── storage-service/  # Dosya depolama servisi
│   └── search-service/   # Arama servisi
├── frontend/             # Next.js frontend uygulaması
├── mailmind-model/       # ML model paketi (hazır)
├── docker/               # Docker yapılandırmaları
├── yolharitası/         # Proje dokümantasyonu
├── docker-compose.yml    # Docker Compose yapılandırması
└── README.md            # Bu dosya
```

## 🔧 Geliştirme

### Backend Servisleri

Her servis bağımsız olarak geliştirilebilir. Backend servislerini local'de çalıştırmak için:

```bash
# Database servislerini başlat
docker-compose up -d postgres redis rabbitmq

# Servis klasörüne git
cd backend/auth-service

# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies yükle
pip install -r requirements.txt

# Servisi çalıştır
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend

# Dependencies yükle
npm install

# Development server başlat
npm run dev
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için `yolharitası/` klasörüne bakın:

- [Genel Bakış](yolharitası/00-GENEL-BAKIS.md)
- [Mimari Tasarım](yolharitası/01-MIMARI-TASARIM.md)
- [Teknoloji Stack](yolharitası/02-TEKNOLOJI-STACK.md)
- [Veritabanı Tasarımı](yolharitası/03-VERITABANI-TASARIMI.md)
- [API Spesifikasyonları](yolharitası/04-API-SPESIFIKASYONLARI.md)
- [Docker ve Mikroservisler](yolharitası/05-DOCKER-MIKROSERVISLER.md)
- [Geliştirme Aşamaları](yolharitası/06-GELISTIRME-ASAMALARI.md)
- [Deployment](yolharitası/07-DEPLOYMENT.md)
- [Güvenlik](yolharitası/08-GUVENLIK.md)

## 🔐 Güvenlik

- `.env` dosyasını Git'e commit etmeyin
- Production'da güçlü parolalar kullanın
- JWT_SECRET'i düzenli olarak değiştirin
- SSL/TLS kullanın

## 🐛 Sorun Giderme

### PostgreSQL bağlantı hatası
```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Port çakışması
`.env` dosyasında portları değiştirin veya `docker-compose.yml` dosyasını düzenleyin.

### Servis başlamıyor
```bash
# Tüm servisleri durdur
docker-compose down

# Volumes'u temizle (dikkat: veriler silinir!)
docker-compose down -v

# Tekrar başlat
docker-compose up -d
```

## 📊 Geliştirme Durumu

- [x] Faz 1: Temel Altyapı (Devam ediyor)
  - [x] Docker Compose yapılandırması
  - [ ] Backend servis yapıları
  - [ ] Frontend temel yapı
- [ ] Faz 2: Authentication ve Core Backend
- [ ] Faz 3: ML Entegrasyonu
- [ ] Faz 4: Frontend Core Features
- [ ] Faz 5: Gelişmiş Mail Özellikleri
- [ ] Faz 6: Arama ve Gelişmiş Özellikler
- [ ] Faz 7: Production Hazırlık

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 📧 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.
