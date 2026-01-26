# HealLog v2.0 - Migration Guide

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

This guide covers migrating from HealLog v1.x (MongoDB-based single-clinic EMR) to v2.0 (PostgreSQL-based multi-tenant home care operations platform).

### Migration Summary

| Aspect | v1.x (Current) | v2.0 (Target) |
|--------|----------------|---------------|
| Database | MongoDB Atlas | PostgreSQL RDS |
| Multi-tenancy | None | Full RLS isolation |
| Architecture | Monolith | Microservices-ready |
| Primary User | Clinic doctors | Home care agencies |
| Mobile | React Native | Expo PWA |
| Offline | Basic WatermelonDB | Enhanced offline-first |

---

## 2. Migration Timeline

### Phase 1: Foundation (Days 1-20)

```
Week 1-2: Infrastructure Setup
├── Set up AWS VPC, security groups
├── Provision PostgreSQL RDS with RLS
├── Set up ElastiCache Redis
├── Configure S3 buckets
└── Set up CI/CD pipeline

Week 3: Schema Migration
├── Create PostgreSQL schema
├── Enable RLS policies
├── Build data migration scripts
└── Test tenant isolation
```

### Phase 2: Backend Migration (Days 21-40)

```
Week 4-5: Core APIs
├── Port authentication to PostgreSQL
├── Implement multi-tenant middleware
├── Migrate patient APIs
├── Migrate staff APIs
└── Add new roster APIs

Week 6: New Features
├── Implement billing system
├── Implement payroll system
├── Add SMS/WhatsApp integration
└── Build analytics endpoints
```

### Phase 3: Frontend Migration (Days 41-70)

```
Week 7-8: Web Dashboard
├── Create new React/Vite project
├── Build admin dashboard
├── Build finance dashboard
├── Build roster calendar
└── Implement role-based routing

Week 9-10: Mobile App
├── Upgrade to latest Expo
├── Enhance WatermelonDB schema
├── Implement GPS check-in
├── Build photo upload
└── Enhance offline sync
```

### Phase 4: Data Migration & Launch (Days 71-90)

```
Week 11-12: Data Migration
├── Export v1.x data from MongoDB
├── Transform to v2.0 schema
├── Import to PostgreSQL
├── Verify data integrity
└── Test with pilot users

Week 13: Launch
├── Final testing
├── Documentation
├── User training
├── Go-live
└── Monitor & support
```

---

## 3. Database Migration

### 3.1 MongoDB to PostgreSQL Mapping

| MongoDB Collection | PostgreSQL Table | Notes |
|-------------------|------------------|-------|
| `users` | `users` | Add tenant_id, role enum |
| `patients` | `patients` | Encrypt PII fields |
| `clinical_notes` | `clinical_notes` | Add visit_id reference |
| `documents` | `documents` | Move files to S3 |
| `sync_events` | Removed | Handled by new sync |
| - | `tenants` | New - multi-tenancy |
| - | `staff` | New - extended profile |
| - | `rosters` | New - shift scheduling |
| - | `visits` | New - check-in tracking |
| - | `billings` | New - invoicing |
| - | `payroll` | New - staff compensation |

### 3.2 Data Export Script

```python
# scripts/export_mongodb.py
from pymongo import MongoClient
import json
from datetime import datetime

def export_mongodb_data():
    client = MongoClient(MONGODB_URL)
    db = client['heallog']

    # Export users
    users = list(db.users.find({}))
    with open('export/users.json', 'w') as f:
        json.dump(users, f, default=str)

    # Export patients
    patients = list(db.patients.find({}))
    with open('export/patients.json', 'w') as f:
        json.dump(patients, f, default=str)

    # Export clinical notes
    notes = list(db.clinical_notes.find({}))
    with open('export/clinical_notes.json', 'w') as f:
        json.dump(notes, f, default=str)

    print(f"Exported: {len(users)} users, {len(patients)} patients, {len(notes)} notes")

if __name__ == '__main__':
    export_mongodb_data()
```

