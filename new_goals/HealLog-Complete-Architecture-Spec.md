# HEALLOG: COMPREHENSIVE PRODUCT & ARCHITECTURE SPECIFICATION

**Document Version:** 1.0  
**Date:** January 25, 2026  
**Target:** Solo Founder (Data Engineer) in Bengaluru  
**Goal:** ₹15-20L MRR in 18-24 months targeting home care agencies + multi-clinic doctors

---

## PART 1: CORE FEATURES & USER HIERARCHY

### 1.1 CORE FEATURES SUMMARY

HealLog is transitioning from a generic clinic EMR to a **Specialized Operations OS for Home Care Agencies**. This distinction is critical because:

- **Generic EMR** (Practo, Lybrate, HealthPlix) → ABDM compliance mandatory, ₹40L-1.5L/year audit costs
- **Operations ERP** (HealLog) → Staff management, rostering, billing, field tracking → No immediate ABDM burden

#### Feature Tier Breakdown:

**TIER 1: MINIMUM VIABLE PRODUCT (MVP) - Q1 2026**
1. **Patient Management** (exists)
   - Patient search, filtering, grouping ✅
   - Contact sync, basic records ✅
   - Document storage (Aadhar, medical reports) ✅

2. **Clinic/Agency Staff Management** (NEW - CRITICAL)
   - Staff directory with credentials (License #, Registration, Documents)
   - Skill matrix (Nursing types: GNM, BSc, Ayah; specialties: wound care, physio, elder care)
   - Availability status (On-duty, On-leave, Off-duty)
   - Performance ratings and complaint log

3. **Visit Scheduling** (REDESIGNED FOR FIELD STAFF)
   - Drag-and-drop rostering calendar (per-staff, per-patient)
   - Shift assignment (12-hour, 24-hour, recurring schedules)
   - Route display (not yet GPS, but prep for it)
   - SMS/WhatsApp notifications to field staff

4. **Attendance & GPS Check-In** (NEW)
   - Mobile check-in/check-out with location capture
   - Timestamp verification
   - Late arrival/early departure flags
   - Photo proof of visit (optional)

5. **Basic Billing** (REDESIGNED FOR AGENCIES)
   - Invoice generation from attendance logs
   - Per-visit or package-based billing
   - Discount/adjustment tracking
   - Payment status tracking (pending, paid, overdue)

6. **Staff Payout Calculation** (NEW - HIGH VALUE)
   - Commission splits (e.g., Agency 30% / Staff 70%)
   - Fixed salary + variable bonus models
   - Attendance-linked deductions
   - Payroll report generation

7. **Offline Sync** (exists, refine for field staff)
   - WatermelonDB sync optimized for roster + attendance
   - Conflict resolution for offline edits
   - Mobile-first UI for Ayahs with limited literacy

**TIER 2: MARKET VIABILITY FEATURES - Q2 2026**
8. **WhatsApp + SMS Integration** (CRITICAL FOR ADOPTION)
   - Shift reminders to field staff
   - Appointment confirmations to families
   - Payment reminders to agencies
   - DLT compliance for all templates

9. **Patient Engagement** (LITE)
   - Family WhatsApp notifications ("Nurse X arrived at 9:15 AM")
   - Visit completion photo/notes
   - Basic care plan tracking

10. **Analytics Dashboard** (AGENCY FOCUSED)
    - Staff utilization (hours/visits per nurse)
    - Revenue per staff
    - Attendance trends and absenteeism
    - Patient churn (when families stop requesting visits)
    - Billing metrics (outstanding, collection rate)

**TIER 3: DIFFERENTIATION FEATURES - Q3-Q4 2026**
11. **ABHA Integration** (Non-clinical, just patient ID linking)
    - Link patient ABHA if available
    - Store ABHA ID for compliance readiness
    - No clinical data exchange yet

12. **Telemedicine** (Optional, integrate via third-party)
    - Video consults for follow-up checks
    - Logged to patient record
    - Payment processing

13. **Equipment Tracking** (For agencies offering rentals)
    - Oxygen concentrators, hospital beds, wheelchairs inventory
    - Rental assignment to patients
    - Return tracking and maintenance logs

14. **Care Plans** (Basic version)
    - Pre-defined templates (post-op wound care, elder care, physio)
    - Checklist per visit (vitals, wound dressing, exercises)
    - Field staff marks completion

---

### 1.2 USER HIERARCHY & ROLE-BASED PERMISSIONS

HealLog supports **4 distinct user types** with hierarchical permissions:

```
┌─────────────────────────────────────────────────────────┐
│              AGENCY OWNER / ADMIN                        │
│  (Manages everything: staff, patients, billing, reports) │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  FINANCE MGR │      │    DOCTOR    │      │ RECEPTIONIST │
│ (Billing,    │      │ (Clinical    │      │ (Patient     │
│  Payroll)    │      │  notes, Rx)  │      │  booking,    │
└──────────────┘      └──────────────┘      │  follow-up)  │
                                             └──────────────┘
                      ↓
              ┌─────────────────────┐
              │  FIELD STAFF (NURSE)│
              │  (Check-in/out,     │
              │   visit notes)      │
              └─────────────────────┘
```

#### **1. AGENCY OWNER / ADMIN**

**Who:** Home care agency owner, clinic manager, senior staff

**Views & Permissions:**
- ✅ Full access to all modules
- ✅ Create/edit/delete staff, patients, rosters
- ✅ View all financial reports (revenue, payroll, outstanding)
- ✅ Manage billing and payment collection
- ✅ Generate compliance reports
- ✅ Settings: configure agency details, pricing, SMS templates
- ✅ User management: create/disable other staff accounts
- ❌ Cannot directly modify patient clinical records (doctor-only)

**Dashboard Components:**
- At-a-glance metrics: Active staff, today's visits, today's revenue, pending collections
- Upcoming shifts (next 7 days)
- Attendance summary (who's late, who's absent)
- Financial dashboard (MRR tracking, outstanding dues, payroll pending)
- Alerts: critical gaps (no nurse assigned to visit), system errors

**Key Actions:**
- Create rosters and drag-drop assign staff
- Approve timesheets
- Generate invoices
- Process payouts to staff
- Create/manage patients and families

---

#### **2. FINANCE MANAGER**

**Who:** Accountant or finance person in agency

**Views & Permissions:**
- ✅ View attendance logs (for billing accuracy)
- ✅ Generate invoices and manage payment tracking
- ✅ View payroll reports and approve payout calculations
- ✅ Export data to accounting software (CSV/Excel)
- ✅ View financial dashboards and reports
- ✅ Create payment links for families (via Razorpay)
- ❌ Cannot modify rosters or staff assignments
- ❌ Cannot edit patient clinical information
- ❌ Cannot delete records

**Dashboard Components:**
- Outstanding receivables (family-wise)
- Staff payroll pending
- Invoice status (sent, paid, overdue)
- Payment gateway reconciliation (Razorpay payments)
- Billing trends

**Key Actions:**
- Generate billing invoices from attendance
- Mark payments as received
- Generate payroll reports
- Create payment reminders to families (WhatsApp)
- Export to accounting software

---

#### **3. DOCTOR / CLINICAL STAFF**

**Who:** MBBS doctor, physiotherapist, or specialized care professional

**Views & Permissions:**
- ✅ View assigned patients
- ✅ Create and edit clinical notes for visits
- ✅ Write/modify prescriptions (digital Rx)
- ✅ View patient history and past notes
- ✅ Create/modify care plans for patients
- ✅ Approve field staff completion of care tasks
- ✅ Video consult (if telemedicine integrated)
- ❌ Cannot access financial data
- ❌ Cannot modify rosters or staff assignments
- ❌ Cannot delete patient records

**Dashboard Components:**
- Assigned patients for today
- Pending clinical notes to review
- Care plan compliance checklist
- Patient progress notes timeline

**Key Actions:**
- Create clinical notes (structured templates: vitals, observations, plan)
- Prescribe medications or care instructions
- Review field staff visit compliance
- Update care plans mid-treatment
- Sign off on visit completion

---

#### **4. RECEPTIONIST**

**Who:** Clinic receptionist, patient call handler

**Views & Permissions:**
- ✅ View patient directory
- ✅ Create new patient records (basic info)
- ✅ Schedule appointments / request visits
- ✅ Communicate with patients (phone, WhatsApp)
- ✅ Track visit status (in-progress, completed, cancelled)
- ✅ Send SMS/WhatsApp reminders to patients
- ✅ Generate appointment reports
- ❌ Cannot access financial data
- ❌ Cannot edit rosters
- ❌ Cannot view clinical notes
- ❌ Cannot process payments

**Dashboard Components:**
- Today's scheduled visits (status: pending, confirmed, completed)
- Upcoming appointments (next 7 days)
- Patient communication log
- Cancellation requests

**Key Actions:**
- Search and create patient records
- Schedule visits via drag-drop calendar
- Send visit confirmations via SMS/WhatsApp
- Track visit status and flag issues
- Escalate complications to doctor

---

#### **5. FIELD STAFF (NURSE / ATTENDANT)**

**Who:** GNM nurses, Ayahs, physiotherapists, senior care assistants

**Views & Permissions:**
- ✅ View assigned shifts/patients for today
- ✅ Check-in and check-out (mobile app)
- ✅ View care plan checklist for patient
- ✅ Record vitals, notes, observations
- ✅ Mark tasks as complete (wound dressing, exercises)
- ✅ Upload photos (proof of visit)
- ✅ View route and directions to patient home
- ✅ Access offline (no internet required)
- ✅ View personal attendance/pay history
- ❌ Cannot see other staff data
- ❌ Cannot access financial data
- ❌ Cannot modify rosters
- ❌ Cannot create clinical prescriptions

**Mobile App Components (Offline-First PWA):**
- Today's roster (shifts, patient names, addresses, phone)
- Navigation to patient home (maps integration)
- Check-in/check-out button with GPS
- Care plan checklist (tap to mark complete)
- Notes field (what was done, patient condition)
- Photo upload (proof of visit)
- Offline sync status indicator
- Personal timesheet (monthly, to track pay)

**Key Actions:**
- Check-in at patient home (capture time + location)
- Mark care tasks as complete
- Record vital signs if trained
- Upload photos of visit
- Check-out and confirm end time
- View roster for next week

---

### 1.3 FEATURE MATRIX BY USER TYPE

| Feature | Admin | Finance | Doctor | Receptionist | Field Staff |
|---------|-------|---------|--------|--------------|-------------|
| **Staff Management** | Create/Edit/Delete | View only | - | - | - |
| **Patient Directory** | Full | View | Assigned | Full | Assigned |
| **Create Rosters** | Create/Modify | View | - | - | View |
| **Assign Shifts** | Full control | - | - | - | - |
| **Check-In/Check-Out** | View | View | - | - | Execute |
| **Clinical Notes** | View | - | Create/Edit | - | Submit raw notes |
| **Prescriptions** | View | - | Create/Sign | - | - |
| **Care Plans** | View/Create | - | Create/Modify | - | Execute/Track |
| **Billing/Invoices** | Create/Manage | Create/Manage | - | - | - |
| **View Financials** | Full | Full | - | - | Personal pay only |
| **Staff Payroll** | Approve | Calculate | - | - | - |
| **Send SMS/WhatsApp** | Bulk | Bulk | - | Individual | - |
| **Offline Access** | Web only | Web only | Web only | Web only | Full (PWA) |
| **Device** | Desktop/Laptop | Desktop/Laptop | Desktop/Mobile | Desktop/Mobile | Mobile (Android) |

---

## PART 2: BACKEND ARCHITECTURE

### 2.1 SYSTEM OVERVIEW

```
                    ┌─────────────────────────┐
                    │   FRONTEND CLIENTS      │
                    ├─────────────────────────┤
                    │ • Web (React/Vite)      │
                    │ • Mobile PWA (Expo)     │
                    │ • WhatsApp Integration  │
                    └────────────┬────────────┘
                                 │ HTTPS/TLS
                    ┌────────────▼────────────┐
                    │   API GATEWAY / LB      │
                    │   (Nginx or built-in)   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼─────────────────────────┐
        │                        │                         │
        ▼                        ▼                         ▼
┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐
│  FASTAPI WORKERS │   │  FASTAPI WORKERS │   │  FASTAPI       │
│  (Multi-process) │   │  (Multi-process) │   │  WORKERS       │
│  • Auth          │   │  • Patient API   │   │  • Background  │
│  • Rosters       │   │  • Visits API    │   │    Jobs        │
│  • Billing       │   │  • Clinical API  │   │                │
└──────────────────┘   └──────────────────┘   └────────────────┘
        │                      │                         │
        └──────────────────────┼─────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   POSTGRESQL RLS    │
                    │   (Multi-Tenant)    │
                    ├─────────────────────┤
                    │ • Tenants Table     │
                    │ • Users Table       │
                    │ • Patients Table    │
                    │ • Staffing Table    │
                    │ • Visits Table      │
                    │ • Billing Table     │
                    │ • Payroll Table     │
                    │ • Audit Logs        │
                    └─────────────────────┘
                               │
        ┌──────────────────────┼─────────────────────────┐
        │                      │                         │
        ▼                      ▼                         ▼
    ┌────────┐           ┌────────┐            ┌──────────────┐
    │ Redis  │           │   S3   │            │  Celery Task │
    │ Cache  │           │ Document│           │  Queue       │
    │ Session│           │ Storage │           │  (Redis)     │
    └────────┘           └────────┘            └──────────────┘
        │                      │                        │
        ├──────────────────────┼────────────────────────┤
        │                      │                        │
        ▼                      ▼                        ▼
   SMS/OTP              CDN/Delivery      Background Jobs:
   (MSG91)              (CloudFront)      • SMS reminders
                                          • Email reports
                                          • Payroll calc
                                          • Invoice gen
                                          • Sync conflicts
```

### 2.2 CORE BACKEND MODULES

**Directory Structure:**
```
backend/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py              # JWT, login, OTP
│   │   │   ├── tenants.py           # Tenant mgmt (admin-only)
│   │   │   ├── users.py             # User CRUD, roles
│   │   │   ├── patients.py          # Patient records
│   │   │   ├── staff.py             # Staff directory, skills
│   │   │   ├── rosters.py           # Shift scheduling
│   │   │   ├── visits.py            # Visit logs, check-in/out
│   │   │   ├── clinical_notes.py    # Doctor notes, Rx
│   │   │   ├── care_plans.py        # Care templates, checklists
│   │   │   ├── billing.py           # Invoices, payments
│   │   │   ├── payroll.py           # Staff payouts
│   │   │   ├── analytics.py         # Dashboard data
│   │   │   ├── integrations.py      # SMS, WhatsApp, ABDM
│   │   │   └── reports.py           # Data export
│   │   ├── middleware/
│   │   │   ├── auth.py              # JWT verification
│   │   │   ├── tenant_context.py    # Set tenant_id for RLS
│   │   │   ├── error_handler.py     # Centralized errors
│   │   │   └── audit_logger.py      # Log all data access
│   │   └── schemas/
│   │       ├── patient.py
│   │       ├── staff.py
│   │       ├── visit.py
│   │       ├── billing.py
│   │       └── ... (Pydantic models)
│   │
├── core/
│   ├── config.py                    # App settings, ENV vars
│   ├── security.py                  # Password hashing, JWT
│   ├── dependencies.py              # Injection (DB, auth, tenant)
│   └── constants.py                 # Enums, fixed values
│
├── db/
│   ├── models.py                    # SQLAlchemy ORM models
│   ├── database.py                  # Connection pool, session
│   └── migrations/                  # Alembic scripts
│
├── services/
│   ├── auth_service.py              # Business logic: login, OTP
│   ├── tenant_service.py            # Tenant isolation enforcement
│   ├── patient_service.py           # Patient CRUD + search
│   ├── staff_service.py             # Staff mgmt, credentials
│   ├── roster_service.py            # Shift scheduling logic
│   ├── visit_service.py             # Check-in/out, GPS logging
│   ├── billing_service.py           # Invoice generation
│   ├── payroll_service.py           # Salary/commission calc
│   ├── notification_service.py      # SMS/WhatsApp dispatch
│   ├── abdm_service.py              # ABDM/ABHA integration
│   ├── analytics_service.py         # Metrics calculation
│   └── compliance_service.py        # Audit logs, retention
│
├── tasks/
│   ├── celery_app.py                # Celery config
│   ├── reminders.py                 # Schedule SMS/WhatsApp
│   ├── billing_tasks.py             # Auto-invoice generation
│   ├── payroll_tasks.py             # Monthly payroll calc
│   ├── sync_tasks.py                # Conflict resolution
│   └── cleanup_tasks.py             # Data retention
│
├── utils/
│   ├── validators.py                # Phone, email, Aadhar format
│   ├── formatters.py                # Currency, date, SMS templates
│   ├── encryption.py                # Field-level encryption
│   └── gps.py                       # Location haversine distance
│
└── main.py                          # FastAPI app entry
```

### 2.3 COMPLETE API ENDPOINTS

**Authentication & Authorization:**
```
POST   /v1/auth/register            # Create new account (admin signup)
POST   /v1/auth/login               # Email + password login
POST   /v1/auth/verify-otp          # OTP verification
POST   /v1/auth/refresh-token       # Refresh JWT
POST   /v1/auth/logout              # Invalidate token
POST   /v1/auth/password-reset      # Reset forgotten password
POST   /v1/auth/change-password     # Change password while logged in
```

**Tenant Management (Admin-only):**
```
POST   /v1/tenants                  # Create new agency/clinic (self-signup)
GET    /v1/tenants/{tenant_id}      # Fetch tenant config
PUT    /v1/tenants/{tenant_id}      # Update agency details (name, address, phone)
DELETE /v1/tenants/{tenant_id}      # Delete agency (soft-delete with 30-day grace)
GET    /v1/tenants/{tenant_id}/usage # Check API usage, staff count, etc.
```

**User Management:**
```
POST   /v1/users                    # Create new user (admin adds staff/doctor)
GET    /v1/users                    # List all users in agency
GET    /v1/users/{user_id}          # Get specific user
PUT    /v1/users/{user_id}          # Update user details/role
DELETE /v1/users/{user_id}          # Disable user account (soft-delete)
POST   /v1/users/{user_id}/permissions # Grant specific permissions
GET    /v1/users/me                 # Get current logged-in user
```

**Patient Management:**
```
POST   /v1/patients                 # Create patient
GET    /v1/patients                 # List patients (paginated, searchable)
GET    /v1/patients/{patient_id}    # Get patient details + full history
PUT    /v1/patients/{patient_id}    # Update patient info
DELETE /v1/patients/{patient_id}    # Delete patient (soft-delete, anonymize)
GET    /v1/patients/search          # Advanced search (name, phone, ID)
GET    /v1/patients/{patient_id}/visits # Get all visits for patient
GET    /v1/patients/{patient_id}/documents # Get medical documents
POST   /v1/patients/{patient_id}/documents # Upload document (prescription, reports)
```

**Staff Directory:**
```
POST   /v1/staff                    # Add staff to agency
GET    /v1/staff                    # List all staff (with availability)
GET    /v1/staff/{staff_id}         # Get staff profile + credentials
PUT    /v1/staff/{staff_id}         # Update staff info
DELETE /v1/staff/{staff_id}         # Remove staff from agency
PUT    /v1/staff/{staff_id}/skills  # Update skill matrix
PUT    /v1/staff/{staff_id}/availability # Mark on-duty, on-leave, off-duty
GET    /v1/staff/{staff_id}/attendance # Monthly attendance record
GET    /v1/staff/available          # Get available staff for a date/time
```

**Roster Management:**
```
POST   /v1/rosters                  # Create roster for agency
GET    /v1/rosters                  # Get current rosters
GET    /v1/rosters/{roster_id}      # Get specific roster
PUT    /v1/rosters/{roster_id}      # Update roster (add/remove shifts)
DELETE /v1/rosters/{roster_id}      # Archive roster

POST   /v1/rosters/{roster_id}/shifts # Add shift to roster
PUT    /v1/rosters/{roster_id}/shifts/{shift_id} # Update shift (staff, time, patient)
DELETE /v1/rosters/{roster_id}/shifts/{shift_id} # Cancel shift
GET    /v1/rosters/calendar/{date}  # Get shifts for specific date (calendar view)
GET    /v1/rosters/{staff_id}/schedule # Get personal schedule for staff member
```

**Visit Tracking (Core for Home Care):**
```
POST   /v1/visits                   # Create visit record (admin pre-creates)
GET    /v1/visits                   # List visits (filters: status, date, staff)
GET    /v1/visits/{visit_id}        # Get visit details + check-in/out logs
PUT    /v1/visits/{visit_id}/checkin # Field staff check-in (mobile)
  Payload: { "latitude": X, "longitude": Y, "timestamp": ISO }
PUT    /v1/visits/{visit_id}/checkout # Field staff check-out (mobile)
PUT    /v1/visits/{visit_id}/notes  # Add visit notes + care completion
DELETE /v1/visits/{visit_id}        # Cancel visit (soft-delete)
GET    /v1/visits/{visit_id}/proof  # Get visit proof (photos, GPS log)
GET    /v1/visits/today             # Dashboard: today's visits + status
```

**Clinical Notes & Care Plans:**
```
POST   /v1/clinical-notes           # Doctor creates note for patient visit
GET    /v1/clinical-notes/{patient_id} # Get all notes for patient
PUT    /v1/clinical-notes/{note_id} # Update note
DELETE /v1/clinical-notes/{note_id} # Delete note

POST   /v1/care-plans               # Create care plan for patient
GET    /v1/care-plans/{patient_id}  # Get active care plan
PUT    /v1/care-plans/{plan_id}     # Update care plan
POST   /v1/care-plans/{plan_id}/tasks # Add care task (checklist item)
PUT    /v1/care-plans/{plan_id}/tasks/{task_id} # Mark task complete
```

**Billing (Revenue):**
```
POST   /v1/billing/invoices         # Generate invoice from visits
GET    /v1/billing/invoices         # List all invoices
GET    /v1/billing/invoices/{invoice_id} # Get invoice details
PUT    /v1/billing/invoices/{invoice_id} # Mark as sent/paid/overdue
GET    /v1/billing/outstanding      # Get outstanding dues (family-wise)
POST   /v1/billing/payment-link     # Create Razorpay payment link for family
GET    /v1/billing/reconciliation   # Reconcile payments from gateway
```

**Payroll (Expenses - Staff Compensation):**
```
GET    /v1/payroll/{staff_id}/monthly # Calculate monthly salary/commission
GET    /v1/payroll/report           # Monthly payroll report (all staff)
PUT    /v1/payroll/{staff_id}/approve # Approve payout for staff
POST   /v1/payroll/generate-slips   # Generate salary slips
GET    /v1/payroll/pending          # List staff awaiting payout
```

**Analytics & Reporting:**
```
GET    /v1/analytics/dashboard      # Get dashboard metrics (MRR, staff util, churn)
GET    /v1/analytics/staff-utilization # Hours/visits per nurse
GET    /v1/analytics/revenue        # Revenue trends
GET    /v1/analytics/collection     # Payment collection rate
GET    /v1/analytics/attendance     # Attendance summary (by staff, by date)
GET    /v1/analytics/export         # Export data (CSV/Excel) for accountant
```

**Integrations:**
```
POST   /v1/integrations/sms-setup   # Configure SMS provider (MSG91)
POST   /v1/integrations/whatsapp-templates # Set up WhatsApp templates
GET    /v1/integrations/abdm-status # Check ABDM/ABHA setup
POST   /v1/integrations/payments    # Configure Razorpay keys
POST   /v1/integrations/test-sms    # Send test SMS
```

### 2.4 DATABASE SCHEMA

**Multi-Tenant Architecture (PostgreSQL with Row-Level Security):**

```sql
-- TENANT ISOLATION TABLE
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,                    -- Agency/clinic name
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    registration_number VARCHAR(100),              -- Nursing Council registration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_plan VARCHAR(50),                 -- 'free', 'pro', 'agency'
    status VARCHAR(20) DEFAULT 'active',           -- 'active', 'suspended', 'deleted'
    current_staff_count INT DEFAULT 0,
    current_patient_count INT DEFAULT 0,
    api_usage_month INT DEFAULT 0
);

-- USER TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,                     -- 'admin', 'finance', 'doctor', 'receptionist', 'nurse'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    UNIQUE(tenant_id, email)
);
-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- PATIENTS TABLE
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone_encrypted BYTEA NOT NULL,                -- Encrypted phone number
    email_encrypted BYTEA,
    aadhar_encrypted BYTEA,                        -- Encrypted Aadhar (if available)
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    emergency_contact_phone_encrypted BYTEA,
    emergency_contact_name VARCHAR(255),
    medical_history TEXT,
    allergies TEXT,
    chronic_conditions TEXT,                       -- Diabetes, HTN, etc.
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    abha_id VARCHAR(100),                          -- ABDM Health ID (if linked)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, aadhar_encrypted)            -- Aadhar uniqueness per tenant
);
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- STAFF TABLE
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    gender VARCHAR(20),
    date_of_birth DATE,
    qualification VARCHAR(100),                    -- GNM, BSc, Ayah, etc.
    nursing_council_registration_number VARCHAR(100),
    nursing_council_state VARCHAR(100),
    aadhaar_number_encrypted BYTEA,
    bank_account_number_encrypted BYTEA,
    bank_ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    permanent_address TEXT,
    current_availability VARCHAR(50),              -- 'on_duty', 'on_leave', 'off_duty'
    experience_years INT,
    specializations TEXT,                          -- Wound care, physio, elder care (comma-separated)
    skills_verified BOOLEAN DEFAULT FALSE,
    verification_date DATE,
    verified_by UUID REFERENCES users(id),
    base_salary DECIMAL(10, 2),                    -- Fixed component
    commission_percentage DECIMAL(5, 2),           -- Variable component (%)
    hire_date DATE,
    termination_date DATE,
    documents_submitted JSON,                      -- {"aadhar": true, "license": true}
    performance_rating DECIMAL(3, 2),
    monthly_churn_flag BOOLEAN DEFAULT FALSE,      -- Flag if absent >3 days/month
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON staff
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ROSTERS TABLE
CREATE TABLE rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    shift_type VARCHAR(50),                        -- '12_hour', '24_hour', 'day', 'night'
    shift_start TIME,
    shift_end TIME,
    shift_date DATE NOT NULL,
    days_of_week VARCHAR(100),                     -- 'Mon,Tue,Wed' for recurring
    recurrence_end_date DATE,                      -- When recurring shift ends
    assigned_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'scheduled',        -- 'scheduled', 'completed', 'cancelled', 'no_show'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, staff_id, patient_id, shift_date)
);
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON rosters
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- VISITS TABLE (Check-in/Check-out logs)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    roster_id UUID NOT NULL REFERENCES rosters(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    scheduled_time TIME NOT NULL,
    actual_checkin_time TIMESTAMP,                 -- When nurse actually arrived
    actual_checkout_time TIMESTAMP,                -- When nurse left
    checkin_latitude DECIMAL(10, 8),
    checkin_longitude DECIMAL(11, 8),
    checkout_latitude DECIMAL(10, 8),
    checkout_longitude DECIMAL(11, 8),
    checkin_accuracy DECIMAL(5, 2),                -- GPS accuracy in meters
    distance_from_home DECIMAL(5, 2),              -- Haversine distance (km)
    arrival_status VARCHAR(50),                    -- 'on_time', 'early', 'late'
    arrival_minutes_delta INT,                     -- +15 means 15 min late, -5 means 5 min early
    visit_completed BOOLEAN DEFAULT FALSE,
    proof_photos_urls JSON,                        -- Array of S3 URLs
    visit_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON visits
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- CLINICAL NOTES TABLE
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50),                         -- 'post_visit', 'prescription', 'care_plan'
    title VARCHAR(255),
    clinical_observation TEXT,
    vitals JSON,                                   -- {"bp": "120/80", "temp": 98.6, "pulse": 72}
    assessment TEXT,
    plan TEXT,
    medications_prescribed JSON,                   -- [{"name": "Aspirin", "dose": "500mg", "frequency": "BD"}]
    next_visit_recommendation VARCHAR(100),        -- e.g., "in 3 days"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON clinical_notes
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- CARE PLANS TABLE
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    plan_type VARCHAR(100),                        -- 'post_op_wound_care', 'elder_care', 'physio'
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE care_plan_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id),
    task_description VARCHAR(255),                 -- e.g., "Change wound dressing"
    frequency VARCHAR(50),                         -- 'daily', 'alternate_day', 'weekly'
    sequence_order INT,
    is_completed_for_today BOOLEAN DEFAULT FALSE,
    completion_notes TEXT,
    completed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP
);

-- BILLING TABLE
CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE,
    billing_period_start DATE,
    billing_period_end DATE,
    description TEXT,                              -- "10 home care visits" or package name
    quantity INT,
    rate_per_unit DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    final_amount DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid',   -- 'unpaid', 'partial', 'paid', 'overdue'
    payment_date DATE,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON billings
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    billing_id UUID NOT NULL REFERENCES billings(id),
    payment_method VARCHAR(50),                    -- 'razorpay', 'cash', 'check', 'bank_transfer'
    payment_gateway_id VARCHAR(100),               -- Razorpay transaction ID
    amount DECIMAL(10, 2),
    payment_status VARCHAR(50),                    -- 'success', 'failed', 'pending'
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYROLL TABLE
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    payroll_month DATE,                            -- First day of month (e.g., 2026-01-01)
    working_days INT,
    attendance_days INT,
    total_visits INT,
    base_salary DECIMAL(10, 2),
    commission_earned DECIMAL(10, 2),
    bonuses DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    total_payable DECIMAL(10, 2),
    paid_status VARCHAR(50) DEFAULT 'pending',     -- 'pending', 'approved', 'paid'
    payment_date DATE,
    payment_method VARCHAR(50),
    bank_transfer_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP
);
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON payroll
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- AUDIT LOGS TABLE (For compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255),                          -- 'created', 'updated', 'deleted', 'accessed'
    resource_type VARCHAR(100),                    -- 'patient', 'visit', 'billing', etc.
    resource_id UUID,
    old_values JSON,
    new_values JSON,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- INDICES FOR PERFORMANCE
CREATE INDEX idx_patients_tenant_active ON patients(tenant_id, is_active);
CREATE INDEX idx_staff_tenant_availability ON staff(tenant_id, current_availability);
CREATE INDEX idx_rosters_staff_date ON rosters(tenant_id, staff_id, shift_date);
CREATE INDEX idx_visits_staff_date ON visits(tenant_id, staff_id, created_at);
CREATE INDEX idx_billings_patient_status ON billings(tenant_id, patient_id, payment_status);
CREATE INDEX idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
```

---

## PART 3: FRONTEND ARCHITECTURE

### 3.1 WEB FRONTEND (Desktop/Laptop)

**Tech Stack:**
- React 18 + Vite (development speed)
- TypeScript (type safety)
- Tailwind CSS (rapid UI)
- Zustand (state management)
- TanStack Query (API caching)
- React Router v6 (navigation)
- Recharts (dashboard charts)
- react-hot-toast (notifications)

**Directory Structure:**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx        # Agency overview + KPIs
│   │   │   ├── StaffDirectory.tsx   # Manage staff + skills
│   │   │   ├── PatientList.tsx      # All patients, search
│   │   │   ├── RosterCalendar.tsx   # Drag-drop shift scheduling
│   │   │   ├── UserManagement.tsx   # Create users, assign roles
│   │   │   └── Settings.tsx         # Agency config, integrations
│   │   │
│   │   ├── finance/
│   │   │   ├── Dashboard.tsx        # Revenue, collections
│   │   │   ├── Invoices.tsx         # Generate, send, track
│   │   │   ├── Payments.tsx         # Payment reconciliation
│   │   │   ├── Payroll.tsx          # Staff payout calculation
│   │   │   └── Reports.tsx          # Export data
│   │   │
│   │   ├── doctor/
│   │   │   ├── Dashboard.tsx        # My patients for today
│   │   │   ├── PatientDetails.tsx   # Full history + notes
│   │   │   ├── ClinicalNotes.tsx    # Add/edit visit notes
│   │   │   ├── Prescriptions.tsx    # Digital Rx management
│   │   │   └── CarePlans.tsx        # Care templates + tracking
│   │   │
│   │   ├── receptionist/
│   │   │   ├── Dashboard.tsx        # Today's visits + status
│   │   │   ├── BookAppointment.tsx  # Create new visit request
│   │   │   └── PatientComm.tsx      # Send SMS/WhatsApp
│   │   │
│   │   └── auth/
│   │       ├── Login.tsx            # Email + password
│   │       ├── ForgotPassword.tsx
│   │       └── OTPVerify.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx           # Top navigation
│   │   │   ├── Sidebar.tsx          # Left nav by role
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── PatientForm.tsx      # Create/edit patient
│   │   │   ├── StaffForm.tsx        # Add staff + credentials
│   │   │   ├── RosterForm.tsx       # Create shift
│   │   │   ├── BillingForm.tsx      # Create invoice
│   │   │   └── ClinicalForm.tsx     # Add clinical note
│   │   │
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx       # KPI tiles
│   │   │   ├── RevenueChart.tsx     # Recharts graph
│   │   │   ├── StaffUtilization.tsx
│   │   │   └── AttendanceSummary.tsx
│   │   │
│   │   ├── roster/
│   │   │   ├── RosterCalendar.tsx   # Drag-drop calendar
│   │   │   ├── ShiftModal.tsx       # Edit shift details
│   │   │   └── StaffAvailability.tsx
│   │   │
│   │   └── patient/
│   │       ├── PatientCard.tsx
│   │       ├── VisitHistory.tsx
│   │       └── DocumentUpload.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Login, token management
│   │   ├── usePatients.ts           # Patient CRUD
│   │   ├── useRosters.ts            # Shift scheduling
│   │   ├── useVisits.ts             # Visit tracking
│   │   └── useBilling.ts            # Invoice operations
│   │
│   ├── services/
│   │   ├── api.ts                   # Axios config, interceptors
│   │   ├── authService.ts           # Login, refresh token
│   │   ├── patientService.ts
│   │   ├── visitService.ts
│   │   └── billingService.ts
│   │
│   ├── store/
│   │   └── zustand/
│   │       ├── authStore.ts         # Current user, token
│   │       ├── tenantStore.ts       # Agency info
│   │       ├── uiStore.ts           # Sidebar open, theme
│   │       └── notificationStore.ts # Toast messages
│   │
│   ├── types/
│   │   ├── api.ts                   # API response types
│   │   ├── domain.ts                # Patient, Staff, Visit types
│   │   └── ui.ts                    # Component props
│   │
│   ├── utils/
│   │   ├── formatters.ts            # Format currency, date
│   │   ├── validators.ts            # Email, phone validation
│   │   └── constants.ts             # Role enums, status enums
│   │
│   ├── App.tsx                      # Route setup
│   ├── main.tsx                     # Entry point
│   └── index.css
│
└── package.json
```

**Key Pages by Role:**

1. **Admin Dashboard:**
   - KPI cards: Today's revenue, pending collections, staff on duty, patients today
   - Upcoming shifts (next 7 days, color-coded by status)
   - Staff attendance summary (tardiness, absences)
   - Quick actions: Create roster, add patient, generate invoice

2. **Finance Dashboard:**
   - Outstanding receivables (table: patient name, amount, days overdue)
   - Payment collection rate (gauge chart)
   - Staff payroll pending (list: staff name, amount, due date)
   - Monthly revenue trend (line chart)
   - Export to Excel button

3. **Doctor Dashboard:**
   - My patients for today (cards: patient name, visit time, care plan)
   - Clinical notes to review (from field staff)
   - Care plan compliance (% tasks completed)
   - Prescription history (recent Rx)

4. **Receptionist Dashboard:**
   - Today's visits (status: scheduled, in-progress, completed)
   - Appointment requests (new requests to confirm/assign)
   - Patient communication log (SMS/WhatsApp sent)

5. **Roster Calendar (Admin):**
   - Weekly calendar view (staff names on Y-axis, dates on X-axis)
   - Drag-drop to assign staff to shifts
   - Color coding: green (assigned), yellow (pending), red (no-show)
   - Bulk operations: Copy week, import previous roster

6. **Patient Directory (Admin/Doctor):**
   - Searchable table: name, phone, address, last visit, active/inactive
   - Quick actions: view details, schedule visit, send SMS
   - Bulk import (Excel)
   - Export to CSV

---

### 3.2 MOBILE FRONTEND (Field Staff - PWA)

**Tech Stack:**
- React Native + Expo (cross-platform iOS/Android)
- WatermelonDB (offline storage)
- Redux (state management)
- react-native-geolocation (GPS)
- react-native-camera (photo proof)
- react-native-maps (directions)

**Screen Structure:**

```
/mobile/
├── src/
│   ├── screens/
│   │   ├── Login.tsx               # OTP-based login
│   │   ├── Dashboard.tsx           # Today's roster
│   │   ├── RosterList.tsx          # Weekly shifts
│   │   ├── ShiftDetail.tsx         # Patient details + care plan
│   │   ├── CheckIn.tsx             # GPS capture, timestamp
│   │   ├── CareChecklist.tsx       # Tasks to mark complete
│   │   ├── Notes.tsx               # Write visit notes
│   │   ├── PhotoCapture.tsx        # Camera for proof
│   │   ├── CheckOut.tsx            # End visit, confirm time
│   │   ├── Offline.tsx             # Offline status + sync indicator
│   │   └── PersonalPayroll.tsx     # View monthly attendance/pay
│   │
│   ├── components/
│   │   ├── ShiftCard.tsx           # Upcoming shift preview
│   │   ├── CheckInButton.tsx       # Large, accessible button
│   │   ├── TaskCheckbox.tsx        # Care plan task
│   │   ├── GPSMap.tsx              # Show route to patient
│   │   └── SyncStatus.tsx          # Indicator: syncing, synced, error
│   │
│   ├── services/
│   │   ├── watermelonDB.ts         # Offline DB setup
│   │   ├── geolocation.ts          # GPS capture
│   │   ├── sync.ts                 # Data sync logic
│   │   └── api.ts                  # API calls (when online)
│   │
│   ├── models/
│   │   ├── Shift.ts
│   │   ├── Visit.ts
│   │   ├── CheckIn.ts
│   │   └── Task.ts
│   │
│   └── utils/
│       ├── timeFormat.ts
│       ├── location.ts             # Haversine distance calc
│       └── constants.ts
│
└── package.json
```

**Key Screens (Field Staff):**

1. **Login Screen:**
   - Phone number input
   - OTP sent via SMS
   - OTP verification
   - "Keep me logged in" toggle

2. **Daily Dashboard:**
   - "Good Morning, Kavya!" greeting
   - Today's shifts (cards with time, patient name, address)
   - Sync status indicator (green checkmark = all synced)
   - Last sync timestamp

3. **Shift Detail:**
   - Patient name, address, phone
   - Care plan checklist (if assigned doctor)
   - "START VISIT" button (large, prominent)
   - Map showing directions to patient home

4. **Check-In Screen:**
   - "Arrived at patient home?"
   - GPS coordinates + accuracy
   - Timestamp (auto-captured)
   - "Confirm Check-In" button
   - Haptic feedback on successful check-in

5. **Care Checklist:**
   - Task list (e.g., "Check blood pressure", "Change wound dressing", "Do exercises")
   - Swipe to mark complete
   - Add notes per task
   - Photo upload for proof (optional)

6. **Offline Indicator:**
   - Shows when internet is lost
   - "Data will sync when you're back online"
   - Queue of pending uploads visible

7. **Check-Out Screen:**
   - "Completed visit? Click below to check out"
   - Checkout time (auto-captured)
   - Summary of tasks completed
   - Optional feedback ("Everything went well?")
   - "Confirm Check-Out" button

---

### 3.3 RESPONSIVE DESIGN GRID

**Web Breakpoints:**
```
- Desktop:    ≥1200px (Admin dashboards, full tables)
- Tablet:     768px-1199px (Sidebar collapses, table becomes card view)
- Mobile:     <768px (PWA or responsive site)
```

**Mobile-Specific Considerations:**
- Field staff has **low literacy** → Large buttons, icons, minimal text
- **Offline essential** → All critical features work without internet
- **Battery life** → Minimize GPS calls, cache aggressively
- **Slow networks** → Compress images, lazy load components
- **Screen size** → One focused action per screen, no multi-column layouts

---

## PART 4: FEATURES TO ADD/REMOVE

### 4.1 FEATURES TO REMOVE (Cost/Complexity vs Value)

| Feature | Current | Recommendation | Reason |
|---------|---------|-----------------|--------|
| **Generic Telemedicine** | Possible | REMOVE for now | Home care is nurse-delivered; doctor consults are async (notes). Video is phase 2. |
| **Inventory Management** (Equipment) | Mentioned | DEFER to Phase 2 | Only 10% of agencies do rentals. Focus on core first. |
| **Advanced Analytics** (Predictive churn) | Possible | REMOVE for MVP | Nice-to-have; focus on transactional accuracy first. |
| **White-Label Branding** | Possible | REMOVE for MVP | Adds complexity; solo founders shouldn't do this. |
| **Mobile App (Native iOS/Android)** | Expo planned | KEEP BUT SIMPLIFY | Use PWA + Expo. Skip App Store approval delays initially. |
| **Multi-language Support** | Possible | DEFER | English + Hindi later; focus on English-speaking metros first. |

### 4.2 FEATURES TO ADD (Critical for Market Viability)

| Feature | Priority | Effort | Timeline | Rationale |
|---------|----------|--------|----------|-----------|
| **Staff Rostering Engine** | 🔴 CRITICAL | 4 weeks | Q1 2026 | Core differentiator; solves #1 pain point (shift chaos). |
| **GPS Check-In/Check-Out** | 🔴 CRITICAL | 2 weeks | Q1 2026 | Solves attendance disputes; high trust factor for families. |
| **Agency Billing (Invoices)** | 🔴 CRITICAL | 3 weeks | Q1 2026 | Revenue tracking; mandatory for operations. |
| **Staff Payroll Calculation** | 🔴 CRITICAL | 3 weeks | Q1 2026 | Highly valued by agencies; reduces manual month-end chaos. |
| **WhatsApp + SMS Integration** | 🔴 CRITICAL | 2 weeks | Q1 2026 | 80% of Indian healthcare uses WhatsApp; non-negotiable. |
| **Field Staff Mobile App (PWA)** | 🟠 HIGH | 3 weeks | Q1-Q2 2026 | Nurses work in field; web-only won't work. |
| **ABHA Linking** (Non-clinical) | 🟠 HIGH | 2 weeks | Q2 2026 | Government compliance signal; future-proof. |
| **Family Notifications** | 🟠 HIGH | 1 week | Q1-Q2 2026 | Patient engagement; improves retention. |
| **Multi-Tenant Isolation** | 🟠 HIGH | 2 weeks | Q1 2026 | Production requirement; data security. |
| **Audit Logging + Compliance** | 🟠 HIGH | 1 week | Q1 2026 | Healthcare regulation; mandatory for trust. |
| **Payment Gateway** (Razorpay) | 🟡 MEDIUM | 1 week | Q2 2026 | SaaS billing engine; non-optional. |
| **Analytics Dashboard** | 🟡 MEDIUM | 2 weeks | Q2 2026 | Agencies want to see ROI. |
| **Care Plan Templates** | 🟡 MEDIUM | 2 weeks | Q2 2026 | Doctor feature; improves clinical consistency. |
| **Telemedicine** (Video consult) | 🟡 MEDIUM | 4 weeks | Q3 2026 | Nice-to-have differentiator. |
| **ABDM Data Exchange** (M3) | 🟡 MEDIUM | 8 weeks | Q4 2026 | Long-term; deferred until patient base justifies costs. |

**Revised Feature Priority Roadmap:**

```
Q1 2026 (Months 1-3):
✅ Multi-tenant PostgreSQL with RLS
✅ Staff rostering engine (drag-drop calendar)
✅ GPS check-in/check-out tracking
✅ Agency billing (invoice generation)
✅ Staff payroll calculation (salary + commission)
✅ WhatsApp + SMS integration (MSG91)
✅ Field staff PWA app (offline-first with WatermelonDB)
✅ Audit logging + basic compliance
✅ Razorpay payment integration
TARGET: ₹5-10L MRR with 5-10 agency customers

Q2 2026 (Months 4-6):
✅ Family notifications (visit status via WhatsApp)
✅ Analytics dashboard (revenue, staff utilization, churn)
✅ ABHA patient ID linking (non-clinical)
✅ Basic care plan templates
✅ Testimonials + case studies from Q1 customers
✅ Expand to 2-3 new cities (Hyderabad, Mumbai)
TARGET: ₹15-25L MRR with 20-30 agency customers

Q3 2026 (Months 7-9):
✅ Telemedicine feature (third-party video integration)
✅ Equipment rental tracking (optional module)
✅ Advanced analytics (predictions, forecasts)
✅ Regional language support (Hindi, Kannada, Tamil)
TARGET: ₹30-50L MRR with 40-60 agency customers

Q4 2026 (Months 10-12):
✅ ABDM M3 integration (clinical data exchange) - IF revenue justifies
✅ White-label option (optional)
✅ Telemedicine enhancements
TARGET: ₹50-100L MRR (goal is ₹15-20L, so this is stretch)
```

---

## PART 5: DATABASE STRATEGY

### 5.1 Single Database vs Multiple Databases

**Recommendation: SINGLE PostgreSQL Instance with Multi-Tenancy**

**Why single DB for MVP:**
- ✅ Simpler operations (one backup, one maintenance window)
- ✅ Easier debugging (all tenant data in one place)
- ✅ RLS (Row-Level Security) provides strong isolation
- ✅ Cost-effective (no overhead of managing N databases)
- ✅ Sufficient for 100+ paying customers

**When to shard/separate (future):**
- At ~1,000+ paying agencies
- If individual tenant data > 500GB
- If compliance requires data isolation per region
- For now: **Don't do this**

### 5.2 Database Infrastructure

**Option A: AWS RDS PostgreSQL (Recommended for Healthcare)**
```
- Instance: db.t4g.small (2 vCPU, 2GB RAM) → ~$40/month
- Storage: 20GB gp3 → ~$2/month
- Multi-AZ: Yes (for production HA)
- Backup: Daily automated, 30-day retention
- Encryption: AES-256 at rest + TLS in transit
- Region: ap-south-1 (Mumbai) - data localization for India
- Cost at scale: ~$100-150/month
```

**Option B: DigitalOcean Managed PostgreSQL**
```
- Basic: $95/month (1GB RAM, 25GB SSD, 3-node cluster)
- Backup: Automated daily
- Encryption: TLS mandatory
- Region: Bangalore or Singapore
- Cost: Lower upfront, good for small teams
```

**Recommendation: AWS RDS (healthcare compliance edge, better monitoring)**

### 5.3 Caching Layer

**Redis (for performance):**
```
- Use: Session tokens, rate limiting, visit sync queue
- AWS ElastiCache: 2GB cache.t4g.small → ~$30/month
- Alternative: DigitalOcean Redis → $15/month
- TTL: Session tokens (8 hours), roster data (1 hour), patient search (5 min)
```

---

## PART 6: DEPLOYMENT & OPERATIONS

### 6.1 Deployment Architecture

```
GitHub Repository
    ↓
    └─→ GitHub Actions (CI/CD)
         ├─ Run tests
         ├─ Build Docker images
         └─ Push to ECR
             ↓
         AWS ECS (Fargate)
         ├─ 2x FastAPI containers (2 vCPU, 4GB RAM each) → ~$100/month
         └─ Auto-scale based on CPU
             ↓
         Load Balancer (ALB)
         └─ Route to healthy containers
             ↓
         CloudFront (CDN)
         └─ Cache static assets
             ↓
         ┌────────────────┬─────────────┬─────────────┐
         ↓                ↓             ↓             ↓
      RDS PG          ElastiCache     S3 (Docs)   SES (Email)
      Mumbai          Mumbai          + CloudFront MSG91 (SMS)
                                                  Razorpay (Payments)
```

### 6.2 Estimated Monthly Infrastructure Costs

```
ECS Fargate:           $100-150   (compute)
RDS PostgreSQL:        $50-80     (database)
ElastiCache Redis:     $30-50     (cache)
S3 + CloudFront:       $20-50     (storage + CDN)
ALB:                   $20        (load balancer)
SMS (MSG91):           $300-500   (based on volume)
Email (SES):           $5-10      (low volume)
Monitoring (CloudWatch): $10-20
────────────────────────────────
TOTAL:                 ~$500-800/month at scale

For ₹20L MRR (₹20,000/month revenue):
- If 10 agencies @ ₹2k each
- Gross margin: ~70% (SaaS typical)
- Gross profit: ₹14k
- After infra: ₹13.2k net
- This is sustainable on a side project!
```

---

## PART 7: EXECUTION PLAN (90 DAYS)

### **Days 1-15: Foundation (Backend Infrastructure)**
- [ ] Set up AWS account, VPC, security groups
- [ ] Provision RDS PostgreSQL + ElastiCache Redis
- [ ] Create git repository structure (if not done)
- [ ] Implement multi-tenant RLS policies in PostgreSQL
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Deploy FastAPI skeleton to ECS

### **Days 16-30: Core Features (MVP)**
- [ ] Implement tenant isolation middleware
- [ ] Build staff directory (CRUD)
- [ ] Build roster scheduling engine (drag-drop calendar backend)
- [ ] Build GPS check-in/out endpoints
- [ ] Set up Razorpay subscription integration
- [ ] Implement JWT auth with refresh tokens

### **Days 31-45: Field Staff & Notifications**
- [ ] Build PWA mobile app (Expo) skeleton
- [ ] Implement offline sync (WatermelonDB)
- [ ] Integrate MSG91 SMS + WhatsApp Business API
- [ ] Build field staff check-in screen (mobile)
- [ ] Build agency billing invoice generator
- [ ] Implement audit logging

### **Days 46-60: Admin Dashboard**
- [ ] Build admin roster calendar (web frontend)
- [ ] Build admin dashboard (KPIs, metrics)
- [ ] Build staff payroll calculator
- [ ] Build finance dashboard (invoices, collections)
- [ ] Implement role-based access control (RBAC)
- [ ] Create admin user management

### **Days 61-75: Testing & Polish**
- [ ] End-to-end testing (all workflows)
- [ ] Load testing (500 concurrent users)
- [ ] Security hardening (OWASP Top 10)
- [ ] Data encryption at rest (sensitive fields)
- [ ] Documentation (API, deployment, user guides)
- [ ] Error handling and monitoring (Sentry)

### **Days 76-90: Launch & Outreach**
- [ ] Beta launch to 3-5 nursing bureaus (Bengaluru)
- [ ] Collect testimonials and iterate
- [ ] Set up WhatsApp outreach template
- [ ] Prepare cold outreach list (500 agencies in BLR)
- [ ] Launch landing page / waitlist
- [ ] Plan Q2 roadmap

---

## CONCLUSION

**HealLog is positioned to capture a real, underserved niche in India's home care market.**

**Key Success Factors:**
1. **Focus on Nursing Bureaus, not doctors** - Avoids competing with VC-backed Practo/Lybrate
2. **Operate as "Operations OS," not clinical EMR** - Defers ABDM compliance burden, enables faster launch
3. **Prioritize field staff workflows** - GPS, offline sync, WhatsApp are your moats
4. **Keep infrastructure lean** - $500-800/month is sustainable on bootstrapped economics
5. **Target ₹15-20L MRR via 10-15 customers** - Micro-market focus = achievable in 12-18 months

**Target: ₹15-20L MRR (₹15-20k annual ARR) in 12-18 months with 10-15 paying agency customers.**

---

