# HealLog v2.0 - Security & Compliance

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

HealLog handles sensitive healthcare data and must comply with Indian data protection regulations. This document outlines security measures, compliance requirements, and audit procedures.

---

## 2. Security Architecture

### 2.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 1: NETWORK SECURITY                                          │
│  • AWS WAF (Web Application Firewall)                               │
│  • DDoS Protection (AWS Shield)                                     │
│  • SSL/TLS 1.3 termination at ALB                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 2: APPLICATION SECURITY                                      │
│  • JWT Authentication                                               │
│  • Rate Limiting (SlowAPI)                                          │
│  • Input Validation (Pydantic)                                      │
│  • CORS Policy                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 3: DATA SECURITY                                             │
│  • PostgreSQL Row-Level Security (RLS)                              │
│  • Field-Level Encryption (PII)                                     │
│  • Encryption at Rest (AES-256)                                     │
│  • Encryption in Transit (TLS 1.3)                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 4: MONITORING & AUDIT                                        │
│  • Audit Logs (all data access)                                     │
│  • CloudWatch Monitoring                                            │
│  • Sentry Error Tracking                                            │
│  • VPC Flow Logs                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication & Authorization

### 3.1 Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │─────▶│  Login   │─────▶│ Validate │─────▶│  Issue   │
│          │      │  Request │      │  Creds   │      │   JWT    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
                                                            │
                                                            ▼
                                                      ┌──────────┐
                                                      │  Store   │
                                                      │  Refresh │
                                                      │  Token   │
                                                      └──────────┘
```

### 3.2 JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_uuid",
    "tenant_id": "tenant_uuid",
    "role": "admin|finance|doctor|receptionist|nurse",
    "permissions": ["patients:read", "billing:create"],
    "iat": 1706270400,
    "exp": 1706274000
  }
}
```

### 3.3 Token Lifecycle

| Token Type | Validity | Storage | Refresh |
|------------|----------|---------|---------|
| Access Token | 1 hour | Memory only | Via refresh token |
| Refresh Token | 7 days | Secure cookie / SecureStore | Rotation on use |
| OTP | 5 minutes | Redis | N/A |

### 3.4 Password Policy

```python
PASSWORD_REQUIREMENTS = {
    "min_length": 8,
    "max_length": 128,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digit": True,
    "require_special": True,
    "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?",
    "disallow_common": True,  # Check against common password list
    "disallow_username": True,  # Cannot contain username
}
```

### 3.5 Account Lockout

```python
LOCKOUT_POLICY = {
    "max_failed_attempts": 5,
    "lockout_duration_minutes": 30,
    "progressive_lockout": True,  # Increases with each lockout
    "alert_on_lockout": True,
}
```

---

## 4. Multi-Tenant Isolation

### 4.1 Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Middleware sets tenant context on every request
SET app.current_tenant_id = 'tenant-uuid-from-jwt';
```

### 4.2 Tenant Context Middleware

```python
@app.middleware("http")
async def tenant_isolation_middleware(request: Request, call_next):
    # Skip for auth endpoints
    if request.url.path.startswith("/v1/auth"):
        return await call_next(request)

    # Extract tenant from JWT
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        tenant_id = payload.get("tenant_id")

        if not tenant_id:
            raise HTTPException(status_code=403, detail="Invalid tenant")

        # Set PostgreSQL session variable for RLS
        async with db.acquire() as conn:
            await conn.execute(
                f"SET app.current_tenant_id = '{tenant_id}'"
            )

        # Add to request state for logging
        request.state.tenant_id = tenant_id
        request.state.user_id = payload.get("sub")

        response = await call_next(request)
        return response

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 4.3 Cross-Tenant Access Prevention

```python
# Service layer validation
class PatientService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id

    async def get_patient(self, patient_id: UUID) -> Patient:
        # RLS automatically filters, but double-check
        patient = await self.db.get(Patient, patient_id)

        if patient and patient.tenant_id != self.tenant_id:
            # Log security event
            await self.log_security_event(
                event_type="cross_tenant_access_attempt",
                resource_id=patient_id,
                attempted_tenant=self.tenant_id,
                actual_tenant=patient.tenant_id,
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        return patient
```

---

## 5. Data Encryption

### 5.1 Encryption Strategy

| Data Type | At Rest | In Transit | Method |
|-----------|---------|------------|--------|
| General Data | AES-256 (RDS) | TLS 1.3 | AWS Managed |
| PII (Phone, Aadhar) | AES-256 (Field-level) | TLS 1.3 | Application |
| Passwords | bcrypt | TLS 1.3 | Application |
| Files | SSE-S3 | TLS 1.3 | S3 Managed |

### 5.2 Field-Level Encryption

