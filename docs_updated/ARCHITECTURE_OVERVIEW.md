# HealLog v2.0 - Architecture Overview

**Version:** 2.0
**Last Updated:** January 2026
**Document Type:** Technical Architecture Specification

---

## 1. Executive Summary

HealLog v2.0 transforms from a single-clinic EMR to a **Multi-tenant Operations OS for Home Care Agencies**. This architecture supports:

- 100+ concurrent agency tenants
- Offline-first field staff mobile operations
- Real-time GPS attendance tracking
- Automated billing and payroll
- ABHA/ABDM compliance readiness

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND CLIENTS                                  │
├───────────────────────────────────┬─────────────────────────────────────────┤
│     WEB DASHBOARD (React/Vite)    │      MOBILE PWA (Expo/React Native)     │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────────────┐│
│  │ Admin Dashboard             │  │  │ Field Staff App                     ││
│  │ - Staff Management          │  │  │ - Today's Roster                    ││
│  │ - Roster Calendar           │  │  │ - GPS Check-in/Check-out            ││
│  │ - Analytics & Reports       │  │  │ - Care Checklist                    ││
│  ├─────────────────────────────┤  │  │ - Photo Proof Upload                ││
│  │ Finance Dashboard           │  │  │ - Offline Mode                      ││
│  │ - Invoices                  │  │  └─────────────────────────────────────┘│
│  │ - Payroll                   │  │                                         │
│  │ - Collections               │  │  ┌─────────────────────────────────────┐│
│  ├─────────────────────────────┤  │  │ WatermelonDB (SQLite)               ││
│  │ Doctor View                 │  │  │ - Offline Storage                   ││
│  │ - Clinical Notes            │  │  │ - Background Sync                   ││
│  │ - Care Plans                │  │  └─────────────────────────────────────┘│
│  └─────────────────────────────┘  │                                         │
└───────────────────────────────────┴─────────────────────────────────────────┘
                                    │
                                    │ HTTPS/TLS 1.3
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS INFRASTRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    APPLICATION LOAD BALANCER (ALB)                   │   │
│   │                    - SSL Termination                                 │   │
│   │                    - Health Checks                                   │   │
│   │                    - Auto-scaling Trigger                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      ECS FARGATE CLUSTER                             │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │ FastAPI      │  │ FastAPI      │  │ Celery       │               │   │
│   │  │ Worker 1     │  │ Worker 2     │  │ Worker       │               │   │
│   │  │              │  │              │  │              │               │   │
│   │  │ • Auth       │  │ • Auth       │  │ • SMS Jobs   │               │   │
│   │  │ • Rosters    │  │ • Rosters    │  │ • Email Jobs │               │   │
│   │  │ • Billing    │  │ • Billing    │  │ • Payroll    │               │   │
│   │  │ • Visits     │  │ • Visits     │  │ • Sync Tasks │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        │                           │                           │            │
│        ▼                           ▼                           ▼            │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │  PostgreSQL  │         │    Redis     │         │      S3      │       │
│   │  (RDS)       │         │ (ElastiCache)│         │  (Documents) │       │
│   │              │         │              │         │              │       │
│   │ • RLS        │         │ • Sessions   │         │ • Medical    │       │
│   │ • Multi-     │         │ • Cache      │         │   Reports    │       │
│   │   tenant     │         │ • Task Queue │         │ • ID Proofs  │       │
│   │ • Encrypted  │         │              │         │ • Visit      │       │
│   │              │         │              │         │   Photos     │       │
│   └──────────────┘         └──────────────┘         └──────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    MSG91     │         │   Razorpay   │         │    Sentry    │
│  (SMS/WA)    │         │  (Payments)  │         │ (Monitoring) │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## 3. Technology Stack

