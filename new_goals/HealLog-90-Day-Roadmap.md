# HealLog: 90-Day Architecture Migration Roadmap

**Document:** HealLog Infrastructure Upgrade Plan  
**Version:** 1.0  
**Date:** January 25, 2026  
**Prepared For:** Harish NG (Founder, Data Engineer)  
**Target:** Upgrade from current monolithic/basic setup → Multi-tenant SaaS with offline-first field staff  
**Timeline:** 90 Days (13 weeks)  
**Goal:** Achieve ₹15-20L MRR foundation with 5-10 pilot customers by end of Q1 2026

---

## EXECUTIVE SUMMARY

Your current HealLog system works for single clinics. The upgrade transforms it into:
- **Multi-tenant operations platform** (support 100+ agencies simultaneously)
- **Field staff-centric** (offline PWA, GPS tracking, attendance proof)
- **Revenue engine** (billing, payroll, WhatsApp reminders, analytics)

**You will do this in 4 phases across 90 days, working solo ~40-50 hours/week.**

| Phase | Focus | Duration | Output | Customers |
|-------|-------|----------|--------|-----------|
| **Phase 1** | Foundation | Days 1-20 | Multi-tenant DB, auth, infra | 0 (Beta) |
| **Phase 2** | Core Features | Days 21-50 | Rosters, billing, payroll, SMS | 3-5 (Closed Beta) |
| **Phase 3** | Field Operations | Days 51-75 | Mobile PWA, offline sync, GPS | 8-10 (Open Beta) |
| **Phase 4** | Polish & Launch | Days 76-90 | Testing, docs, outreach, support | 10-15 (Launch) |

**Estimated outcome:** ₹5-10L MRR (foundation), ₹15-20L MRR (target by month 6)

---

## PHASE 1: FOUNDATION (Days 1-20) - Build the Skeleton

### Goal
Set up production-grade infrastructure, multi-tenant isolation, and authentication. **Zero customer features yet—this is plumbing.**

### Prerequisites (Complete Before Starting)
- [ ] AWS account created (or DigitalOcean)
- [ ] GitHub repo ready (version control)
- [ ] Local PostgreSQL installed (for dev)
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed

### Week 1: Infrastructure & Database (Days 1-7)

#### 1.1 AWS Setup (2-3 hours)
- [ ] Create AWS account, set billing alerts
- [ ] Create VPC with public/private subnets (ap-south-1 Mumbai region)
- [ ] Create security groups (RDS, ECS, ALB)
- [ ] Generate IAM keys for CI/CD

**Deliverable:** AWS infrastructure ready, security groups configured

#### 1.2 PostgreSQL RDS Setup (2-3 hours)
- [ ] Launch RDS PostgreSQL (db.t4g.small, 20GB gp3)
- [ ] Enable encryption at rest (AWS KMS)
- [ ] Set backup retention (30 days)
- [ ] Create multi-AZ standby (for HA)
- [ ] Install local PostgreSQL client tools
- [ ] Create initial database schema (from spec)

**Deliverable:** RDS instance running, connection verified from local machine

#### 1.3 Redis Setup (1 hour)
- [ ] Launch ElastiCache Redis (cache.t4g.small, 2GB)
- [ ] Configure security group for ECS access
- [ ] Test connection from local machine
- [ ] Document connection strings

**Deliverable:** Redis cluster ready for session/cache storage

#### 1.4 GitHub & CI/CD Setup (2-3 hours)
- [ ] Create GitHub repository (if not exists)
- [ ] Set up GitHub Actions workflow file (.github/workflows/deploy.yml)
- [ ] Create secrets in GitHub (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
- [ ] Test workflow with dummy build

**Deliverable:** GitHub repo + CI/CD pipeline configured (not deploying yet)

**Time Estimate:** 7-10 hours  
**Status Checklist:**
- [ ] AWS VPC + security groups ready
- [ ] RDS PostgreSQL accessible from local machine
- [ ] Redis cluster operational
- [ ] GitHub CI/CD pipeline created (not activated)

---

### Week 2: Backend Foundation (Days 8-14)

#### 2.1 FastAPI Skeleton with Multi-Tenancy (3-4 hours)
**Create:** `backend/main.py`

**Key Components:**
```
# core/config.py
- Database URL (RDS)
- Redis URL (ElastiCache)
- JWT secret
- CORS settings
- SMS/Email/Payment provider keys (placeholders)

# core/security.py
- Password hashing (bcrypt)
- JWT generation/verification
- OTP generation (6-digit numeric)

# middleware/tenant_context.py
- Extract tenant_id from JWT
- Set PostgreSQL session variable (for RLS)
- Validate tenant subscription status

# dependencies.py
- Database session factory
- Current user injection
- Tenant context injection
```

**Test:** Can start server, middleware sets tenant context correctly

#### 2.2 Database Schema (Row-Level Security) (3-4 hours)
**Create:** `backend/db/migrations/001_initial_schema.sql`

**Implement PostgreSQL RLS:**
```sql
-- For each multi-tenant table (patients, staff, rosters, visits, etc.):
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON table_name
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Test:**
- [ ] Connect to RDS from backend
- [ ] Run migration script successfully
- [ ] Verify RLS policies created for all tables
- [ ] Test: User from Tenant A cannot query Tenant B data

**Deliverable:** Database schema with RLS enabled on all tables

#### 2.3 Authentication Endpoints (2-3 hours)
**Implement:** `api/v1/endpoints/auth.py`

```
POST /v1/auth/register              # Tenant signup (agency owner)
POST /v1/auth/login                 # Email + password login
POST /v1/auth/verify-otp            # OTP verification (optional for v1)
POST /v1/auth/refresh-token         # Refresh JWT
GET  /v1/auth/me                    # Get current user
```

**Database Tables to Create:**
- `tenants` (agencies)
- `users` (staff, doctors, admin)
- `roles` (enum: admin, finance, doctor, receptionist, nurse)

**Test:**
- [ ] Can register new tenant (agency)
- [ ] Can login as agency owner
- [ ] JWT token issued and can be refreshed
- [ ] Token includes tenant_id (verified in RLS)

#### 2.4 User Management Endpoints (2 hours)
**Implement:** `api/v1/endpoints/users.py`

```
POST /v1/users                  # Admin creates user
GET  /v1/users                  # List all users in agency
GET  /v1/users/{user_id}        # Get user details
PUT  /v1/users/{user_id}        # Update user
DELETE /v1/users/{user_id}      # Disable user
```

**Test:**
- [ ] Admin can create users with different roles
- [ ] Non-admin cannot create users
- [ ] Soft-delete works (is_active = false)

#### 2.5 Tenant Isolation Enforcement (1-2 hours)
**Implement:** `middleware/tenant_context.py`

**Test:**
- [ ] User from Tenant A tries to access User B's data → 403 Forbidden
- [ ] RLS prevents data leakage at database level
- [ ] Audit log captures all access attempts

**Deliverable:** All authentication + tenant isolation working end-to-end

**Time Estimate:** 11-15 hours  
**Status Checklist:**
- [ ] FastAPI app starts, middleware applies tenant context
- [ ] Database schema migrated with RLS policies
- [ ] Auth endpoints (register, login, token refresh) working
- [ ] User management endpoints working (CRUD)
- [ ] Multi-tenant isolation verified (cannot query other tenant's data)
- [ ] Audit logs capture data access

---

### Week 3: API Infrastructure (Days 15-20)

#### 3.1 Patient Management Endpoints (3-4 hours)
**Implement:** `api/v1/endpoints/patients.py`

```
POST /v1/patients                   # Create patient
GET  /v1/patients                   # List patients (paginated, searchable)
GET  /v1/patients/{patient_id}      # Get patient details
PUT  /v1/patients/{patient_id}      # Update patient
DELETE /v1/patients/{patient_id}    # Soft-delete patient
GET  /v1/patients/search            # Advanced search
```

**Features:**
- [ ] Phone number encryption (at-rest)
- [ ] Full-text search on name/phone
- [ ] Pagination (default: 20 per page)
- [ ] Filtering (active/inactive, by city)

**Test:**
- [ ] Create patient, retrieve it
- [ ] Search returns correct results
- [ ] Another tenant cannot see this patient

#### 3.2 Staff Directory Endpoints (3-4 hours)
**Implement:** `api/v1/endpoints/staff.py`

```
POST /v1/staff                      # Add staff to agency
GET  /v1/staff                      # List all staff (with availability)
GET  /v1/staff/{staff_id}           # Get staff profile
PUT  /v1/staff/{staff_id}           # Update staff info
PUT  /v1/staff/{staff_id}/skills    # Update skill matrix
PUT  /v1/staff/{staff_id}/availability # Mark status (on-duty, on-leave, off-duty)
```

**Database Fields:**
- Qualification (GNM, BSc, Ayah)
- Specializations (comma-separated: wound care, physio, elder care)
- Skills verified (boolean)
- Base salary (fixed component)
- Commission percentage (variable component)
- Current availability (enum)

**Test:**
- [ ] Create nurse with credentials
- [ ] Update availability status
- [ ] Search available nurses for a date
- [ ] Cannot see other tenant's staff

#### 3.3 Error Handling & Logging (2-3 hours)
**Implement:** `middleware/error_handler.py`, `utils/logging.py`

```
# Global exception handler
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions / tenant mismatch)
- 404: Not Found
- 500: Internal Server Error (log to Sentry)