### 3.3 Data Transform Script

```python
# scripts/transform_data.py
import json
import uuid
from cryptography.fernet import Fernet

def transform_users(users_data, default_tenant_id):
    """Transform MongoDB users to PostgreSQL format"""
    transformed = []

    for user in users_data:
        transformed.append({
            'id': str(uuid.uuid4()),
            'tenant_id': default_tenant_id,
            'email': user['email'],
            'phone': user.get('phone'),
            'password_hash': user['password_hash'],
            'full_name': user.get('full_name', user.get('name', 'Unknown')),
            'role': map_role(user.get('role', 'doctor')),
            'is_active': user.get('is_active', True),
            'created_at': user.get('created_at'),
            'legacy_id': str(user['_id'])  # Keep reference
        })

    return transformed

def transform_patients(patients_data, default_tenant_id, encryption_key):
    """Transform and encrypt patient data"""
    fernet = Fernet(encryption_key)
    transformed = []

    for patient in patients_data:
        # Encrypt PII
        phone_encrypted = fernet.encrypt(
            patient.get('phone', '').encode()
        ) if patient.get('phone') else None

        email_encrypted = fernet.encrypt(
            patient.get('email', '').encode()
        ) if patient.get('email') else None

        transformed.append({
            'id': str(uuid.uuid4()),
            'tenant_id': default_tenant_id,
            'first_name': patient.get('first_name', patient.get('name', 'Unknown').split()[0]),
            'last_name': patient.get('last_name', ''),
            'phone_encrypted': phone_encrypted,
            'email_encrypted': email_encrypted,
            'date_of_birth': patient.get('dob'),
            'gender': patient.get('gender'),
            'blood_group': patient.get('blood_group'),
            'address_line1': patient.get('address'),
            'city': patient.get('city'),
            'state': patient.get('state'),
            'pincode': patient.get('pincode'),
            'medical_history': patient.get('medical_history'),
            'allergies': patient.get('allergies'),
            'is_active': True,
            'created_at': patient.get('created_at'),
            'legacy_id': str(patient['_id'])
        })

    return transformed

def map_role(old_role):
    """Map old roles to new role enum"""
    role_mapping = {
        'admin': 'admin',
        'doctor': 'doctor',
        'nurse': 'nurse',
        'staff': 'receptionist',
        'receptionist': 'receptionist',
    }
    return role_mapping.get(old_role, 'receptionist')
```

### 3.4 Data Import Script

```python
# scripts/import_postgresql.py
import psycopg2
import json
from psycopg2.extras import execute_batch

def import_to_postgresql(db_url):
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    try:
        # Create tenant first
        tenant_id = create_default_tenant(cursor)

        # Import users
        with open('export/transformed_users.json', 'r') as f:
            users = json.load(f)

        execute_batch(cursor, """
            INSERT INTO users (id, tenant_id, email, phone, password_hash, full_name, role, is_active, created_at)
            VALUES (%(id)s, %(tenant_id)s, %(email)s, %(phone)s, %(password_hash)s, %(full_name)s, %(role)s, %(is_active)s, %(created_at)s)
        """, users)

        # Import patients
        with open('export/transformed_patients.json', 'r') as f:
            patients = json.load(f)

        execute_batch(cursor, """
            INSERT INTO patients (id, tenant_id, first_name, last_name, phone_encrypted, email_encrypted,
                                  date_of_birth, gender, blood_group, address_line1, city, state, pincode,
                                  medical_history, allergies, is_active, created_at)
            VALUES (%(id)s, %(tenant_id)s, %(first_name)s, %(last_name)s, %(phone_encrypted)s, %(email_encrypted)s,
                    %(date_of_birth)s, %(gender)s, %(blood_group)s, %(address_line1)s, %(city)s, %(state)s, %(pincode)s,
                    %(medical_history)s, %(allergies)s, %(is_active)s, %(created_at)s)
        """, patients)

        conn.commit()
        print(f"Imported {len(users)} users and {len(patients)} patients")

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def create_default_tenant(cursor):
    tenant_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO tenants (id, name, email, status, subscription_plan)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (tenant_id, 'Default Clinic', 'admin@clinic.com', 'active', 'pro'))
    return tenant_id
```

