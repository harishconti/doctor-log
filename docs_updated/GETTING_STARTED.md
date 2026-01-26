# HealLog v2.0 - Getting Started Guide

**Version:** 2.0
**Last Updated:** January 2026
**Time to Complete:** 15-30 minutes

---

## 1. Introduction

Welcome to HealLog v2.0! This guide will help you get up and running quickly, whether you're a developer, DevOps engineer, or product manager.

### What is HealLog?

HealLog v2.0 is a **Multi-tenant Operations OS for Home Care Agencies** designed for the Indian market. It provides:

- **Field Staff Operations** - GPS tracking, offline-first mobile app
- **Agency Management** - Staff rostering, billing, payroll
- **Multi-tenant Isolation** - Secure data separation using PostgreSQL RLS
- **Revenue Generation** - Automated billing and Razorpay integration

### Key Features

| Feature | Description |
|---------|-------------|
| Offline-First Mobile | WatermelonDB-powered app works without connectivity |
| GPS Attendance | Real-time check-in/check-out with location tracking |
| Automated Billing | Generate invoices from completed visits |
| Staff Payroll | Calculate salaries based on hours worked |
| Multi-tenant | Complete data isolation between agencies |

---

## 2. Prerequisites

### 2.1 Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend development |
| Python | 3.11+ | Backend development |
| Docker | 24+ | Containerization |
| Git | Latest | Version control |
| PostgreSQL | 15+ | Database (local dev) |
| Redis | 7+ | Caching (local dev) |

### 2.2 Quick Install (macOS/Linux)

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# Python (via pyenv)
curl https://pyenv.run | bash
pyenv install 3.11

# Docker
# macOS: Download from https://docker.com/products/docker-desktop
# Linux:
curl -fsSL https://get.docker.com | sh

# PostgreSQL & Redis (via Docker)
docker run -d --name heallog-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
docker run -d --name heallog-redis -p 6379:6379 redis:7
```

---

## 3. Choose Your Path

Select your role to follow the appropriate getting started path:

| Role | Start Here | Time |
|------|------------|------|
| **Backend Developer** | [Section 4: Backend Setup](#4-backend-development-setup) | 15 min |
| **Frontend Developer** | [Section 5: Frontend Setup](#5-frontend-development-setup) | 15 min |
| **Mobile Developer** | [Section 6: Mobile Setup](#6-mobile-development-setup) | 20 min |
| **DevOps Engineer** | [Section 7: Infrastructure Setup](#7-infrastructure-setup) | 30 min |
| **Product Manager** | [Section 8: Understanding the System](#8-understanding-the-system) | 10 min |

---

## 4. Backend Development Setup

### 4.1 Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/heallog.git
cd heallog/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4.2 Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
```

**Required environment variables:**

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/heallog

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Environment
ENVIRONMENT=development
DEBUG=true
```

### 4.3 Initialize Database

```bash
# Run database migrations
alembic upgrade head

# (Optional) Seed sample data
python scripts/seed_data.py
```

### 4.4 Start the Server

```bash
# Development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Server will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 4.5 Verify Installation

```bash
# Check health endpoint
curl http://localhost:8000/v1/health

# Expected response:
# {"status": "healthy", "database": "connected", "redis": "connected"}
```

---

## 5. Frontend Development Setup

### 5.1 Setup Web Dashboard

```bash
# Navigate to frontend directory
cd heallog/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

**Configure `.env.local`:**

```env
VITE_API_URL=http://localhost:8000/v1
VITE_ENVIRONMENT=development
```

### 5.2 Start Development Server

```bash
# Start Vite dev server
npm run dev

# Dashboard will be available at http://localhost:5173
```

### 5.3 Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 6. Mobile Development Setup

### 6.1 Setup Expo Environment

```bash
# Navigate to mobile directory
cd heallog/mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli
```

### 6.2 Configure Environment

```bash
# Copy environment file
cp .env.example .env
```

**Configure `.env`:**

```env
API_URL=http://localhost:8000/v1
# For physical device testing, use your machine's IP:
# API_URL=http://192.168.1.100:8000/v1
```

### 6.3 Start Development

```bash
# Start Expo development server
npx expo start