# Structured logging
- Request ID for tracing
- User ID, tenant ID, resource accessed
- Response time, status code
- All errors logged to CloudWatch
```

**Test:**
- [ ] Invalid input returns 400 with clear error message
- [ ] Missing token returns 401
- [ ] Wrong tenant data returns 403
- [ ] Errors logged to CloudWatch

#### 3.4 Deployment to ECS (2-3 hours)
**Implement:**
- [ ] Docker file (`backend/Dockerfile`)
- [ ] GitHub Actions workflow to build & push to ECR
- [ ] ECS task definition (2 vCPU, 4GB RAM)
- [ ] Application Load Balancer (ALB) routing

**Test:**
- [ ] Push code to GitHub → GitHub Actions builds image
- [ ] Image pushed to ECR
- [ ] ECS pulls latest image, starts container
- [ ] Can hit `/health` endpoint from ALB DNS

**Deliverable:** Backend running on ECS, accessible via ALB

**Time Estimate:** 10-14 hours  
**Status Checklist:**
- [ ] Patient management endpoints (CRUD) working
- [ ] Staff directory endpoints (CRUD) working
- [ ] Error handling centralized + logged to CloudWatch
- [ ] FastAPI app containerized + deployed to ECS
- [ ] ALB routes requests to ECS containers
- [ ] Database, Redis, ECS all connected

---

### Phase 1 Summary

**What You've Built:**
- ✅ Multi-tenant infrastructure (PostgreSQL RLS, Redis cache)
- ✅ Authentication + user management
- ✅ Patient directory API
- ✅ Staff directory API
- ✅ Error handling + logging
- ✅ Deployed to AWS ECS

**What You Haven't Built Yet:**
- ❌ Field staff app (PWA)
- ❌ Admin web dashboard
- ❌ Roster scheduling
- ❌ Visit tracking (GPS)
- ❌ Billing + invoicing
- ❌ Payroll calculation
- ❌ SMS/WhatsApp integration

**Estimated Time:** 20 days (160-180 hours if you're coding 8-10 hours/day)  
**Status:** Backend infrastructure ready to accept customer requests

---

## PHASE 2: CORE FEATURES (Days 21-50) - Build Revenue-Generating Features

### Goal
Implement the **three core pain points** agencies want solved:
1. **Rostering** (who works where when?)
2. **Billing** (how much did this agency earn?)
3. **Payroll** (how much does each nurse get paid?)

These three features = **MVP for closed beta launch**.

### Week 4-5: Roster Scheduling Engine (Days 21-30)

#### 4.1 Roster Data Model (1-2 hours)
**Update:** `db/models.py` with complete `rosters` table

```python
class Roster(Base):
    __tablename__ = "rosters"
    
    id: UUID
    tenant_id: UUID (for RLS)
    staff_id: UUID (nurse assigned)
    patient_id: UUID (patient being visited)
    shift_type: str  # '12_hour', '24_hour', 'day', 'night'
    shift_start: time  # 09:00
    shift_end: time    # 21:00
    shift_date: date   # 2026-01-25
    days_of_week: str  # 'Mon,Tue,Wed' for recurring
    recurrence_end_date: date  # 2026-02-25 (when recurring ends)
    assigned_by: UUID (admin user)
    status: str  # 'scheduled', 'completed', 'cancelled', 'no_show'
    notes: str
    created_at, updated_at