### 3.5 Verification Script

```python
# scripts/verify_migration.py
def verify_migration(mongodb_url, postgresql_url):
    """Verify data integrity after migration"""

    # Connect to both databases
    mongo_client = MongoClient(mongodb_url)
    mongo_db = mongo_client['heallog']

    pg_conn = psycopg2.connect(postgresql_url)
    pg_cursor = pg_conn.cursor()

    # Verify counts
    mongo_users = mongo_db.users.count_documents({})
    pg_cursor.execute("SELECT COUNT(*) FROM users")
    pg_users = pg_cursor.fetchone()[0]

    mongo_patients = mongo_db.patients.count_documents({})
    pg_cursor.execute("SELECT COUNT(*) FROM patients")
    pg_patients = pg_cursor.fetchone()[0]

    print(f"Users: MongoDB={mongo_users}, PostgreSQL={pg_users}")
    print(f"Patients: MongoDB={mongo_patients}, PostgreSQL={pg_patients}")

    # Verify sample records
    sample_email = "test@example.com"
    mongo_user = mongo_db.users.find_one({"email": sample_email})
    pg_cursor.execute("SELECT * FROM users WHERE email = %s", (sample_email,))
    pg_user = pg_cursor.fetchone()

    if mongo_user and pg_user:
        print(f"Sample user verified: {sample_email}")
    else:
        print(f"WARNING: Sample user not found in both databases")

    pg_cursor.close()
    pg_conn.close()
```

---

## 4. Backend Migration

### 4.1 Dependencies Update

```python
# requirements.txt changes

# Remove
# pymongo==4.x
# beanie==1.x
# motor==3.x

# Add
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.6
```

### 4.2 Database Session Update

```python
# Old: MongoDB with Beanie
# db/session.py (v1.x)
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

async def init_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    await init_beanie(database=client.heallog, document_models=[User, Patient, ...])

# New: PostgreSQL with SQLAlchemy
# db/database.py (v2.0)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        # Set tenant context for RLS
        tenant_id = get_current_tenant_id()
        await session.execute(
            text(f"SET app.current_tenant_id = '{tenant_id}'")
        )
        yield session
```

### 4.3 Model Migration

```python
# Old: Beanie Document (v1.x)
from beanie import Document

class Patient(Document):
    name: str
    email: str
    phone: str
    created_at: datetime

    class Settings:
        name = "patients"

# New: SQLAlchemy Model (v2.0)
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, BYTEA

class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255))
    phone_encrypted = Column(BYTEA, nullable=False)
    email_encrypted = Column(BYTEA)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Enable RLS
    __table_args__ = (
        {'info': {'enable_row_level_security': True}},
    )
```

### 4.4 Service Layer Migration

```python
# Old: Direct Beanie queries (v1.x)
class PatientService:
    async def get_patients(self):
        return await Patient.find_all().to_list()

    async def create_patient(self, data: PatientCreate):
        patient = Patient(**data.dict())
        await patient.insert()
        return patient

# New: SQLAlchemy queries with tenant context (v2.0)
class PatientService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id

    async def get_patients(self, filters: PatientFilters = None):
        # RLS automatically filters by tenant
        query = select(Patient).where(Patient.is_active == True)

        if filters:
            if filters.search:
                query = query.where(
                    Patient.first_name.ilike(f"%{filters.search}%")
                )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_patient(self, data: PatientCreate):
        # Encrypt PII
        phone_encrypted = encrypt_field(data.phone)

        patient = Patient(
            tenant_id=self.tenant_id,
            first_name=data.first_name,
            last_name=data.last_name,
            phone_encrypted=phone_encrypted,
        )
        self.db.add(patient)
        await self.db.commit()
        await self.db.refresh(patient)
        return patient
```