```python
# utils/encryption.py
from cryptography.fernet import Fernet
import os

# Encryption key from environment (rotate periodically)
ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY")
fernet = Fernet(ENCRYPTION_KEY)

def encrypt_field(plaintext: str) -> bytes:
    """Encrypt PII field for storage"""
    if not plaintext:
        return None
    return fernet.encrypt(plaintext.encode())

def decrypt_field(ciphertext: bytes) -> str:
    """Decrypt PII field for display"""
    if not ciphertext:
        return None
    return fernet.decrypt(ciphertext).decode()

# Usage in model
class Patient(Base):
    phone_encrypted = Column(BYTEA)  # Store encrypted

    @property
    def phone(self):
        return decrypt_field(self.phone_encrypted)

    @phone.setter
    def phone(self, value):
        self.phone_encrypted = encrypt_field(value)
```

### 5.3 Key Management

```python
# Key rotation procedure
KEY_ROTATION_POLICY = {
    "rotation_period_days": 90,
    "overlap_period_days": 7,  # Both keys valid during transition
    "notification_days_before": 14,
}

# Store keys in AWS Secrets Manager
aws secretsmanager create-secret \
    --name heallog/encryption-key \
    --secret-string "$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"
```

---

## 6. Audit Logging

### 6.1 Audit Events

| Event Type | Logged Data |
|------------|-------------|
| Authentication | Login success/failure, logout, password change |
| Data Access | Patient view, export, download |
| Data Modification | Create, update, delete operations |
| Administrative | User creation, role change, settings |
| Security | Failed access attempts, suspicious activity |

### 6.2 Audit Log Schema

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- Action details
    action VARCHAR(50) NOT NULL,  -- 'create', 'read', 'update', 'delete', 'login'
    resource_type VARCHAR(100) NOT NULL,  -- 'patient', 'visit', 'billing'
    resource_id UUID,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    request_path VARCHAR(255),
    request_method VARCHAR(10),

    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### 6.3 Audit Logging Implementation

```python
# middleware/audit_logger.py
from datetime import datetime
import json

class AuditLogger:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        action: str,
        resource_type: str,
        resource_id: UUID = None,
        old_values: dict = None,
        new_values: dict = None,
        request: Request = None,
    ):
        audit_entry = AuditLog(
            tenant_id=request.state.tenant_id,
            user_id=request.state.user_id,
            user_email=request.state.user_email,
            user_role=request.state.user_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            changed_fields=self._get_changed_fields(old_values, new_values),
            ip_address=request.client.host,
            user_agent=request.headers.get("User-Agent"),
            request_id=request.state.request_id,
            request_path=str(request.url.path),
            request_method=request.method,
            timestamp=datetime.utcnow(),
        )

        self.db.add(audit_entry)
        await self.db.commit()

    def _get_changed_fields(self, old: dict, new: dict) -> list:
        if not old or not new:
            return []
        return [k for k in new.keys() if old.get(k) != new.get(k)]

# Usage in service
async def update_patient(self, patient_id: UUID, data: PatientUpdate):
    patient = await self.get_patient(patient_id)
    old_values = patient.to_dict()

    for key, value in data.dict(exclude_unset=True).items():
        setattr(patient, key, value)

    await self.db.commit()

    # Log the change
    await self.audit_logger.log(
        action="update",
        resource_type="patient",
        resource_id=patient_id,
        old_values=old_values,
        new_values=patient.to_dict(),
        request=self.request,
    )

    return patient
```

---

## 7. Data Protection Compliance

### 7.1 Indian Data Protection Requirements

| Requirement | Implementation |
|-------------|----------------|
| Data Localization | All data stored in AWS ap-south-1 (Mumbai) |
| Consent | Explicit consent captured at patient registration |
| Right to Access | Export patient data API |
| Right to Erasure | Anonymization/deletion workflow |
| Data Minimization | Only collect necessary data |
| Security | Encryption, access controls, audit logs |

### 7.2 ABDM Compliance Readiness

**Current State (Phase 1):**
- ABHA ID storage (non-clinical)
- No clinical data exchange

**Future State (Phase 2+):**
- ABDM sandbox integration
- Health Information Exchange
- Requires certification and audit

### 7.3 Data Retention Policy

| Data Type | Retention Period | Action After |
|-----------|------------------|--------------|
| Audit Logs | 7 years | Archive to S3 Glacier |
| Financial Records | 7 years | Archive, never delete |
| Patient Clinical Data | Indefinite | Anonymize on request |
| Visit Records | 5 years | Soft delete, then archive |
| Session Data | 30 days | Hard delete |
| OTP Records | 1 hour | Hard delete |

### 7.4 Data Deletion Workflow

```python
async def delete_patient_data(patient_id: UUID, reason: str):
    """
    GDPR-style right to erasure implementation
    """
    patient = await db.get(Patient, patient_id)

    # 1. Anonymize PII
    patient.first_name = "DELETED"
    patient.last_name = "USER"
    patient.phone_encrypted = None
    patient.email_encrypted = None
    patient.aadhar_encrypted = None
    patient.address_line1 = None
    patient.home_latitude = None
    patient.home_longitude = None

    # 2. Keep medical data anonymized for research
    patient.is_deleted = True
    patient.deleted_at = datetime.utcnow()
    patient.deletion_reason = reason

    # 3. Log the deletion
    await audit_logger.log(
        action="delete",
        resource_type="patient",
        resource_id=patient_id,
        new_values={"reason": reason, "type": "anonymization"},
    )

    await db.commit()

    return {"status": "anonymized", "patient_id": patient_id}
```

