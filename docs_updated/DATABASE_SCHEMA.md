# HealLog v2.0 - Database Schema

**Version:** 2.0
**Database:** PostgreSQL 15+ with Row-Level Security (RLS)
**Last Updated:** January 2026

---

## 1. Overview

HealLog v2.0 uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation. All tenant-scoped tables include a `tenant_id` column with RLS policies enforcing automatic filtering.

---

## 2. Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   TENANTS   │───────│    USERS    │───────│    STAFF    │
│             │  1:N  │             │  1:1  │             │
└─────────────┘       └─────────────┘       └──────┬──────┘
                                                   │
                      ┌────────────────────────────┼────────────────────────────┐
                      │                            │                            │
                      ▼                            ▼                            ▼
               ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
               │  PATIENTS   │              │   ROSTERS   │              │   PAYROLL   │
               │             │              │             │              │             │
               └──────┬──────┘              └──────┬──────┘              └─────────────┘
                      │                            │
                      │                            │
                      ▼                            ▼
               ┌─────────────┐              ┌─────────────┐
               │   VISITS    │◀─────────────│   VISITS    │
               │             │              │             │
               └──────┬──────┘              └─────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  CLINICAL   │  │    CARE     │  │   BILLINGS  │
  │   NOTES     │  │   PLANS     │  │             │
  └─────────────┘  └─────────────┘  └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  PAYMENTS   │
                                   │             │
                                   └─────────────┘
```

---

## 3. Core Tables

### 3.1 Tenants Table

The root table for multi-tenancy. Each agency/clinic is a tenant.

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    registration_number VARCHAR(100),
    logo_url VARCHAR(500),

    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'free',  -- 'free', 'pro', 'agency'
    subscription_start_date DATE,
    subscription_end_date DATE,

    -- Usage Tracking
    current_staff_count INT DEFAULT 0,
    current_patient_count INT DEFAULT 0,
    api_usage_month INT DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'suspended', 'deleted'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 3.2 Users Table

All users across all roles (admin, finance, doctor, receptionist, nurse).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Identity
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    -- Role & Permissions
    role VARCHAR(50) NOT NULL,  -- 'admin', 'finance', 'doctor', 'receptionist', 'nurse'
    permissions JSONB DEFAULT '[]',  -- Additional granular permissions

    -- Profile
    avatar_url VARCHAR(500),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,

    -- Security
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX idx_users_tenant_active ON users(tenant_id, is_active);
```

### 3.3 Staff Table

Extended profile for field staff (nurses, attendants).

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Links to user account

    -- Identity
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    gender VARCHAR(20),
    date_of_birth DATE,

    -- Professional Info
    qualification VARCHAR(100),  -- 'GNM', 'BSc', 'Ayah', 'Physio'
    nursing_council_registration_number VARCHAR(100),
    nursing_council_state VARCHAR(100),
    experience_years INT,
    specializations TEXT,  -- Comma-separated: 'wound_care,physio,elder_care'

    -- Verification
    skills_verified BOOLEAN DEFAULT FALSE,
    verification_date DATE,
    verified_by UUID REFERENCES users(id),
    documents_submitted JSONB DEFAULT '{}',  -- {"aadhar": true, "license": true}

    -- Encrypted Fields (PII)
    aadhaar_number_encrypted BYTEA,
    bank_account_number_encrypted BYTEA,
    bank_ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),

    -- Address
    permanent_address TEXT,
    current_address TEXT,

    -- Compensation
    base_salary DECIMAL(10, 2),
    commission_percentage DECIMAL(5, 2),

    -- Status
    current_availability VARCHAR(50) DEFAULT 'off_duty',  -- 'on_duty', 'on_leave', 'off_duty'
    hire_date DATE,
    termination_date DATE,

    -- Performance
    performance_rating DECIMAL(3, 2),
    monthly_churn_flag BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON staff
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_staff_tenant ON staff(tenant_id);
CREATE INDEX idx_staff_tenant_availability ON staff(tenant_id, current_availability);
CREATE INDEX idx_staff_tenant_qualification ON staff(tenant_id, qualification);
```

### 3.4 Patients Table

Patient records with encrypted PII.

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Identity
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),

    -- Encrypted Contact Info (PII)
    phone_encrypted BYTEA NOT NULL,
    email_encrypted BYTEA,
    aadhar_encrypted BYTEA,

    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone_encrypted BYTEA,
    emergency_contact_relationship VARCHAR(50),

    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),

    -- Location (for GPS distance calculation)
    home_latitude DECIMAL(10, 8),
    home_longitude DECIMAL(11, 8),

    -- Medical Info
    medical_history TEXT,
    allergies TEXT,
    chronic_conditions TEXT,  -- 'diabetes,hypertension,asthma'
    current_medications TEXT,

    -- Insurance
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),

    -- ABHA Integration
    abha_id VARCHAR(100),
    abha_linked_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_patients_tenant_active ON patients(tenant_id, is_active);
CREATE INDEX idx_patients_tenant_name ON patients(tenant_id, first_name, last_name);
```