### 3.1 Backend

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | FastAPI | 0.109+ | REST API, async operations |
| Server | Uvicorn | 0.27+ | ASGI server |
| Database | PostgreSQL | 15+ | Primary data store with RLS |
| ORM | SQLAlchemy | 2.0+ | Database ORM |
| Migrations | Alembic | 1.13+ | Schema migrations |
| Cache | Redis | 7+ | Sessions, caching, task queue |
| Task Queue | Celery | 5.3+ | Background jobs |
| Auth | python-jose | 3.4+ | JWT tokens |
| Validation | Pydantic | 2.5+ | Request/response validation |

### 3.2 Frontend - Web Dashboard

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 18+ | UI framework |
| Build | Vite | 5+ | Build tool |
| Language | TypeScript | 5+ | Type safety |
| Styling | Tailwind CSS | 3+ | Utility CSS |
| State | Zustand | 4+ | Global state |
| Data Fetching | TanStack Query | 5+ | API caching |
| Router | React Router | 6+ | Navigation |
| Charts | Recharts | 2+ | Data visualization |

### 3.3 Frontend - Mobile PWA

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React Native | 0.73+ | Cross-platform mobile |
| Platform | Expo | 50+ | Development platform |
| Router | Expo Router | 3+ | File-based routing |
| Offline DB | WatermelonDB | 0.28+ | SQLite-based offline storage |
| State | Redux | 5+ | State management |
| GPS | expo-location | 16+ | Location services |
| Camera | expo-camera | 14+ | Photo capture |
| Maps | react-native-maps | 1+ | Navigation |

### 3.4 Infrastructure (AWS)

| Component | Service | Purpose |
|-----------|---------|---------|
| Compute | ECS Fargate | Container orchestration |
| Database | RDS PostgreSQL | Managed database |
| Cache | ElastiCache Redis | Managed Redis |
| Storage | S3 | Document storage |
| CDN | CloudFront | Static asset delivery |
| DNS | Route 53 | Domain management |
| Load Balancer | ALB | Traffic distribution |
| Monitoring | CloudWatch | Logs and metrics |

---

## 4. Multi-Tenant Architecture

### 4.1 Tenant Isolation Strategy

HealLog uses **Row-Level Security (RLS)** in PostgreSQL for tenant isolation:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 4.2 Request Flow

```
1. Client sends request with JWT
2. API Gateway validates JWT, extracts tenant_id
3. Middleware sets PostgreSQL session variable
4. RLS automatically filters all queries by tenant
5. Response returns only tenant-scoped data
```

### 4.3 Tenant Context Middleware

```python
@app.middleware("http")
async def tenant_context_middleware(request: Request, call_next):
    # Extract tenant_id from JWT
    token = request.headers.get("Authorization")
    tenant_id = decode_jwt(token).get("tenant_id")

    # Set PostgreSQL session variable
    async with db.acquire() as conn:
        await conn.execute(
            f"SET app.current_tenant_id = '{tenant_id}'"
        )

    response = await call_next(request)
    return response
```

---

## 5. Backend Architecture

### 5.1 Directory Structure

```
backend/
├── api/
│   └── v1/
│       ├── endpoints/
│       │   ├── auth.py              # JWT, login, OTP
│       │   ├── tenants.py           # Tenant management
│       │   ├── users.py             # User CRUD
│       │   ├── patients.py          # Patient records
│       │   ├── staff.py             # Staff directory
│       │   ├── rosters.py           # Shift scheduling
│       │   ├── visits.py            # Check-in/out tracking
│       │   ├── clinical_notes.py    # Doctor notes
│       │   ├── care_plans.py        # Care templates
│       │   ├── billing.py           # Invoices
│       │   ├── payroll.py           # Staff payouts
│       │   ├── analytics.py         # Dashboard data
│       │   ├── integrations.py      # SMS, WhatsApp
│       │   └── reports.py           # Data export
│       │
│       ├── middleware/
│       │   ├── auth.py              # JWT verification
│       │   ├── tenant_context.py    # RLS setup
│       │   ├── error_handler.py     # Exception handling
│       │   └── audit_logger.py      # Access logging
│       │
│       └── schemas/
│           └── ...                  # Pydantic models
│
├── core/
│   ├── config.py                    # Settings
│   ├── security.py                  # Auth utilities
│   ├── dependencies.py              # DI
│   └── constants.py                 # Enums
│
├── db/
│   ├── models.py                    # SQLAlchemy models
│   ├── database.py                  # Connection pool
│   └── migrations/                  # Alembic
│
├── services/
│   ├── auth_service.py
│   ├── tenant_service.py
│   ├── patient_service.py
│   ├── staff_service.py
│   ├── roster_service.py
│   ├── visit_service.py
│   ├── billing_service.py
│   ├── payroll_service.py
│   ├── notification_service.py
│   ├── analytics_service.py
│   └── compliance_service.py
│
├── tasks/
│   ├── celery_app.py
│   ├── reminders.py
│   ├── billing_tasks.py
│   ├── payroll_tasks.py
│   └── sync_tasks.py
│
├── utils/
│   ├── validators.py
│   ├── formatters.py
│   ├── encryption.py
│   └── gps.py
│
└── main.py
```