```

#### 4.2 Roster Management Endpoints (4-5 hours)
**Implement:** `api/v1/endpoints/rosters.py`

```
POST /v1/rosters                               # Create single or recurring shift
GET  /v1/rosters                               # List rosters (filters: date, staff, status)
GET  /v1/rosters/{roster_id}                   # Get roster details
PUT  /v1/rosters/{roster_id}                   # Update roster (time, staff, patient)
DELETE /v1/rosters/{roster_id}                 # Cancel roster (soft-delete)
GET  /v1/rosters/calendar/{date}               # Get all shifts for a date
GET  /v1/rosters/{staff_id}/schedule           # Get personal schedule
POST /v1/rosters/{roster_id}/bulk-create       # Create recurring rosters
```

**Key Logic:**
- Recurring roster expansion (Mon-Wed for 4 weeks → 12 rosters created)
- Conflict detection (prevent double-booking same staff same time)
- Availability checking (don't assign if staff on-leave)
- SMS notification to staff when assigned

#### 4.3 Backend Calendar View Optimization (2 hours)
**Implement:** `services/roster_service.py`

```python
def get_calendar_view(tenant_id, start_date, end_date):
    """
    Returns rosters organized by:
    - Staff (rows)
    - Date (columns)
    - Status color coding (green=assigned, yellow=pending, red=no-show)
    
    Used by frontend for drag-drop calendar UI
    """
```

**Database Query Optimization:**
- [ ] Index on (tenant_id, staff_id, shift_date)
- [ ] Cache calendar view for 1 hour (Redis)
- [ ] Pagination if >1,000 rosters/month

#### 4.4 Staff Availability Check (1-2 hours)
**Implement:** `services/staff_service.py`

```python
def get_available_staff(tenant_id, date, time_range):
    """
    Returns list of nurses available at time_range on date
    - Excludes: on_leave, off_duty
    - Excludes: already assigned to another shift at same time
    - Returns: sorted by experience, specialization match
    """
```

**Test:**
- [ ] Create 3 rosters for same staff same date → conflict detected
- [ ] Get available staff for date/time → returns only free nurses
- [ ] Can bulk-create recurring rosters (7 weeks Mon-Wed)
- [ ] Cancel roster → SMS sent to staff

**Deliverable:** Roster scheduling fully functional

**Time Estimate:** 8-11 hours  
**Status Checklist:**
- [ ] Roster CRUD endpoints working
- [ ] Recurring roster expansion working
- [ ] Conflict detection prevents double-booking
- [ ] Availability API shows free nurses
- [ ] Calendar API returns rosters by staff/date

---

### Week 5-6: Billing & Revenue Tracking (Days 31-40)

#### 5.1 Billing Data Model (1-2 hours)
**Update:** `db/models.py` with `billings` + `payments` tables

```python
class Billing(Base):
    invoice_number: str (unique, e.g., "BL-001-2026-01-25")
    invoice_date: date
    billing_period: (start_date, end_date)
    patient_id: UUID
    description: str  # "10 home care visits"
    quantity: int
    rate_per_unit: decimal
    total_amount: decimal
    tax_amount: decimal
    discount_amount: decimal
    final_amount: decimal
    payment_status: str  # 'unpaid', 'partial', 'paid', 'overdue'
    payment_date: date
    amount_paid: decimal
    notes: str

class Payment(Base):
    billing_id: UUID
    payment_method: str  # 'razorpay', 'cash', 'check'
    payment_gateway_id: str  # Razorpay transaction ID
    amount: decimal
    payment_status: str
    payment_date: timestamp
```

#### 5.2 Invoice Generation from Rosters (3-4 hours)
**Implement:** `services/billing_service.py`

```python
def generate_invoice_from_attendance(tenant_id, patient_id, start_date, end_date):
    """
    1. Query completed rosters for patient in date range
    2. Count visits, sum duration
    3. Apply rate per visit or package pricing
    4. Calculate tax (18% GST, if applicable)
    5. Create billing record
    6. Return invoice details
    """
```

**Business Logic:**
- Per-visit pricing: ₹500/visit × 10 visits = ₹5,000
- Package pricing: 12 visits/month = ₹5,000 flat (discount)
- Discounts & adjustments (e.g., family negotiated rate)
- Tax calculation (GST 18% if registered)

#### 5.3 Billing Endpoints (3-4 hours)
**Implement:** `api/v1/endpoints/billing.py`

```
POST /v1/billing/invoices                      # Generate invoice
GET  /v1/billing/invoices                      # List all invoices
GET  /v1/billing/invoices/{invoice_id}         # Get invoice details
PUT  /v1/billing/invoices/{invoice_id}         # Update status (mark as sent/paid)
GET  /v1/billing/outstanding                   # Get outstanding dues (family-wise)
POST /v1/billing/payment-link                  # Create Razorpay payment link
GET  /v1/billing/reconciliation                # Reconcile payments from gateway
```

**Invoice Status Flow:**
- Draft → Sent (email/SMS to family) → Partial/Paid → Overdue (if unpaid >30 days)

#### 5.4 Razorpay Integration (2-3 hours)
**Implement:** `services/payment_service.py`

```python
def create_payment_link(invoice_id, amount, family_phone):
    """
    1. Create Razorpay payment link
    2. Send WhatsApp to family with link
    3. Store payment_gateway_id
    4. Return link for email
    """

def reconcile_payments(webhook_payload):
    """
    Razorpay webhook: payment_authorized
    1. Verify webhook signature
    2. Find billing record
    3. Update payment_status = 'paid'
    4. Update outstanding receivables
    """
```

**Webhook Setup:**
- [ ] Add Razorpay API keys to GitHub secrets
- [ ] Implement `/webhooks/razorpay` endpoint (without auth)
- [ ] Verify webhook signature

**Test:**
- [ ] Generate invoice from 10 completed visits
- [ ] Create payment link, test Razorpay flow
- [ ] Mark payment as received
- [ ] Query outstanding dues

**Deliverable:** Complete billing pipeline from visits → invoices → payments

**Time Estimate:** 9-13 hours  
**Status Checklist:**
- [ ] Invoice generated from attendance automatically
- [ ] Invoice endpoint returns correctly formatted invoices
- [ ] Razorpay payment link created + payment received
- [ ] Webhook reconciles payments (updates status)
- [ ] Outstanding receivables calculated correctly

---

### Week 7: Staff Payroll Calculation (Days 41-50)

#### 6.1 Payroll Data Model (1 hour)
**Update:** `db/models.py` with `payroll` table

```python
class Payroll(Base):
    staff_id: UUID
    payroll_month: date  # 2026-01-01 (first of month)
    working_days: int
    attendance_days: int
    total_visits: int
    base_salary: decimal
    commission_earned: decimal  # (visits × ₹100/visit) or %age
    bonuses: decimal
    deductions: decimal  # absent >3 days = -₹500
    total_payable: decimal
    paid_status: str  # 'pending', 'approved', 'paid'
    payment_date: date
    payment_method: str
    bank_transfer_id: str (for bank transfer tracking)
    notes: str
    approved_by: UUID (admin)
    approved_at: timestamp