---

## 4. Operational Tables

### 4.1 Rosters Table

Shift scheduling for staff-patient assignments.

```sql
CREATE TABLE rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),

    -- Shift Details
    shift_type VARCHAR(50),  -- '12_hour', '24_hour', 'day', 'night'
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    days_of_week VARCHAR(100),  -- 'Mon,Tue,Wed' for recurring
    recurrence_end_date DATE,
    parent_roster_id UUID REFERENCES rosters(id),  -- For recurring instances

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',  -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,

    -- Notes
    notes TEXT,
    special_instructions TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent double-booking
    UNIQUE(tenant_id, staff_id, shift_date, shift_start)
);

-- Enable RLS
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON rosters
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_rosters_staff_date ON rosters(tenant_id, staff_id, shift_date);
CREATE INDEX idx_rosters_patient_date ON rosters(tenant_id, patient_id, shift_date);
CREATE INDEX idx_rosters_date_status ON rosters(tenant_id, shift_date, status);
```

### 4.2 Visits Table

Check-in/check-out records with GPS tracking.

```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- References
    roster_id UUID NOT NULL REFERENCES rosters(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Scheduled Time
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,

    -- Check-In
    actual_checkin_time TIMESTAMP,
    checkin_latitude DECIMAL(10, 8),
    checkin_longitude DECIMAL(11, 8),
    checkin_accuracy DECIMAL(5, 2),  -- GPS accuracy in meters
    checkin_photo_url VARCHAR(500),
    checkin_device_info JSONB,

    -- Check-Out
    actual_checkout_time TIMESTAMP,
    checkout_latitude DECIMAL(10, 8),
    checkout_longitude DECIMAL(11, 8),
    checkout_accuracy DECIMAL(5, 2),
    checkout_photo_url VARCHAR(500),

    -- Validation
    distance_from_home DECIMAL(5, 2),  -- km from patient home
    arrival_status VARCHAR(50),  -- 'on_time', 'early', 'late'
    arrival_minutes_delta INT,  -- +15 = 15 min late, -5 = 5 min early
    location_verified BOOLEAN DEFAULT FALSE,

    -- Visit Completion
    visit_completed BOOLEAN DEFAULT FALSE,
    completion_percentage INT DEFAULT 0,  -- % of care tasks done

    -- Proof
    proof_photos_urls JSONB DEFAULT '[]',  -- Array of S3 URLs

    -- Notes
    visit_notes TEXT,
    patient_condition_notes TEXT,

    -- Sync Status (for offline)
    sync_status VARCHAR(50) DEFAULT 'synced',  -- 'pending', 'syncing', 'synced', 'error'
    local_id VARCHAR(100),  -- Client-side UUID for conflict resolution
    synced_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON visits
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_visits_staff_date ON visits(tenant_id, staff_id, created_at);
CREATE INDEX idx_visits_patient_date ON visits(tenant_id, patient_id, created_at);
CREATE INDEX idx_visits_roster ON visits(roster_id);
CREATE INDEX idx_visits_sync_status ON visits(sync_status) WHERE sync_status != 'synced';
```

---

## 5. Clinical Tables