### 5.2 Service Layer Pattern

```python
# Example: Roster Service
class RosterService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id

    async def create_roster(self, data: RosterCreate) -> Roster:
        # RLS automatically filters by tenant
        roster = Roster(**data.dict(), tenant_id=self.tenant_id)
        self.db.add(roster)
        await self.db.commit()
        return roster

    async def get_calendar_view(
        self,
        start_date: date,
        end_date: date
    ) -> List[CalendarEntry]:
        # Returns rosters organized by staff/date
        query = select(Roster).where(
            Roster.shift_date.between(start_date, end_date)
        )
        result = await self.db.execute(query)
        return self._format_calendar(result.scalars().all())
```

---

## 6. Frontend Architecture

### 6.1 Web Dashboard Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StaffDirectory.tsx
│   │   │   ├── RosterCalendar.tsx
│   │   │   └── Settings.tsx
│   │   ├── finance/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Invoices.tsx
│   │   │   └── Payroll.tsx
│   │   ├── doctor/
│   │   │   ├── Dashboard.tsx
│   │   │   └── ClinicalNotes.tsx
│   │   └── receptionist/
│   │       └── Dashboard.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── dashboard/
│   │   └── roster/
│   │
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
```

### 6.2 Mobile PWA Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── RosterList.tsx
│   │   ├── ShiftDetail.tsx
│   │   ├── CheckIn.tsx
│   │   ├── CareChecklist.tsx
│   │   ├── Notes.tsx
│   │   ├── PhotoCapture.tsx
│   │   ├── CheckOut.tsx
│   │   └── PersonalPayroll.tsx
│   │
│   ├── components/
│   │   ├── ShiftCard.tsx
│   │   ├── CheckInButton.tsx
│   │   ├── TaskCheckbox.tsx
│   │   ├── GPSMap.tsx
│   │   └── SyncStatus.tsx
│   │
│   ├── services/
│   │   ├── watermelonDB.ts
│   │   ├── geolocation.ts
│   │   ├── sync.ts
│   │   └── api.ts
│   │
│   └── models/
│       ├── Shift.ts
│       ├── Visit.ts
│       └── Task.ts
```

---

## 7. Data Flow

### 7.1 Roster to Billing Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Creates  │────▶│  Staff Checks   │────▶│  Visit Record   │
│  Roster/Shift   │     │  In (Mobile)    │     │  Created        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Family Pays    │◀────│  Invoice        │◀────│  Staff Checks   │
│  via Razorpay   │     │  Generated      │     │  Out            │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 7.2 Offline Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIELD STAFF MOBILE APP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ User Action  │───▶│ WatermelonDB │───▶│ Sync Queue   │       │
│  │ (Check-in)   │    │ (Local)      │    │ (Pending)    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 ▼                │
│                           ┌─────────────────────────────┐       │
│                           │ Background Sync Service     │       │
│                           │ - Check connectivity        │       │
│                           │ - POST to /v1/visits/sync   │       │
│                           │ - Mark as synced            │       │
│                           └─────────────────────────────┘       │
│                                                 │                │
└─────────────────────────────────────────────────│────────────────┘
                                                  │
                                                  ▼ (When Online)
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  POST /v1/visits/batch-sync                                      │
│  - Validate GPS coordinates                                      │
│  - Calculate distance from patient home                          │
│  - Flag tardiness                                                │
│  - Store in PostgreSQL                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Login Request  │────▶│  Validate       │────▶│  Generate JWT   │
│  (email/pass)   │     │  Credentials    │     │  + Refresh      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────────────────────────────┐
                        │  JWT Payload:                            │
                        │  {                                       │
                        │    "sub": "user_id",                     │
                        │    "tenant_id": "tenant_uuid",           │
                        │    "role": "admin|finance|doctor|nurse", │
                        │    "exp": "expiry_timestamp"             │
                        │  }                                       │
                        └─────────────────────────────────────────┘