---

## 8. API Security

### 8.1 Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

RATE_LIMITS = {
    "auth": "10/minute",
    "read": "100/minute",
    "write": "50/minute",
    "upload": "10/minute",
    "export": "5/minute",
}

@app.post("/v1/auth/login")
@limiter.limit(RATE_LIMITS["auth"])
async def login(request: Request, data: LoginRequest):
    ...

@app.get("/v1/patients")
@limiter.limit(RATE_LIMITS["read"])
async def list_patients(request: Request):
    ...
```

### 8.2 Input Validation

```python
from pydantic import BaseModel, validator, constr
import re

class PatientCreate(BaseModel):
    first_name: constr(min_length=1, max_length=255)
    last_name: constr(max_length=255) = None
    phone: str
    email: str = None

    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+91[6-9]\d{9}$', v):
            raise ValueError('Invalid Indian phone number')
        return v

    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', v):
            raise ValueError('Invalid email format')
        return v

    @validator('first_name', 'last_name')
    def sanitize_name(cls, v):
        # Remove HTML/script tags
        return re.sub(r'<[^>]+>', '', v) if v else v
```

### 8.3 CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "https://app.heallog.in",
    "https://admin.heallog.in",
    "https://staging.heallog.in",
]

if ENVIRONMENT == "development":
    ALLOWED_ORIGINS.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)
```

---

## 9. Infrastructure Security

### 9.1 Network Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VPC (10.0.0.0/16)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              PUBLIC SUBNETS (10.0.1.0/24, 10.0.2.0/24)       │  │
│   │                                                               │  │
│   │   ┌─────────────┐          ┌─────────────┐                   │  │
│   │   │     ALB     │          │  NAT Gateway│                   │  │
│   │   │  (HTTPS)    │          │             │                   │  │
│   │   └─────────────┘          └─────────────┘                   │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │             PRIVATE SUBNETS (10.0.10.0/24, 10.0.11.0/24)     │  │
│   │                                                               │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │
│   │   │ ECS Fargate │  │ RDS (Multi- │  │ ElastiCache │         │  │
│   │   │  (Backend)  │  │     AZ)     │  │   (Redis)   │         │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘         │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Security Groups:
• ALB SG: Inbound 443 from 0.0.0.0/0
• ECS SG: Inbound 8000 from ALB SG only
• RDS SG: Inbound 5432 from ECS SG only
• Redis SG: Inbound 6379 from ECS SG only
```

### 9.2 WAF Rules

```yaml
# AWS WAF Rule Set
Rules:
  - Name: RateLimit
    Priority: 1
    Statement:
      RateBasedStatement:
        Limit: 2000
        AggregateKeyType: IP
    Action: Block

  - Name: SQLInjection
    Priority: 2
    Statement:
      SqliMatchStatement:
        FieldToMatch:
          AllQueryArguments: {}
    Action: Block

  - Name: XSS
    Priority: 3
    Statement:
      XssMatchStatement:
        FieldToMatch:
          Body: {}
    Action: Block

  - Name: GeoBlock
    Priority: 4
    Statement:
      NotStatement:
        GeoMatchStatement:
          CountryCodes: [IN, US, GB, SG]
    Action: Block
```

---

## 10. Incident Response

### 10.1 Security Incident Classification

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 - Critical | Active breach, data exposure | < 1 hour | Unauthorized access, data leak |
| P2 - High | Potential breach, vulnerability | < 4 hours | SQL injection attempt, auth bypass |
| P3 - Medium | Anomalous activity | < 24 hours | Failed login spike, unusual export |
| P4 - Low | Security improvement | < 1 week | Patch update, config hardening |

### 10.2 Response Procedures

**P1 - Critical Incident:**
1. Isolate affected systems
2. Preserve evidence (logs, snapshots)
3. Notify stakeholders (within 1 hour)
4. Engage incident response team
5. Contain and eradicate threat
6. Restore from clean backup
7. Post-incident review

### 10.3 Contact List

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | Immediate |
| Security Lead | security@heallog.in | Within 15 min |
| CTO | cto@heallog.in | Within 30 min |
| Legal | legal@heallog.in | For P1 incidents |

---

## 11. Security Checklist

### Pre-Deployment
- [ ] SSL certificates configured and valid
- [ ] Security groups restrict access properly
- [ ] RDS encryption enabled
- [ ] S3 buckets not public
- [ ] IAM roles follow least privilege
- [ ] Secrets in Secrets Manager, not code
- [ ] Dependencies scanned for vulnerabilities
- [ ] OWASP Top 10 mitigations in place

### Ongoing
- [ ] Weekly dependency updates
- [ ] Monthly access review
- [ ] Quarterly penetration testing
- [ ] Annual security audit
- [ ] Continuous log monitoring
- [ ] Regular backup testing

---

## 12. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