```

#### 6.2 Payroll Calculation Engine (4-5 hours)
**Implement:** `services/payroll_service.py`

```python
def calculate_monthly_payroll(tenant_id, staff_id, payroll_month):
    """
    Calculation formula:
    1. Base salary (fixed, e.g., ₹15,000/month)
    2. Commission = visits_completed × ₹100 per visit
    3. Bonus: if >95% attendance, add ₹1,000
    4. Deductions: if absent >3 days, deduct ₹500/day
    5. Total payable = base + commission + bonus - deductions
    
    Returns: payroll object ready for approval
    """
    
    # Query completed visits this month for staff
    visits = db.query(Visits).filter(
        staff_id == staff_id,
        month(created_at) == payroll_month.month,
        year(created_at) == payroll_month.year,
        status == 'completed'
    ).count()
    
    # Query attendance this month
    attendance_days = db.query(Rosters).filter(
        staff_id == staff_id,
        month(shift_date) == payroll_month.month,
        status in ['completed', 'no_show']
    ).count()
    
    # Calculate components
    base_salary = staff.base_salary
    commission = visits * 100
    attendance_pct = attendance_days / 30  # rough estimate
    bonus = 1000 if attendance_pct > 0.95 else 0
    deductions = (30 - attendance_days) * 500 if (30 - attendance_days) > 3 else 0
    total_payable = base_salary + commission + bonus - deductions
    
    # Create payroll record
    payroll = Payroll(
        staff_id=staff_id,
        payroll_month=payroll_month,
        attendance_days=attendance_days,
        total_visits=visits,
        base_salary=base_salary,
        commission_earned=commission,
        bonuses=bonus,
        deductions=deductions,
        total_payable=total_payable,
        paid_status='pending'
    )
    return payroll
```

#### 6.3 Payroll Endpoints (2-3 hours)
**Implement:** `api/v1/endpoints/payroll.py`

```
GET  /v1/payroll/{staff_id}/monthly             # Calculate monthly payroll
GET  /v1/payroll/report                         # Payroll report (all staff)
PUT  /v1/payroll/{staff_id}/approve             # Approve payout
POST /v1/payroll/generate-slips                 # Generate salary slips (PDF)
GET  /v1/payroll/pending                        # List staff awaiting payout
```

#### 6.4 Payroll Approval Workflow (2 hours)
**Implement:** `services/payroll_service.py`

```python
def approve_payroll(tenant_id, staff_id, payroll_month, approver_id):
    """
    1. Check payroll exists
    2. Verify approver is admin/finance
    3. Mark as 'approved'
    4. Prepare for bank transfer or cash payout
    """

def process_payout(payroll_id, payment_method, bank_transfer_id=None):
    """
    1. Update payroll status = 'paid'
    2. Store bank_transfer_id (if bank transfer)
    3. Send SMS to staff: "Your salary ₹X has been credited"
    4. Log in audit trail
    """
```

**Test:**
- [ ] Calculate payroll for staff (visits + attendance + bonus - deductions)
- [ ] Generate payroll report for all staff
- [ ] Approve and mark as paid
- [ ] SMS sent to staff confirming payment

**Deliverable:** Complete payroll calculation & approval workflow

**Time Estimate:** 9-11 hours  
**Status Checklist:**
- [ ] Payroll calculated from visit + attendance data
- [ ] Payroll report shows all staff pending/approved/paid
- [ ] Admin can approve and process payout
- [ ] SMS sent to staff confirming salary

---

### Phase 2 Summary

**What You've Built:**
- ✅ Roster scheduling (CRUD + recurring)
- ✅ Billing from attendance (invoice generation)
- ✅ Razorpay payment integration
- ✅ Staff payroll calculation + approval workflow
- ✅ SMS notifications to staff (when rosters assigned, when salary paid)

**What You Haven't Built Yet:**
- ❌ Web dashboard (admin, finance, doctor views)
- ❌ Field staff mobile app (check-in/check-out, offline)
- ❌ GPS tracking (attendance verification)
- ❌ WhatsApp family notifications
- ❌ Analytics (revenue, utilization, churn)

**Estimated Time:** 30 days (240-280 hours)  
**Status:** MVP ready for closed beta (3-5 pilot customers)

**Go-to-Market Step:**
- Deploy to production ECS
- Invite 3-5 nursing bureaus in Bengaluru for closed beta
- Collect feedback on roster + billing accuracy
- Prepare for Phase 3 (field operations)

---

## PHASE 3: FIELD OPERATIONS (Days 51-75) - Field Staff & Offline

### Goal
Empower field staff (nurses) with **mobile app** that works offline, with **GPS check-in/check-out** and **proof of visit**.

### Week 8-9: Mobile PWA Foundation (Days 51-65)

#### 7.1 Expo/React Native Skeleton (2-3 hours)
**Create:** `mobile/` directory with Expo setup

```bash
expo init heallog-mobile
cd heallog-mobile
npm install expo-router expo-offline-first watermelon
```

**Screens to Create:**
1. Login (OTP)
2. Today's Roster
3. Shift Details
4. Check-In (GPS)
5. Care Checklist
6. Notes + Photos
7. Check-Out
8. Offline Status Indicator
9. Personal Timesheet

#### 7.2 WatermelonDB Offline Database (3-4 hours)
**Implement:** `mobile/src/services/watermelonDB.ts`

**Setup:**
```typescript
import { Database } from '@nozbe/watermelondb';
import { Roster, Visit, Task, CheckIn } from './models';

