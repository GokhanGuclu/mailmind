# MailMind - API Spesifikasyonları

## 🌐 API Genel Yapısı

### Base URLs
- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.mailmind.com/v1`

### Authentication
Tüm API istekleri (auth hariç) JWT token gerektirir:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "İşlem başarılı",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı",
    "details": {...}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Status Codes
- `200 OK`: Başarılı
- `201 Created`: Oluşturuldu
- `400 Bad Request`: Geçersiz istek
- `401 Unauthorized`: Token eksik/geçersiz
- `403 Forbidden`: Yetki yok
- `404 Not Found`: Bulunamadı
- `429 Too Many Requests`: Rate limit aşıldı
- `500 Internal Server Error`: Sunucu hatası

---

## 🔐 Auth Service API (`/auth`)

### POST `/auth/register`
Kullanıcı kaydı

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "Ahmet",
  "last_name": "Yılmaz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "verification_required": true
  }
}
```

### POST `/auth/login`
Kullanıcı girişi

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "Ahmet",
      "last_name": "Yılmaz"
    }
  }
}
```

### POST `/auth/refresh`
Token yenileme

**Request:**
```json
{
  "refresh_token": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 3600
  }
}
```

### POST `/auth/logout`
Çıkış yapma

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı"
}
```

### GET `/auth/me`
Kullanıcı bilgilerini getir

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Ahmet",
    "last_name": "Yılmaz",
    "avatar_url": "https://...",
    "email_verified": true,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

---

## 📧 Mail Service API (`/mails`)

### GET `/mails`
Mail listesi (pagination)

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 25, max: 100)
- `folder_id`: Klasör ID
- `category`: Kategori filtresi
- `is_read`: Okundu mu? (true/false)
- `is_starred`: Yıldızlı mı? (true/false)
- `search`: Arama terimi
- `sort`: Sıralama (`date_desc`, `date_asc`, `subject_asc`, `subject_desc`)
- `from_date`: Başlangıç tarihi (ISO 8601)
- `to_date`: Bitiş tarihi (ISO 8601)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mails": [
      {
        "id": "uuid",
        "subject": "Toplantı Daveti",
        "from_address": "sender@example.com",
        "from_name": "Ahmet Yılmaz",
        "preview_text": "Yarın saat 14:00'te...",
        "category": "İş/Acil",
        "category_confidence": 0.925,
        "is_read": false,
        "is_starred": true,
        "has_attachments": false,
        "received_at": "2024-01-01T12:00:00Z",
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 125,
      "total_pages": 5
    }
  }
}
```

### GET `/mails/{mail_id}`
Mail detayı

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message_id": "<message-id@example.com>",
    "subject": "Toplantı Daveti",
    "from_address": "sender@example.com",
    "from_name": "Ahmet Yılmaz",
    "to_addresses": ["recipient@example.com"],
    "cc_addresses": [],
    "bcc_addresses": [],
    "body_text": "Mail içeriği...",
    "body_html": "<html>...</html>",
    "preview_text": "Yarın saat 14:00'te...",
    "category": "İş/Acil",
    "category_confidence": 0.925,
    "probabilities": {
      "İş/Acil": 0.925,
      "Kişisel": 0.05,
      "Diğer": 0.025
    },
    "is_read": false,
    "is_starred": true,
    "is_archived": false,
    "has_attachments": true,
    "attachments": [
      {
        "id": "uuid",
        "filename": "document.pdf",
        "content_type": "application/pdf",
        "file_size": 1024000,
        "storage_url": "https://..."
      }
    ],
    "folder_id": "uuid",
    "labels": ["important"],
    "received_at": "2024-01-01T12:00:00Z",
    "sent_at": "2024-01-01T11:59:00Z",
    "thread_id": "uuid",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### POST `/mails`
Yeni mail gönder

**Request:**
```json
{
  "to_addresses": ["recipient@example.com"],
  "cc_addresses": [],
  "bcc_addresses": [],
  "subject": "Konu",
  "body_text": "Mail içeriği...",
  "body_html": "<html>...</html>",
  "attachments": ["attachment_id_1", "attachment_id_2"],
  "importance": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message_id": "<message-id@example.com>",
    "status": "sent"
  }
}
```

### PATCH `/mails/{mail_id}`
Mail güncelle (okundu, yıldızlı, klasör, vs.)

**Request:**
```json
{
  "is_read": true,
  "is_starred": false,
  "folder_id": "uuid",
  "labels": ["important", "work"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### DELETE `/mails/{mail_id}`
Mail sil

**Response:**
```json
{
  "success": true,
  "message": "Mail silindi"
}
```

### POST `/mails/batch`
Toplu işlem (okundu, silindi, vs.)

**Request:**
```json
{
  "mail_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "mark_as_read", // "mark_as_unread", "delete", "move_to_folder", etc.
  "folder_id": "uuid" // if action is "move_to_folder"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated_count": 3
  }
}
```

---

## 📁 Folder Service API (`/folders`)

### GET `/folders`
Klasör listesi

**Response:**
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "uuid",
        "name": "inbox",
        "display_name": "Gelen Kutusu",
        "icon": "inbox",
        "folder_type": "system",
        "unread_count": 5,
        "total_count": 125,
        "color": null,
        "sort_order": 0
      }
    ]
  }
}
```

### POST `/folders`
Yeni klasör oluştur

**Request:**
```json
{
  "name": "work",
  "display_name": "İş",
  "icon": "briefcase",
  "color": "#FF5733"
}
```

### DELETE `/folders/{folder_id}`
Klasör sil (custom klasörler için)

---

## 🤖 ML Service API (`/ml`)

### POST `/ml/categorize`
Mail kategorizasyon (tahmin_yap)

**Request:**
```json
{
  "subject": "Toplantı Daveti",
  "body": "Yarın saat 14:00'te proje toplantısı yapılacaktır."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "İş/Acil",
    "confidence": 0.925,
    "probabilities": {
      "İş/Acil": 0.925,
      "Kişisel": 0.05,
      "Pazarlama": 0.015,
      "Eğitim/Öğretim": 0.01
    },
    "model_version": "1.0.0"
  }
}
```

### POST `/ml/categorize/batch`
Toplu kategorizasyon

**Request:**
```json
{
  "mails": [
    {
      "subject": "Toplantı Daveti",
      "body": "..."
    },
    {
      "subject": "%50 İndirim!",
      "body": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "category": "İş/Acil",
        "confidence": 0.925,
        "probabilities": {...}
      },
      {
        "category": "Pazarlama",
        "confidence": 0.883,
        "probabilities": {...}
      }
    ]
  }
}
```

---

## 👤 User Service API (`/users`)

### GET `/users/me`
Kullanıcı profili

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Ahmet",
    "last_name": "Yılmaz",
    "avatar_url": "https://...",
    "email_verified": true,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### PATCH `/users/me`
Profil güncelle

**Request:**
```json
{
  "first_name": "Mehmet",
  "last_name": "Demir",
  "avatar_url": "https://..."
}
```

### GET `/users/preferences`
Kullanıcı tercihleri

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "language": "tr",
    "timezone": "Europe/Istanbul",
    "auto_categorize": true,
    "notifications": {
      "email": true,
      "push": false,
      "new_mail": true
    },
    "mail_per_page": 25
  }
}
```