### 5.1 Clinical Notes Table

```sql
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- References
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Note Content
    note_type VARCHAR(50),  -- 'consultation', 'follow_up', 'prescription', 'discharge'
    title VARCHAR(255),

    -- Clinical Data
    chief_complaint TEXT,
    clinical_observation TEXT,
    vitals JSONB,  -- {"bp": "120/80", "temp": 98.6, "pulse": 72, "spo2": 98, "weight": 70}
    assessment TEXT,
    diagnosis TEXT,
    plan TEXT,

    -- Prescription
    medications_prescribed JSONB,  -- [{"name": "Aspirin", "dose": "500mg", "frequency": "BD", "duration": "5 days"}]

    -- Follow-up
    next_visit_recommendation VARCHAR(100),
    next_visit_date DATE,

    -- Status
    is_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON clinical_notes
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(tenant_id, patient_id);
CREATE INDEX idx_clinical_notes_doctor ON clinical_notes(tenant_id, doctor_id);
CREATE INDEX idx_clinical_notes_visit ON clinical_notes(visit_id);
```

### 5.2 Care Plans Table

```sql
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- References
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),

    -- Plan Details
    plan_type VARCHAR(100),  -- 'post_op_wound_care', 'elder_care', 'physio', 'diabetes_management'
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE care_plan_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,

    -- Task Details
    task_description VARCHAR(255) NOT NULL,
    task_category VARCHAR(100),  -- 'medication', 'exercise', 'wound_care', 'vitals', 'hygiene'
    frequency VARCHAR(50),  -- 'daily', 'twice_daily', 'alternate_day', 'weekly'
    time_of_day VARCHAR(50),  -- 'morning', 'afternoon', 'evening', 'night'
    sequence_order INT,

    -- Instructions
    detailed_instructions TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE care_task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_task_id UUID NOT NULL REFERENCES care_plan_tasks(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id),

    -- Completion
    completed_at TIMESTAMP NOT NULL,
    completed_by UUID NOT NULL REFERENCES users(id),
    completion_notes TEXT,

    -- Verification
    vitals_recorded JSONB,
    photo_proof_url VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON care_plans
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 6. Financial Tables

### 6.1 Billings Table

```sql
CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- References
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,

    -- Billing Period
    billing_period_start DATE,
    billing_period_end DATE,

    -- Line Items (summary)
    description TEXT,
    quantity INT,
    rate_per_unit DECIMAL(10, 2),

    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Payment Status
    payment_status VARCHAR(50) DEFAULT 'unpaid',  -- 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    amount_due DECIMAL(10, 2),

    -- Payment Link
    razorpay_payment_link_id VARCHAR(100),
    razorpay_payment_link_url VARCHAR(500),

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Status
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    sent_via VARCHAR(50),  -- 'email', 'whatsapp', 'sms'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, invoice_number)
);