const database = new Database({
  adapter: new SQLiteAdapter({
    dbName: 'HealLog.db',
    schema: appSchema({
      version: 1,
      tables: [
        tableSchema({
          name: 'rosters',
          columns: [
            { name: 'patient_id', type: 'string' },
            { name: 'shift_date', type: 'number' },
            { name: 'shift_start', type: 'string' },
            // ... all roster fields
          ],
        }),
        tableSchema({
          name: 'visits',
          columns: [
            { name: 'roster_id', type: 'string' },
            { name: 'checkin_time', type: 'number', isOptional: true },
            // ... all visit fields
          ],
        }),
      ],
    }),
  }),
});
```

**Sync Strategy:**
- On app launch: sync rosters for next 7 days
- After check-in/check-out: queue for sync
- On WiFi/4G: send queued data to backend
- Conflict resolution: backend timestamp wins

#### 7.3 GPS Check-In/Check-Out (4-5 hours)
**Implement:** `mobile/src/screens/CheckIn.tsx`

```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export default function CheckInScreen({ shiftId }) {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  
  const handleCheckIn = async () => {
    // 1. Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    
    // 2. Get current location
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    setLocation(currentLocation.coords);
    setAccuracy(currentLocation.coords.accuracy);
    
    // 3. Create visit record in WatermelonDB
    const visit = await database.collections.get('visits').create((visit) => {
      visit.roster_id = shiftId;
      visit.checkin_latitude = currentLocation.coords.latitude;
      visit.checkin_longitude = currentLocation.coords.longitude;
      visit.checkin_time = Date.now();
      visit.checkin_accuracy = currentLocation.coords.accuracy;
      visit.synced = false;  // Mark for sync
    });
    
    // 4. Show success + distance to patient home
    const distanceKm = haversineDistance(
      currentLocation.coords,
      { lat: roster.patient_home_lat, lng: roster.patient_home_lng }
    );
    
    showToast(`Checked in! ${distanceKm.toFixed(2)} km from patient home`);
  };
  
  return (
    <View>
      <Text>Arrived at {roster.patient_name}'s home?</Text>
      <Text>GPS Accuracy: {accuracy?.toFixed(0)} meters</Text>
      <Button onPress={handleCheckIn} title="Confirm Check-In" />
    </View>
  );
}
```

**Key Features:**
- GPS accuracy display (accuracy < 50m = good)
- Distance calculation (haversine formula)
- Timestamp auto-capture
- Offline storage (visit queued for sync)

#### 7.4 Care Checklist Screen (3-4 hours)
**Implement:** `mobile/src/screens/CareChecklist.tsx`

```typescript
export default function CareChecklistScreen({ shiftId }) {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    // Load care plan tasks for this shift
    const rosters = await database.collections.get('rosters').find(shiftId);
    const carePlan = rosters.care_plan;  // from sync
    setTasks(carePlan.tasks);
  }, [shiftId]);
  
  const handleTaskComplete = async (taskId) => {
    // 1. Mark task as complete locally
    await database.collections.get('tasks').find(taskId).update((task) => {
      task.is_completed = true;
      task.completed_at = Date.now();
    });
    
    // 2. Show checkmark, haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // 3. Queue for sync
    markForSync(taskId);
  };
  
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleTaskComplete(item.id)}
          style={{ opacity: item.is_completed ? 0.5 : 1 }}
        >
          <Checkbox checked={item.is_completed} />
          <Text>{item.description}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

#### 7.5 Offline Sync Engine (3-4 hours)
**Implement:** `mobile/src/services/sync.ts`

```typescript
export async function syncWithBackend() {
  // 1. Check internet connectivity
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    showStatus('Offline - data will sync when connected');
    return;
  }
  
  // 2. Get all records marked synced=false
  const unsynced = await database.collections
    .get('visits')
    .query(where('synced', eq(false)))
    .fetch();
  
  // 3. POST to backend
  const visits = unsynced.map(v => ({
    roster_id: v.roster_id,
    checkin_time: v.checkin_time,
    checkin_latitude: v.checkin_latitude,
    checkin_longitude: v.checkin_longitude,
    checkin_accuracy: v.checkin_accuracy,
  }));
  
  try {
    const response = await fetch(`${API_URL}/v1/visits/batch-sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ visits }),
    });
    
    if (response.ok) {
      // 4. Mark all as synced
      for (const visit of unsynced) {
        await visit.update((v) => {
          v.synced = true;
        });
      }
      showStatus('Synced successfully');
    }
  } catch (error) {
    showStatus('Sync failed - will retry');
  }
}

// Setup periodic sync (every 5 minutes when online)
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  await syncWithBackend();
  return BackgroundFetch.Result.NewData;
});

BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
  minimumInterval: 5 * 60,  // 5 minutes
  stopOnTerminate: false,
  startOnBoot: true,
});
```

**Test:**
- [ ] Go offline, check-in → data stored locally
- [ ] Go online → data auto-syncs to backend
- [ ] Offline check-out → synced when online
- [ ] Care tasks marked complete → synced

**Deliverable:** Field staff PWA fully functional (offline + sync)

**Time Estimate:** 15-20 hours  
**Status Checklist:**
- [ ] Expo app boots, shows today's roster
- [ ] Check-in captures GPS + timestamp
- [ ] Care checklist tasks display + can mark complete
- [ ] Photos can be uploaded (queued for sync)
- [ ] Offline status indicator shown
- [ ] Background sync runs when online

---

### Week 10: GPS Tracking & Visit Verification (Days 66-75)

#### 8.1 GPS Distance Validation (2 hours)
**Implement:** `mobile/src/utils/location.ts`

```typescript
export function haversineDistance(point1, point2) {
  // Haversine formula for Earth surface distance
  const R = 6371; // Earth radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function validateCheckInLocation(checkinLat, checkinLng, patientLat, patientLng) {
  const distance = haversineDistance(
    { lat: checkinLat, lng: checkinLng },
    { lat: patientLat, lng: patientLng }
  );
  
  if (distance > 0.5) {
    // More than 500m away
    return { valid: false, reason: `${distance.toFixed(2)}km away from patient home` };
  }
  
  return { valid: true, distance: distance.toFixed(3) };
}
```

**Backend Validation:**
- [ ] API endpoint validates check-in GPS against patient home location
- [ ] If >500m away, flag for review (but allow for now)
- [ ] Log distance_from_home in visits table
- [ ] Admin dashboard shows staff with multiple "far" check-ins

#### 8.2 Photo Proof Upload (2-3 hours)
**Implement:** `mobile/src/screens/PhotoCapture.tsx`

```typescript
import { Camera } from 'expo-camera';

