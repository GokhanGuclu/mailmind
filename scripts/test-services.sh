#!/bin/bash

# MailMind - Servis Test Scripti
# Bu script tüm servislerin çalışıp çalışmadığını test eder

echo "=========================================="
echo "MailMind - Servis Test Scripti"
echo "=========================================="
echo ""

# Renk kodları
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test fonksiyonu
test_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "$expected_status" ] || [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Status: $response)"
        return 1
    fi
}

# Docker kontrolü
echo "1. Docker servis durumu kontrol ediliyor..."
docker-compose ps
echo ""

# Database servisleri
echo "2. Database servisleri test ediliyor..."

# PostgreSQL
echo -n "Testing PostgreSQL connection... "
if docker-compose exec -T postgres pg_isready -U mailmind > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Redis
echo -n "Testing Redis connection... "
if docker-compose exec -T redis redis-cli --raw incr ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# RabbitMQ
test_service "RabbitMQ Management UI" "http://localhost:15672" "200"

# Elasticsearch
test_service "Elasticsearch" "http://localhost:9200" "200"

# MinIO
test_service "MinIO Health" "http://localhost:9000/minio/health/live" "200"

echo ""
echo "3. Backend servisleri test ediliyor..."

# Backend servisleri (eğer çalışıyorsa)
test_service "Auth Service" "http://localhost:8001/health" "200"
test_service "Mail Service" "http://localhost:8002/health" "200"
test_service "ML Service" "http://localhost:8003/health" "200"
test_service "User Service" "http://localhost:8004/health" "200"
test_service "Storage Service" "http://localhost:8005/health" "200"
test_service "Search Service" "http://localhost:8006/health" "200"

echo ""
echo "=========================================="
echo "Test tamamlandı!"
echo "=========================================="