-- Enable RLS
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON billings
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_billings_patient ON billings(tenant_id, patient_id);
CREATE INDEX idx_billings_status ON billings(tenant_id, payment_status);
CREATE INDEX idx_billings_date ON billings(tenant_id, invoice_date);
```

### 6.2 Billing Line Items Table

```sql
CREATE TABLE billing_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,

    -- Item Details
    description VARCHAR(255) NOT NULL,
    service_type VARCHAR(100),  -- 'home_visit', 'nursing_care', 'physio', 'equipment_rental'
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(50),  -- 'visit', 'hour', 'day', 'package'
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,

    -- Reference to visits
    visit_ids JSONB DEFAULT '[]',  -- Array of visit UUIDs this line item covers

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,

    -- Payment Details
    payment_method VARCHAR(50) NOT NULL,  -- 'razorpay', 'cash', 'check', 'bank_transfer', 'upi'
    amount DECIMAL(10, 2) NOT NULL,

    -- Gateway Info
    payment_gateway VARCHAR(50),
    payment_gateway_id VARCHAR(100),  -- Razorpay transaction ID
    payment_gateway_status VARCHAR(50),
    gateway_response JSONB,

    -- Status
    payment_status VARCHAR(50) NOT NULL,  -- 'pending', 'success', 'failed', 'refunded'

    -- Receipt
    receipt_number VARCHAR(50),

    -- Timestamps
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON payments
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_payments_billing ON payments(billing_id);
CREATE INDEX idx_payments_gateway ON payments(payment_gateway_id);
```

### 6.4 Payroll Table

```sql
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

    -- Period
    payroll_month DATE NOT NULL,  -- First day of month (e.g., 2026-01-01)

    -- Attendance Summary
    working_days INT,
    attendance_days INT,
    absent_days INT,
    late_arrivals INT,

    -- Visit Summary
    total_visits INT,
    completed_visits INT,

    -- Compensation
    base_salary DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2),
    commission_earned DECIMAL(10, 2),
    bonuses DECIMAL(10, 2) DEFAULT 0,
    overtime_amount DECIMAL(10, 2) DEFAULT 0,

    -- Deductions
    deductions DECIMAL(10, 2) DEFAULT 0,
    deduction_reasons TEXT,

    -- Total
    gross_amount DECIMAL(10, 2),
    net_payable DECIMAL(10, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'pending_approval', 'approved', 'paid'

    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Payment
    payment_method VARCHAR(50),
    payment_date DATE,
    bank_transfer_id VARCHAR(100),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, staff_id, payroll_month)
);

-- Enable RLS
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON payroll
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_payroll_staff ON payroll(tenant_id, staff_id);
CREATE INDEX idx_payroll_month ON payroll(tenant_id, payroll_month);
CREATE INDEX idx_payroll_status ON payroll(tenant_id, status);
```

---

## 7. System Tables

### 7.1 Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,

    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- Action
    action VARCHAR(50) NOT NULL,  -- 'create', 'read', 'update', 'delete', 'login', 'logout'
    resource_type VARCHAR(100) NOT NULL,  -- 'patient', 'visit', 'billing', etc.
    resource_id UUID,

    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (tenant-scoped view)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON audit_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

### 7.2 Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Recipient
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),  -- 'roster_assigned', 'payment_received', 'shift_reminder'

    -- Delivery
    channel VARCHAR(50) NOT NULL,  -- 'push', 'sms', 'whatsapp', 'email', 'in_app'
    delivery_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed'
    delivered_at TIMESTAMP,
    external_id VARCHAR(100),  -- MSG91 message ID, etc.

    -- Read Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON notifications
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_staff ON notifications(staff_id, is_read);
```

---

## 8. Migration Scripts

### 8.1 Initial Migration (001_initial_schema.sql)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables (as defined above)
-- ...

-- Create RLS policies
-- ...

-- Create indexes
-- ...

-- Create helper functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Repeat for other tables...
```

### 8.2 Running Migrations

```bash
# Using Alembic
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 9. Performance Considerations

### 9.1 Key Indexes

All tables include indexes for:
- Tenant isolation (`tenant_id`)
- Common filter columns (status, date ranges)
- Foreign key relationships

### 9.2 Query Optimization

```sql
-- Example: Efficient roster query with RLS
-- RLS automatically adds: WHERE tenant_id = current_setting('app.current_tenant_id')::UUID

SELECT r.*, s.first_name as staff_name, p.first_name as patient_name
FROM rosters r
JOIN staff s ON r.staff_id = s.id
JOIN patients p ON r.patient_id = p.id
WHERE r.shift_date BETWEEN '2026-01-01' AND '2026-01-31'
AND r.status = 'scheduled'
ORDER BY r.shift_date, r.shift_start;
```

### 9.3 Connection Pooling

Use PgBouncer for connection pooling:

```ini
[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

---

## 10. Data Retention Policy

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Audit Logs | 7 years | Archive to S3 |
| Visit Records | 5 years | Soft delete, then archive |
| Financial Records | 7 years | Never delete |
| Patient Data | Indefinite (until requested) | GDPR deletion available |
| Session Data | 30 days | Auto-purge |

---

## 11. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [API Reference](./API_REFERENCE.md)
- [Security & Compliance](./SECURITY_COMPLIANCE.md)