# Options:
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app for physical device
```

### 6.4 Key Mobile Features to Test

1. **Login** - Use test credentials or register a new account
2. **Today's Roster** - View assigned shifts
3. **GPS Check-in** - Tap to check in at patient location
4. **Offline Mode** - Disable network and verify local storage
5. **Sync** - Re-enable network and verify data syncs

---

## 7. Infrastructure Setup

For deploying to AWS, see the full [Deployment Guide](./DEPLOYMENT_GUIDE.md).

### 7.1 Quick Start with Docker Compose

```bash
# Navigate to project root
cd heallog

# Start all services
docker-compose up -d

# Services started:
# - Backend API: http://localhost:8000
# - Web Dashboard: http://localhost:5173
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### 7.2 Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: heallog
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/heallog
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 8. Understanding the System

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND CLIENTS                        │
├──────────────────────────────┬──────────────────────────────┤
│  Web Dashboard (React/Vite)  │  Mobile PWA (Expo/RN)        │
│  - Admin Dashboard           │  - Field Staff App            │
│  - Finance Dashboard         │  - Offline-first              │
│  - Receptionist View         │  - GPS Check-in/out           │
└──────────────────────────────┴──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (ECS)                       │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Users │ Patients │ Staff │ Rosters │ Billing │ ...  │
└─────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │     S3       │
│  (RDS + RLS) │      │ (ElastiCache)│      │  (Documents) │
└──────────────┘      └──────────────┘      └──────────────┘
```

### 8.2 User Roles

| Role | Access | Primary Functions |
|------|--------|-------------------|
| **Admin** | Full | Staff management, rosters, analytics |
| **Finance Manager** | Finance | Invoices, payroll, collections |
| **Doctor** | Clinical | Clinical notes, care plans |
| **Receptionist** | Operations | Patient intake, scheduling |
| **Field Staff** | Mobile only | Check-in/out, visit tasks |

### 8.3 Core Workflows

#### Roster to Billing Flow

```
Admin Creates    →    Staff Checks In    →    Visit Record
Roster/Shift          (Mobile + GPS)          Created
                                                  │
                                                  ▼
Family Pays      ←    Invoice Generated  ←    Staff Checks Out
via Razorpay
```

---

## 9. First API Calls

### 9.1 Register a Test Tenant

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "agency_name": "Test Care Agency",
    "owner_name": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210",
    "password": "TestPass123!",
    "city": "Bengaluru",
    "state": "Karnataka"
  }'
```

### 9.2 Login and Get Token

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Save the access_token from response
export TOKEN="your-access-token-here"
```

### 9.3 Make Authenticated Request

```bash
# Get current user profile
curl http://localhost:8000/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

# List patients
curl http://localhost:8000/v1/patients \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Next Steps

Based on your role, continue with these documents:

### For Developers

| Document | Description |
|----------|-------------|
| [API Reference](./API_REFERENCE.md) | Complete REST API documentation |
| [Database Schema](./DATABASE_SCHEMA.md) | PostgreSQL schema with RLS |
| [Frontend Architecture](./FRONTEND_ARCHITECTURE.md) | React/React Native structure |
| [Offline Sync Strategy](./OFFLINE_SYNC_STRATEGY.md) | WatermelonDB implementation |

### For DevOps

| Document | Description |
|----------|-------------|
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | AWS infrastructure setup |
| [Security & Compliance](./SECURITY_COMPLIANCE.md) | Security architecture |

### For Product

| Document | Description |
|----------|-------------|
| [Feature Specifications](./FEATURE_SPECIFICATIONS.md) | Feature roadmap |
| [User Roles & Permissions](./USER_ROLES_PERMISSIONS.md) | RBAC system |

---

## 11. Common Issues & Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/heallog

# If using Docker, ensure network connectivity
docker network inspect bridge
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
# Should return: PONG
```

### JWT Token Errors

- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration (default: 60 minutes)
- Verify token is passed with `Bearer ` prefix

### Mobile App Can't Connect to Backend

- Use your machine's IP address instead of `localhost`
- Ensure phone/emulator is on the same network
- Check firewall settings

---

## 12. Getting Help

- **Documentation Issues:** Open a PR in the docs repository
- **Technical Questions:** Contact the backend team
- **Product Questions:** Contact the product team
- **Support:** support@heallog.in

---

## Quick Reference

| Resource | URL |
|----------|-----|
| API Docs (Local) | http://localhost:8000/docs |
| Web Dashboard (Local) | http://localhost:5173 |
| Production API | https://api.heallog.in/v1 |
| Production App | https://app.heallog.in |
