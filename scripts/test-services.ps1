# MailMind - Servis Test Scripti (PowerShell)
# Bu script tüm servislerin çalışıp çalışmadığını test eder

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MailMind - Servis Test Scripti" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test fonksiyonu
function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus -or $response.StatusCode -eq 200) {
            Write-Host "✓ OK" -ForegroundColor Green -NoNewline
            Write-Host " (Status: $($response.StatusCode))"
            return $true
        } else {
            Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
            Write-Host " (Status: $($response.StatusCode))"
            return $false
        }
    } catch {
        Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
        Write-Host " ($($_.Exception.Message))"
        return $false
    }
}

# Docker kontrolü
Write-Host "1. Docker servis durumu kontrol ediliyor..." -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Database servisleri
Write-Host "2. Database servisleri test ediliyor..." -ForegroundColor Yellow

# PostgreSQL
Write-Host "Testing PostgreSQL connection... " -NoNewline
try {
    $result = docker-compose exec -T postgres pg_isready -U mailmind 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ OK" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

# Redis
Write-Host "Testing Redis connection... " -NoNewline
try {
    $result = docker-compose exec -T redis redis-cli --raw incr ping 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ OK" -ForegroundColor Green
    } else {
        Write-Host "✗ FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED" -ForegroundColor Red
}

# RabbitMQ
Test-Service -Name "RabbitMQ Management UI" -Url "http://localhost:15672" | Out-Null

# Elasticsearch
Test-Service -Name "Elasticsearch" -Url "http://localhost:9200" | Out-Null

# MinIO
Test-Service -Name "MinIO Health" -Url "http://localhost:9000/minio/health/live" | Out-Null

Write-Host ""
Write-Host "3. Backend servisleri test ediliyor..." -ForegroundColor Yellow

# Backend servisleri (eğer çalışıyorsa)
Test-Service -Name "Auth Service" -Url "http://localhost:8001/health" | Out-Null
Test-Service -Name "Mail Service" -Url "http://localhost:8002/health" | Out-Null
Test-Service -Name "ML Service" -Url "http://localhost:8003/health" | Out-Null
Test-Service -Name "User Service" -Url "http://localhost:8004/health" | Out-Null
Test-Service -Name "Storage Service" -Url "http://localhost:8005/health" | Out-Null
Test-Service -Name "Search Service" -Url "http://localhost:8006/health" | Out-Null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test tamamlandı!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