export default function PhotoCaptureScreen({ visitId }) {
  const [photos, setPhotos] = useState([]);
  
  const handleCapture = async (uri) => {
    // 1. Compress image (reduce size for bandwidth)
    const compressed = await compressImage(uri);
    
    // 2. Store locally in WatermelonDB
    await database.collections.get('visits').find(visitId).update((v) => {
      v.photo_uris = [...v.photo_uris, compressed.path];
      v.synced = false;
    });
    
    setPhotos([...photos, compressed.path]);
  };
  
  return (
    <View>
      <Camera style={{ flex: 1 }} />
      <Button title="Take Photo" onPress={handleCapture} />
      <Text>{photos.length} photos captured</Text>
    </View>
  );
}
```

**Backend Upload:**
- [ ] Batch upload photos to S3 during sync
- [ ] Generate signed URLs for display
- [ ] Delete local photos after upload
- [ ] Store S3 URLs in visits.proof_photos_urls

#### 8.3 Attendance Flags (2 hours)
**Implement:** `services/visit_service.py` (backend)

```python
def validate_visit_checkin(visit_id):
    """
    Post-sync validation:
    1. Calculate check-in distance
    2. Calculate tardiness (scheduled vs actual)
    3. Flag if:
       - Arrival >15 min late → arrival_status = 'late'
       - Arrival >500m from home → distance_flag = True
       - No checkout by shift_end → incomplete_flag = True
    """
    
    visit = db.query(Visits).filter(id == visit_id).first()
    roster = db.query(Rosters).filter(id == visit.roster_id).first()
    patient = db.query(Patients).filter(id == visit.patient_id).first()
    
    # Distance check
    distance = haversine_distance(
        (visit.checkin_latitude, visit.checkin_longitude),
        (patient.home_latitude, patient.home_longitude)
    )
    visit.distance_from_home = distance
    
    # Tardiness check
    tardiness_minutes = (visit.actual_checkin_time - roster.shift_start).total_seconds() / 60
    if tardiness_minutes > 15:
        visit.arrival_status = 'late'
        visit.arrival_minutes_delta = int(tardiness_minutes)
    
    db.commit()
```

**Admin Dashboard Alert:**
- [ ] Show staff with multiple late arrivals (> 3/month)
- [ ] Show staff with questionable GPS (far from home)
- [ ] Show incomplete visits (checked in but no checkout)

#### 8.4 Integration Tests (2-3 hours)
**Test:**
- [ ] Check-in 500m away → warning shown, but allowed
- [ ] Upload photo → queued for sync
- [ ] Sync offline data → backend validates GPS + distance
- [ ] Late arrival → flagged in admin dashboard
- [ ] Admin can view proof photos

**Deliverable:** GPS validation + photo proof fully integrated

**Time Estimate:** 8-11 hours  
**Status Checklist:**
- [ ] GPS distance calculated (haversine)
- [ ] Photos captured + compressed locally
- [ ] Photos uploaded to S3 during sync
- [ ] Backend validates attendance (tardiness, distance)
- [ ] Admin dashboard shows attendance flags

---

### Phase 3 Summary

**What You've Built:**
- ✅ Field staff mobile PWA (Expo/React Native)
- ✅ Offline-first architecture (WatermelonDB)
- ✅ GPS check-in/check-out with distance calculation
- ✅ Photo proof of visit (upload to S3)
- ✅ Background sync engine (auto-sync when online)
- ✅ Attendance validation (tardiness, distance flags)

**What You Haven't Built Yet:**
- ❌ Admin web dashboard (roster calendar, KPIs, staff management)
- ❌ Finance dashboard (invoices, collections, payroll)
- ❌ Doctor interface (clinical notes, care plans)
- ❌ WhatsApp family notifications
- ❌ Analytics (revenue trends, utilization, churn)

**Estimated Time:** 25 days (200-240 hours)  
**Status:** MVP + field operations ready, can support 8-10 pilot customers

---

## PHASE 4: POLISH & LAUNCH (Days 76-90) - Web UI, Testing, Outreach

### Goal
Build web dashboards, harden security, test end-to-end, and launch to public beta.

### Week 11: Admin Web Dashboard (Days 76-82)

#### 9.1 React/Vite Frontend Setup (1-2 hours)
**Create:** `frontend/` with React 18 + Vite

```bash
npm create vite@latest heallog-frontend -- --template react-ts
cd heallog-frontend
npm install zustand react-query recharts tailwindcss react-router-dom
```

**Directory Structure:**
```
frontend/src/
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx       # KPIs, alerts, quick stats
│   │   ├── RosterCalendar.tsx  # Drag-drop calendar
│   │   ├── StaffDirectory.tsx  # Manage staff
│   │   └── Settings.tsx
│   ├── finance/
│   │   ├── Dashboard.tsx       # Revenue, collections
│   │   ├── Invoices.tsx
│   │   └── Payroll.tsx
│   └── auth/
│       └── Login.tsx
├── components/
│   ├── RosterCalendar.tsx      # Reusable calendar
│   ├── MetricCard.tsx          # KPI tile
│   └── ...
└── App.tsx
```

#### 9.2 Admin Dashboard (3-4 hours)
**Implement:** `frontend/src/pages/admin/Dashboard.tsx`

**KPI Cards (above fold):**
- Today's revenue (₹X)
- Active rosters today (N visits)
- Outstanding collections (₹Y)
- Staff on duty (N)

**Charts:**
- Revenue trend (last 30 days, line chart)
- Staff utilization (hours/nurse, bar chart)
- Attendance summary (% on-time, late, absent)

**Alerts:**
- Staff with >3 absences this month
- Visits uncompleted (checked in but no checkout)
- Outstanding invoices >30 days

#### 9.3 Roster Calendar UI (4-5 hours)
**Implement:** `frontend/src/pages/admin/RosterCalendar.tsx`

**Features:**
- Grid layout: staff names (Y-axis), dates (X-axis)
- Color-coded cells: green (assigned), yellow (pending), red (no-show)
- Drag-drop to assign staff to shifts
- Modal to edit shift details (time, patient, notes)
- Bulk operations (copy week, import previous roster)

**Library:** Use `react-beautiful-dnd` for drag-drop

#### 9.4 Staff Directory UI (2-3 hours)
**Implement:** `frontend/src/pages/admin/StaffDirectory.tsx`

- Table: name, qualification, specialization, availability status
- Quick actions: edit, view attendance, disable
- Bulk import (Excel) to add staff

#### 9.5 Authentication & Role-Based Routing (2-3 hours)
**Implement:** `frontend/src/services/auth.ts`, `App.tsx`

```typescript
// Zustand store for auth
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: null,
  login: async (email, password) => {
    const { data } = await api.post('/v1/auth/login', { email, password });
    set({ user: data.user, token: data.access_token, role: data.user.role });
  },
  logout: () => set({ user: null, token: null, role: null }),
}));