```

### 8.2 Data Encryption

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| Patient PII | AES-256 (field-level) | TLS 1.3 |
| Aadhar Numbers | AES-256 + Hashing | TLS 1.3 |
| Bank Details | AES-256 | TLS 1.3 |
| GPS Coordinates | Plain | TLS 1.3 |
| Visit Photos | S3 SSE-S3 | TLS 1.3 |

---

## 9. Scalability Design

### 9.1 Horizontal Scaling

```
                    ┌─────────────────────────────────────┐
                    │        Application Load Balancer     │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │  FastAPI        │     │  FastAPI        │     │  FastAPI        │
    │  Container 1    │     │  Container 2    │     │  Container N    │
    │  (Stateless)    │     │  (Stateless)    │     │  (Auto-scaled)  │
    └─────────────────┘     └─────────────────┘     └─────────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     Connection Pooler (PgBouncer)    │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │       PostgreSQL (RDS Multi-AZ)      │
                    └─────────────────────────────────────┘
```

### 9.2 Caching Strategy

| Cache Layer | Data | TTL | Purpose |
|-------------|------|-----|---------|
| Redis L1 | User sessions | 8 hours | Auth tokens |
| Redis L2 | Roster calendar | 1 hour | Dashboard performance |
| Redis L3 | Patient search | 5 minutes | Search results |
| CDN | Static assets | 1 day | UI delivery |

---

## 10. Monitoring & Observability

### 10.1 Metrics Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   CloudWatch │  │    Sentry    │  │   Custom     │       │
│  │   (AWS)      │  │  (Errors)    │  │   Metrics    │       │
│  │              │  │              │  │              │       │
│  │ • CPU/Memory │  │ • Exceptions │  │ • API        │       │
│  │ • API Latency│  │ • Stack      │  │   Latency    │       │
│  │ • DB Metrics │  │   Traces     │  │ • Business   │       │
│  │ • Alarms     │  │ • User       │  │   KPIs       │       │
│  │              │  │   Context    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Key Metrics

- **API Latency:** p50 < 100ms, p99 < 500ms
- **Error Rate:** < 0.1%
- **Uptime:** 99.9%
- **Database Query Time:** < 50ms average
- **Sync Success Rate:** > 99%

---

## 11. Deployment Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───▶│   GitHub    │───▶│    ECR      │───▶│    ECS      │
│   Push      │    │   Actions   │    │   (Image)   │    │  (Deploy)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Run Tests  │
                   │  (pytest)   │
                   └─────────────┘
```

---

## 12. Cost Estimates

| Service | Spec | Monthly Cost |
|---------|------|--------------|
| ECS Fargate | 2x (2 vCPU, 4GB RAM) | $100-150 |
| RDS PostgreSQL | db.t4g.small, Multi-AZ | $50-80 |
| ElastiCache Redis | cache.t4g.small | $30-50 |
| S3 + CloudFront | ~100GB | $20-50 |
| ALB | Standard | $20 |
| SMS (MSG91) | ~5,000 msgs/month | $300-500 |
| **TOTAL** | | **$500-800/month** |

---

## 13. Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security & Compliance](./SECURITY_COMPLIANCE.md)