---

## 5. Frontend Migration

### 5.1 Mobile WatermelonDB Schema Update

```typescript
// Old schema (v1.x)
tableSchema({
  name: 'patients',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'phone', type: 'string' },
    { name: 'synced', type: 'boolean' },
  ],
})

// New schema (v2.0)
tableSchema({
  name: 'rosters',
  columns: [
    { name: 'server_id', type: 'string', isIndexed: true },
    { name: 'patient_id', type: 'string', isIndexed: true },
    { name: 'patient_name', type: 'string' },
    { name: 'patient_address', type: 'string' },
    { name: 'patient_latitude', type: 'number', isOptional: true },
    { name: 'patient_longitude', type: 'number', isOptional: true },
    { name: 'shift_date', type: 'number', isIndexed: true },
    { name: 'shift_start', type: 'string' },
    { name: 'shift_end', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'synced', type: 'boolean' },
  ],
}),

tableSchema({
  name: 'visits',
  columns: [
    { name: 'roster_id', type: 'string', isIndexed: true },
    { name: 'checkin_time', type: 'number', isOptional: true },
    { name: 'checkin_latitude', type: 'number', isOptional: true },
    { name: 'checkin_longitude', type: 'number', isOptional: true },
    { name: 'checkout_time', type: 'number', isOptional: true },
    { name: 'visit_notes', type: 'string', isOptional: true },
    { name: 'synced', type: 'boolean' },
  ],
})
```

### 5.2 API Service Update

```typescript
// Old: Direct MongoDB sync (v1.x)
const syncPatients = async () => {
  const response = await api.get('/patients');
  // Store directly
};

// New: Tenant-aware API with new endpoints (v2.0)
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// New roster-focused services
export const rosterService = {
  getTodayRosters: () => api.get('/v1/rosters/today'),
  syncRosters: (since: string) => api.get(`/v1/rosters/sync?since=${since}`),
  checkIn: (visitId: string, data: CheckInData) =>
    api.put(`/v1/visits/${visitId}/checkin`, data),
  checkOut: (visitId: string, data: CheckOutData) =>
    api.put(`/v1/visits/${visitId}/checkout`, data),
};
```

---

## 6. Migration Checklist

### Pre-Migration
- [ ] Backup MongoDB data
- [ ] Document all existing users
- [ ] Set up AWS infrastructure
- [ ] Test PostgreSQL connectivity
- [ ] Prepare rollback plan

### Data Migration
- [ ] Export MongoDB collections
- [ ] Transform data to new schema
- [ ] Encrypt PII fields
- [ ] Import to PostgreSQL
- [ ] Verify record counts
- [ ] Verify sample records

### Backend Migration
- [ ] Update dependencies
- [ ] Migrate database layer
- [ ] Migrate service layer
- [ ] Add new endpoints
- [ ] Update authentication
- [ ] Test all endpoints

### Frontend Migration
- [ ] Update web dashboard
- [ ] Update mobile app
- [ ] Update WatermelonDB schema
- [ ] Update sync logic
- [ ] Test offline mode

### Post-Migration
- [ ] Monitor error rates
- [ ] Verify sync operations
- [ ] Test billing workflow
- [ ] Test payroll workflow
- [ ] User acceptance testing
- [ ] Documentation update

---

## 7. Rollback Plan

If critical issues are found:

1. **Stop new signups** - Disable registration
2. **Switch traffic** - Point ALB back to v1.x
3. **Restore MongoDB** - If needed, restore from backup
4. **Communicate** - Notify users of temporary rollback
5. **Fix issues** - Address problems in staging
6. **Re-migrate** - Attempt migration again

---

## 8. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