// Route protection by role
<Routes>
  <Route path="/" element={<Login />} />
  <Route
    path="/admin/*"
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    }
  />
  <Route
    path="/finance/*"
    element={
      <ProtectedRoute allowedRoles={['finance']}>
        <FinanceLayout />
      </ProtectedRoute>
    }
  />
</Routes>
```

**Test:**
- [ ] Admin can login, sees admin dashboard
- [ ] Finance can login, sees finance dashboard
- [ ] Non-admin cannot access admin pages (403)
- [ ] Logout clears token + redirects to login

**Deliverable:** Admin web dashboard fully functional

**Time Estimate:** 14-18 hours  
**Status Checklist:**
- [ ] React/Vite app boots, connects to backend
- [ ] Login works (JWT token stored)
- [ ] Admin dashboard shows real KPIs from backend
- [ ] Roster calendar displays shifts, can drag-drop
- [ ] Staff directory shows all staff with quick actions
- [ ] Role-based routing works (cannot access other roles' pages)

---

### Week 12: Finance Dashboard & Testing (Days 83-89)

#### 10.1 Finance Dashboard (2-3 hours)
**Implement:** `frontend/src/pages/finance/Dashboard.tsx`

- Outstanding receivables (table: patient name, amount, days overdue)
- Payment collection rate (gauge: 65% collected)
- Pending staff payroll (table: staff name, amount due, due date)
- Monthly revenue trend (line chart)
- Export to Excel button

#### 10.2 Invoices Page (2-3 hours)
**Implement:** `frontend/src/pages/finance/Invoices.tsx`

- List of invoices (filterable by status, date)
- Create invoice (from attendance)
- View invoice details (PDF)
- Mark as sent/paid/overdue
- Create Razorpay payment link
- Send invoice via email

#### 10.3 Payroll Page (2 hours)
**Implement:** `frontend/src/pages/finance/Payroll.tsx`

- Payroll calculation for month (trigger button)
- Payroll table: staff name, base salary, commission, bonus, deductions, total
- Approve button (bulk or individual)
- Generate salary slips (PDF)
- Process payout (bank transfer or cash)

#### 10.4 End-to-End Testing (4-5 hours)
**Test Workflows:**

**Workflow 1: Roster → Visit → Billing**
- [ ] Create roster for patient X, staff Y
- [ ] Staff checks in via mobile (GPS + time captured)
- [ ] Staff marks care tasks complete
- [ ] Staff checks out
- [ ] Backend creates visit record
- [ ] Admin generates invoice from visits
- [ ] Family receives payment link via WhatsApp
- [ ] Family pays via Razorpay
- [ ] Invoice marked as paid, collection rate updated

**Workflow 2: Visit → Payroll**
- [ ] 10 completed visits for staff Y this month
- [ ] Admin calculates payroll
- [ ] Payroll shows: base salary + 10×₹100 commission
- [ ] Admin approves
- [ ] Staff receives SMS: "Salary ₹X credited"
- [ ] Finance can export payroll to Excel

**Workflow 3: Offline Sync**
- [ ] Field staff checks in while offline (no internet)
- [ ] Check-in stored locally (WatermelonDB)
- [ ] Status shows "Offline - will sync when connected"
- [ ] Staff goes online
- [ ] Background sync triggers
- [ ] Backend receives check-in data
- [ ] Status updates to "Synced"

**Performance Testing:**
- [ ] Dashboard loads in <2 sec with 100 staff
- [ ] Roster calendar renders 1000 shifts smoothly
- [ ] Mobile app responds to GPS + camera actions <1 sec

**Security Testing:**
- [ ] SQL injection attempts → blocked
- [ ] XSS attempts → sanitized
- [ ] CSRF → tokens validated
- [ ] Tenant isolation → user from Tenant A cannot see Tenant B data
- [ ] JWT expiry → refresh token works, expired token returns 401

**Deliverable:** All workflows tested, edge cases handled

**Time Estimate:** 10-13 hours  
**Status Checklist:**
- [ ] Finance dashboard shows real data
- [ ] Invoices can be generated + sent
- [ ] Payroll calculation works end-to-end
- [ ] Workflow tests pass (roster → billing, visit → payroll)
- [ ] Offline sync tested + works
- [ ] Performance acceptable (<2 sec dashboard load)
- [ ] Security hardened (no SQL injection, XSS, etc.)

---

### Week 13: Launch Prep (Day 90)

#### 11.1 Documentation (2-3 hours)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User manual (admin, finance, doctor, receptionist, field staff)
- [ ] Deployment guide (for ops/DevOps)
- [ ] Troubleshooting guide (common errors)

#### 11.2 Support & Monitoring (1-2 hours)
- [ ] Set up Sentry for error tracking
- [ ] Set up CloudWatch dashboards (CPU, memory, API latency)
- [ ] Create support email / WhatsApp group
- [ ] Write runbook for common issues

#### 11.3 Outreach & Sales (1-2 hours)
- [ ] Create landing page (simple: HealLog tagline + features + CTA)
- [ ] Prepare email/WhatsApp outreach template
- [ ] Create list of 500 agencies in Bengaluru (from LinkedIn, Google Maps)
- [ ] Schedule outreach campaign for Monday after launch

#### 11.4 Final QA (1-2 hours)
- [ ] Smoke test all endpoints
- [ ] Test login flow (admin, finance, field staff)
- [ ] Test roster creation → billing → payment
- [ ] Test field staff app (check-in → check-out → sync)
- [ ] Test offline mode + sync
- [ ] Production deployment (ECS, RDS, Redis all up)

**Deliverable:** Ready to announce beta launch

---

### Phase 4 Summary

**What You've Built:**
- ✅ Web dashboards (admin, finance, receptionist, doctor)
- ✅ End-to-end testing (all workflows verified)
- ✅ Security hardening (XSS, SQL injection, CSRF protected)
- ✅ Documentation + support setup
- ✅ Monitoring + error tracking (Sentry, CloudWatch)

**Status:** Public beta launch ready!

**Estimated Time:** 15 days (120-150 hours)

---

## 90-DAY TIMELINE SUMMARY

| Phase | Duration | Focus | Output | Go-Live Customers |
|-------|----------|-------|--------|-------------------|
| **Phase 1** | Days 1-20 | Infrastructure | Multi-tenant DB, Auth, API | 0 (Foundation) |
| **Phase 2** | Days 21-50 | Revenue | Rosters, Billing, Payroll | 3-5 (Closed Beta) |
| **Phase 3** | Days 51-75 | Operations | Mobile PWA, GPS, Field Ops | 8-10 (Open Beta) |
| **Phase 4** | Days 76-90 | Polish | Web UI, Testing, Launch | 10-15 (Public Beta) |
| **TOTAL** | **90 Days** | **Full Stack** | **Production-Ready SaaS** | **₹5-10L MRR** |

---

## HOW TO EXECUTE

### Solo Developer Assumptions
- **Coding:** 40-50 hours/week (8-10 hours/day, 5 days/week)
- **Breaks:** Weekends off, ~2 weeks vacation spread across 3 months
- **Total Available:** ~600-750 coding hours in 90 days
- **Allocation:** 160-180h Phase 1, 240-280h Phase 2, 200-240h Phase 3, 120-150h Phase 4

### Weekly Cadence
**Monday:** Plan week (which endpoints/features this week)  
**Tuesday-Thursday:** Deep work (code, test)  
**Friday:** Deployment + demo to self (make sure it works)  
**Weekend:** Rest (no coding)

### Milestones & Checkpoints

**End of Week 2 (Day 14):**
- [ ] AWS infrastructure deployed
- [ ] Database schema with RLS working
- [ ] Authentication working
- [ ] First API endpoints (patients, staff) responding

**End of Week 4 (Day 28):**
- [ ] Roster scheduling fully functional
- [ ] Billing invoice generation working
- [ ] Razorpay integration tested
- [ ] Ready for closed beta launch

**End of Week 7 (Day 49):**
- [ ] Field staff mobile app (offline + sync) working
- [ ] GPS check-in/check-out verified
- [ ] 5-10 pilot agencies using system
- [ ] First revenue flowing (rosters scheduled, visits tracked)

**End of Week 10 (Day 70):**
- [ ] Admin + finance web dashboards live
- [ ] End-to-end workflows tested
- [ ] 10-15 beta customers on boarding

**End of Week 13 (Day 90):**
- [ ] Public beta launch
- [ ] ₹5-10L MRR (foundation)
- [ ] Documentation + support setup
- [ ] Ready for Q2 expansion

---

## ALTERNATIVE: PHASED ROLLOUT (If Resources Limited)

If you can only code 20-30 hours/week, extend timeline to 6 months:

| Timeline | Focus |
|----------|-------|
| **Months 1-2** | Phase 1 (Infrastructure) + Start Phase 2 |
| **Months 3-4** | Complete Phase 2 (Rosters, Billing, Payroll) |
| **Months 5-6** | Phase 3 (Mobile) + Phase 4 (Launch) |

This gives you **₹5-10L MRR by end of Q2** instead of Q1.

---

## SUCCESS FACTORS

### What Will Make This Work
1. **Stay in scope** - Don't add telemedicine, ABDM, equipment tracking in Phase 1. Ship MVP first.
2. **Test relentlessly** - Tenant isolation bugs are catastrophic. Test multi-tenant scenarios early.
3. **Pilot with real customers** - Get 3-5 agencies in Phase 2, iterate based on feedback.
4. **Monitor production** - Set up alerts NOW. Don't learn about bugs from angry customers.
5. **Document as you go** - Future you (or your first hire) will thank you.

### What Will Kill This
1. **Perfectionism** - Don't build for 100 agencies while 5 need features. Iterate.
2. **Scope creep** - "But the customer asked for X" → log it as Phase 5 feature, move on.
3. **Technical debt** - No, you can't refactor the entire codebase mid-Phase 3. Ship first, optimize later.
4. **Isolation bugs** - If tenant A sees tenant B's data, game over. Test this religiously.

---

## NEXT IMMEDIATE STEPS (This Week)

1. **Today:** Set up AWS account, VPC, security groups
2. **Tomorrow:** Launch RDS PostgreSQL, ElastiCache Redis
3. **Day 3:** Set up GitHub repo, CI/CD pipeline skeleton
4. **Day 4:** Start Phase 1 Week 1 work (infrastructure validation)
5. **Day 5:** First FastAPI + PostgreSQL + RLS test (confirm multi-tenant isolation)

**Week 1 goal:** "I can deploy a FastAPI container that enforces tenant isolation in PostgreSQL RLS."

---

## QUESTIONS TO ANSWER BEFORE STARTING

1. **AWS Budget:** Can you commit $500-800/month for infrastructure?
2. **Customer Readiness:** Do you have 3-5 nursing bureaus willing to beta test?
3. **Time Commitment:** Can you really code 40-50 hours/week for 90 days?
4. **Team:** Are you solo, or do you have a co-founder for frontend?
5. **Backup Plan:** If a customer bugs block you, how fast can you pivot?

---

## FINANCIAL PROJECTIONS (Outcome)

**End of 90 Days (Q1 2026):**
- 10-15 paying customers (nursing bureaus)
- ₹2,000/month/customer (conservative) = ₹20-30k/month
- Minus infrastructure ($800) = ₹19.2-29.2k net MRR
- **Goal:** ₹15-20L MRR (requires 75-100 customers at ₹2k each, or 10-15 at ₹15-20k each)

**Q2 2026 (6 months in):**
- Expand to Hyderabad, Mumbai
- Target: 30-50 customers
- ₹60-100k MRR (before costs)

**Q3 2026 (9 months in):**
- Nationwide presence
- Target: 100+ customers
- ₹200-300k MRR (before costs)

This trajectory gets you to ₹15-20L MRR (~₹15-20k revenue) by month 9-12, or ₹1.5-2L ARR at month 3 (not quite ₹15-20L, but on track).

**Note:** Your actual target is ₹15-20L MRR, which requires ~100-150 paying customers. Phase 4 gets you to foundation; Phase 5-6 gets you to target. Plan accordingly.

---

## CONCLUSION

This 90-day plan transforms HealLog from a clinic EMR to a **multi-tenant SaaS operations platform** for home care agencies.

**You will:**
- Build and ship features incrementally (Phase 1 → Phase 4)
- Stay lean (no feature creep, no perfectionism)
- Validate with real customers (Closed beta → Open beta → Public)
- Achieve production readiness by Day 90
- Be positioned for ₹15-20L MRR by month 6-12

**The key:** Do Phase 1 (infrastructure) right. Everything else builds on that foundation. RLS isolation bugs now = nightmare support tickets later.

**Start Monday. Ship by Day 90. Scale by month 6.**

Good luck, founder. 🚀