### PATCH `/users/preferences`
Tercihleri güncelle

---

## 📎 Storage Service API (`/storage`)

### POST `/storage/upload`
Dosya yükle (attachment)

**Request:**
```
Content-Type: multipart/form-data
file: <file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attachment_id": "uuid",
    "filename": "document.pdf",
    "content_type": "application/pdf",
    "file_size": 1024000,
    "storage_url": "https://...",
    "uploaded_at": "2024-01-01T12:00:00Z"
  }
}
```

### GET `/storage/{attachment_id}/download`
Dosya indir

**Response:**
Binary file data

---

## 🔍 Search Service API (`/search`)

### GET `/search`
Gelişmiş arama

**Query Parameters:**
- `q`: Arama terimi
- `folder_id`: Klasör filtresi
- `category`: Kategori filtresi
- `from_date`: Başlangıç tarihi
- `to_date`: Bitiş tarihi
- `has_attachments`: Ek var mı? (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {...}
  }
}
```

---

## 📊 WebSocket Events (`/ws`)

### Connection
```
WS wss://api.mailmind.com/ws?token=<jwt_token>
```

### Events

#### Client → Server

**ping**
```json
{
  "type": "ping"
}
```

**subscribe**
```json
{
  "type": "subscribe",
  "channel": "user_notifications"
}
```

#### Server → Client

**pong**
```json
{
  "type": "pong"
}
```

**new_mail**
```json
{
  "type": "new_mail",
  "data": {
    "mail_id": "uuid",
    "subject": "...",
    "category": "İş/Acil",
    "received_at": "2024-01-01T12:00:00Z"
  }
}
```

**mail_updated**
```json
{
  "type": "mail_updated",
  "data": {
    "mail_id": "uuid",
    "changes": {
      "is_read": true
    }
  }
}
```

**notification**
```json
{
  "type": "notification",
  "data": {
    "title": "Yeni Mail",
    "message": "Toplantı Daveti",
    "category": "İş/Acil"
  }
}
```

---

## 📝 Rate Limiting

### Limits
- **Auth endpoints**: 5 requests/minute
- **Mail endpoints**: 100 requests/minute
- **ML endpoints**: 50 requests/minute
- **Upload endpoints**: 10 requests/minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔄 Versioning

API versiyonlama URL'de:
- `/api/v1/...`
- `/api/v2/...`

Backward compatibility korunur.

