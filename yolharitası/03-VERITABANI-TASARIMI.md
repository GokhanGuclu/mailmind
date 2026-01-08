# MailMind - Veritabanı Tasarımı

## 📊 Veritabanı Şeması

### 🗄️ PostgreSQL Ana Database

## 1. **users** tablosu (Auth Service)
Kullanıcı bilgileri ve authentication

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

## 2. **sessions** tablosu (Auth Service)
JWT session yönetimi (Redis'te de tutulabilir)

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## 3. **oauth_providers** tablosu (Auth Service)
OAuth2 provider bağlantıları

```sql
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);
```

## 4. **mails** tablosu (Mail Service)
Ana mail tablosu

```sql
CREATE TABLE mails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Mail header bilgileri
    message_id VARCHAR(500) NOT NULL, -- RFC 822 Message-ID
    in_reply_to VARCHAR(500),
    references TEXT, -- Referenced message IDs
    subject TEXT NOT NULL,
    from_address VARCHAR(500) NOT NULL,
    from_name VARCHAR(255),
    to_addresses TEXT[] NOT NULL, -- Array of recipients
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    
    -- Mail içeriği
    body_text TEXT,
    body_html TEXT,
    preview_text TEXT, -- Email preview (ilk 200 karakter)
    
    -- Metadata
    category VARCHAR(50), -- ML kategorisi: 'İş/Acil', 'Pazarlama', etc.
    category_confidence DECIMAL(5,4), -- ML güven skoru: 0.0000 - 1.0000
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    importance VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
    
    -- Klasör ve etiketler
    folder_id UUID REFERENCES folders(id),
    labels TEXT[], -- User-defined labels
    
    -- Zaman bilgileri
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Attachment bilgisi
    has_attachments BOOLEAN DEFAULT FALSE,
    attachment_count INTEGER DEFAULT 0,
    
    -- Mail yönü
    mail_direction VARCHAR(10) NOT NULL, -- 'incoming' veya 'outgoing'
    
    -- Threading
    thread_id UUID, -- Aynı thread'deki mailler için
    
    -- Full-text search için
    search_vector tsvector
);

CREATE INDEX idx_mails_user_id ON mails(user_id);
CREATE INDEX idx_mails_message_id ON mails(message_id);
CREATE INDEX idx_mails_received_at ON mails(received_at DESC);
CREATE INDEX idx_mails_category ON mails(category);
CREATE INDEX idx_mails_folder_id ON mails(folder_id);
CREATE INDEX idx_mails_is_read ON mails(is_read);
CREATE INDEX idx_mails_is_deleted ON mails(is_deleted);
CREATE INDEX idx_mails_thread_id ON mails(thread_id);
CREATE INDEX idx_mails_search_vector ON mails USING gin(search_vector);

-- Full-text search trigger
CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON mails
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', subject, body_text, preview_text);
```

## 5. **folders** tablosu (Mail Service)
Mail klasörleri (Inbox, Sent, Spam, etc.)

```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50), -- Icon name or emoji
    folder_type VARCHAR(20) NOT NULL, -- 'system' veya 'custom'
    parent_folder_id UUID REFERENCES folders(id),
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);

-- Default folders için seed data
INSERT INTO folders (user_id, name, display_name, folder_type, sort_order) VALUES
('00000000-0000-0000-0000-000000000000', 'inbox', 'Gelen Kutusu', 'system', 0),
('00000000-0000-0000-0000-000000000000', 'sent', 'Gönderilenler', 'system', 1),
('00000000-0000-0000-0000-000000000000', 'drafts', 'Taslaklar', 'system', 2),
('00000000-0000-0000-0000-000000000000', 'spam', 'Spam', 'system', 3),
('00000000-0000-0000-0000-000000000000', 'trash', 'Çöp Kutusu', 'system', 4),
('00000000-0000-0000-0000-000000000000', 'archive', 'Arşiv', 'system', 5);
```

## 6. **attachments** tablosu (Mail Service)
Mail ekleri

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_id UUID NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(255),
    file_size BIGINT NOT NULL, -- Bytes
    storage_path TEXT NOT NULL, -- MinIO/S3 path
    storage_url TEXT, -- Public/private URL
    checksum VARCHAR(64), -- SHA-256 hash
    is_inline BOOLEAN DEFAULT FALSE, -- Embedded image
    content_id VARCHAR(255), -- For inline attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_mail_id ON attachments(mail_id);
CREATE INDEX idx_attachments_checksum ON attachments(checksum); -- Deduplication için
```

## 7. **filters** tablosu (Mail Service)
Kullanıcı tanımlı filtreler ve kurallar

```sql
CREATE TABLE filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- Filter conditions
    actions JSONB NOT NULL, -- Actions to take (move to folder, mark as read, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    match_count INTEGER DEFAULT 0, -- How many times this filter matched
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_filters_user_id ON filters(user_id);
CREATE INDEX idx_filters_is_active ON filters(is_active);

-- Örnek conditions format:
-- {
--   "all": [
--     {"field": "from", "operator": "contains", "value": "spam@example.com"},
--     {"field": "subject", "operator": "contains", "value": "urgent"}
--   ]
-- }

-- Örnek actions format:
-- {
--   "actions": [
--     {"type": "move_to_folder", "folder_id": "..."},
--     {"type": "mark_as_read"},
--     {"type": "add_label", "label": "important"}
--   ]
-- }
```

## 8. **mail_threads** tablosu (Mail Service)
Mail threading (conversation)

```sql
CREATE TABLE mail_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT,
    participants TEXT[], -- Email addresses
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mail_threads_user_id ON mail_threads(user_id);
CREATE INDEX idx_mail_threads_last_message_at ON mail_threads(last_message_at DESC);
```

## 9. **user_preferences** tablosu (User Service)
Kullanıcı ayarları ve tercihleri

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Örnek preferences:
-- {
--   "theme": "dark",
--   "language": "tr",
--   "timezone": "Europe/Istanbul",
--   "auto_categorize": true,
--   "notifications": {
--     "email": true,
--     "push": false,
--     "new_mail": true,
--     "category_change": false
--   },
--   "mail_per_page": 25,
--   "default_folders": {...}
-- }
```

## 10. **ml_predictions** tablosu (ML Service - Opsiyonel)
ML tahmin cache'i (Redis'te de tutulabilir)

```sql
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_id UUID NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
    subject_hash VARCHAR(64), -- SHA-256 hash of subject + body
    predicted_category VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    probabilities JSONB, -- Tüm kategoriler için olasılıklar
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mail_id)
);

CREATE INDEX idx_ml_predictions_mail_id ON ml_predictions(mail_id);
CREATE INDEX idx_ml_predictions_subject_hash ON ml_predictions(subject_hash); -- Deduplication
```

## 🔄 İlişkiler Diyagramı

```
users (1) ────< (N) sessions
users (1) ────< (N) oauth_providers
users (1) ────< (N) mails
users (1) ────< (N) folders
users (1) ────< (N) filters
users (1) ────< (1) user_preferences
users (1) ────< (N) mail_threads

folders (1) ────< (N) mails
folders (1) ────< (N) folders (parent-child)

mails (1) ────< (N) attachments
mails (1) ────< (1) ml_predictions
mails (N) ────> (1) mail_threads (thread_id)
```

## 📊 Redis Schema

### Session Storage
```
Key: session:{session_id}
Value: {user_id, expires_at, ip_address, user_agent}
TTL: 7 days
```

### ML Prediction Cache
```
Key: ml:prediction:{subject_hash}
Value: {category, confidence, probabilities}
TTL: 30 days
```

### Rate Limiting
```
Key: rate_limit:{user_id}:{endpoint}:{window}
Value: request_count
TTL: window_duration
```

### Real-time Notifications (Pub/Sub)
```
Channel: user:{user_id}:notifications
Message: {type, data, timestamp}
```

## 🔍 Full-Text Search (PostgreSQL)

```sql
-- GIN index for full-text search
CREATE INDEX idx_mails_search_vector ON mails USING gin(search_vector);

-- Search query örneği
SELECT * FROM mails
WHERE user_id = $1
  AND search_vector @@ plainto_tsquery('english', $2)
ORDER BY received_at DESC;
```

## 📈 Performans Optimizasyonları

### Indexing Strategy
- **Primary Keys**: UUID (distributed systems için iyi)
- **Foreign Keys**: Indexed (JOIN performansı)
- **Search Fields**: Indexed (WHERE clauses)
- **Sort Fields**: Indexed (ORDER BY)
- **Full-text**: GIN index

### Partitioning (Gelecekte)
- **mails tablosu**: Tarih bazlı partitioning (monthly/yearly)

### Archiving Strategy
- Eski mailler (6+ ay) archive table'a taşınabilir
- Hot data ve cold data ayrımı

## 🔐 Güvenlik

### Row Level Security (RLS)
```sql
-- Kullanıcı sadece kendi maillerini görebilir
ALTER TABLE mails ENABLE ROW LEVEL SECURITY;

CREATE POLICY mails_user_isolation ON mails
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID);
```

### Encryption
- Password hashing: bcrypt
- Sensitive data: Encryption at rest
- Connections: SSL/TLS

## 📝 Migration Strategy

### Version Control
- Alembic (Python) veya Flyway (SQL)
- Incremental migrations
- Rollback support

### Seeding
- Default folders
- System users (opsiyonel)
- Test data (development)

