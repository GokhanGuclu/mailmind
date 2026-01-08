-- MailMind Database Initialization Script
-- Bu script PostgreSQL container ilk başlatıldığında çalışır

-- Database zaten docker-compose.yml'de oluşturuluyor
-- Burada sadece extensions ekleyebiliriz

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable citext for case-insensitive text (email addresses)
CREATE EXTENSION IF NOT EXISTS "citext";

-- Logging
DO $$
BEGIN
    RAISE NOTICE 'MailMind database initialized successfully';
END $$;

