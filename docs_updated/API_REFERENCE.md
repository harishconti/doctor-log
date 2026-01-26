# HealLog v2.0 - API Reference

**Version:** 2.0
**Base URL:** `https://api.heallog.in/v1`
**Authentication:** Bearer JWT Token
**Last Updated:** January 2026

---

## 1. Overview

### 1.1 Base URL

```
Production: https://api.heallog.in/v1
Staging:    https://staging-api.heallog.in/v1
Local:      http://localhost:8000/v1
```

### 1.2 Authentication

All endpoints (except auth) require a Bearer token:

```http
Authorization: Bearer <access_token>
```

### 1.3 Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### 1.4 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 1.5 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 2. Authentication Endpoints

### 2.1 Register New Tenant

Creates a new agency/clinic account.

```http
POST /v1/auth/register
```

**Request Body:**
```json
{
  "agency_name": "Care Plus Nursing Bureau",
  "owner_name": "Rajesh Kumar",
  "email": "rajesh@careplus.in",
  "phone": "+919876543210",
  "password": "SecureP@ss123",
  "city": "Bengaluru",
  "state": "Karnataka"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "message": "Registration successful"
}
```

### 2.2 Login

```http
POST /v1/auth/login
```

**Request Body:**
```json
{
  "email": "rajesh@careplus.in",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "rajesh@careplus.in",
      "full_name": "Rajesh Kumar",
      "role": "admin",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### 2.3 Send OTP

```http
POST /v1/auth/send-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "purpose": "login"  // "login", "verify", "reset_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expires_in": 300
  }
}
```

### 2.4 Verify OTP

```http
POST /v1/auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### 2.5 Refresh Token

```http
POST /v1/auth/refresh-token
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.6 Logout

```http
POST /v1/auth/logout
Authorization: Bearer <access_token>
```

### 2.7 Password Reset

```http
POST /v1/auth/password-reset
```

**Request Body:**
```json
{
  "email": "rajesh@careplus.in"
}
```

### 2.8 Change Password

```http
POST /v1/auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "OldP@ss123",
  "new_password": "NewP@ss456"
}
```

### 2.9 Get Current User

```http
GET /v1/auth/me
Authorization: Bearer <access_token>
```

---

## 3. Tenant Management

### 3.1 Get Tenant Details

```http
GET /v1/tenants/{tenant_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Care Plus Nursing Bureau",
    "email": "contact@careplus.in",
    "phone": "+919876543210",
    "address": "123 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "subscription_plan": "pro",
    "current_staff_count": 15,
    "current_patient_count": 45,
    "status": "active"
  }
}
```

### 3.2 Update Tenant

```http
PUT /v1/tenants/{tenant_id}
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Care Plus Healthcare",
  "address": "456 MG Road, Suite 100",
  "phone": "+919876543211"
}
```

### 3.3 Get Tenant Usage

```http
GET /v1/tenants/{tenant_id}/usage
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staff_count": 15,
    "staff_limit": 25,
    "patient_count": 45,
    "patient_limit": 100,
    "api_calls_this_month": 5420,
    "api_calls_limit": 50000,
    "storage_used_mb": 256,
    "storage_limit_mb": 5120
  }
}
```

---

## 4. User Management

### 4.1 Create User

```http
POST /v1/users
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "kavya@careplus.in",
  "phone": "+919876543212",
  "full_name": "Kavya Sharma",
  "role": "receptionist",
  "password": "TempP@ss123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "kavya@careplus.in",
    "full_name": "Kavya Sharma",
    "role": "receptionist",
    "is_active": true,
    "created_at": "2026-01-25T10:00:00Z"
  },
  "message": "User created successfully"
}
```

### 4.2 List Users

```http
GET /v1/users?role=nurse&is_active=true&page=1&per_page=20
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "...",
      "full_name": "...",
      "role": "nurse",
      "is_active": true,
      "last_login": "2026-01-24T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 8,
    "total_pages": 1
  }
}
```

### 4.3 Get User

```http
GET /v1/users/{user_id}
Authorization: Bearer <access_token>
```

### 4.4 Update User

```http
PUT /v1/users/{user_id}
Authorization: Bearer <access_token>
```

### 4.5 Delete User (Soft)

```http
DELETE /v1/users/{user_id}
Authorization: Bearer <access_token>
```

### 4.6 Update User Permissions

```http
POST /v1/users/{user_id}/permissions
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "permissions": [
    "view_billing",
    "create_invoices"
  ]
}
```

---

## 5. Patient Management

### 5.1 Create Patient

```http
POST /v1/patients
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "Ramesh",
  "last_name": "Patel",
  "phone": "+919876543213",
  "email": "ramesh.patel@email.com",
  "date_of_birth": "1955-05-15",
  "gender": "male",
  "blood_group": "O+",
  "address_line1": "789 Park Street",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560002",
  "home_latitude": 12.9716,
  "home_longitude": 77.5946,
  "emergency_contact_name": "Suresh Patel",
  "emergency_contact_phone": "+919876543214",
  "emergency_contact_relationship": "son",
  "medical_history": "Diabetes Type 2, Hypertension",
  "allergies": "Penicillin",
  "chronic_conditions": "diabetes,hypertension"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "first_name": "Ramesh",
    "last_name": "Patel",
    "is_active": true,
    "created_at": "2026-01-25T10:30:00Z"
  },
  "message": "Patient created successfully"
}
```

### 5.2 List Patients

```http
GET /v1/patients?search=ramesh&is_active=true&page=1&per_page=20
Authorization: Bearer <access_token>
```

### 5.3 Get Patient

```http
GET /v1/patients/{patient_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "first_name": "Ramesh",
    "last_name": "Patel",
    "phone": "+91987654****",  // Masked
    "date_of_birth": "1955-05-15",
    "age": 70,
    "gender": "male",
    "blood_group": "O+",
    "address": {
      "line1": "789 Park Street",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560002"
    },
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "emergency_contact": {
      "name": "Suresh Patel",
      "phone": "+91987654****",
      "relationship": "son"
    },
    "medical_info": {
      "medical_history": "Diabetes Type 2, Hypertension",
      "allergies": "Penicillin",
      "chronic_conditions": ["diabetes", "hypertension"],
      "current_medications": null
    },
    "statistics": {
      "total_visits": 24,
      "last_visit_date": "2026-01-20",
      "active_care_plans": 1
    },
    "is_active": true,
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

### 5.4 Update Patient

```http
PUT /v1/patients/{patient_id}
Authorization: Bearer <access_token>
```

### 5.5 Delete Patient (Soft)

```http
DELETE /v1/patients/{patient_id}
Authorization: Bearer <access_token>
```

### 5.6 Search Patients

```http
GET /v1/patients/search?q=ramesh&field=name
GET /v1/patients/search?q=9876543213&field=phone
Authorization: Bearer <access_token>
```

### 5.7 Get Patient Visits

```http
GET /v1/patients/{patient_id}/visits?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <access_token>
```

### 5.8 Upload Patient Document

```http
POST /v1/patients/{patient_id}/documents
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Document file (PDF, image)
- `document_type`: "aadhar", "prescription", "report", "insurance"
- `description`: "Blood test report Jan 2026"

---

## 6. Staff Management

### 6.1 Create Staff

```http
POST /v1/staff
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "Lakshmi",
  "last_name": "Devi",
  "phone": "+919876543220",
  "email": "lakshmi@careplus.in",
  "gender": "female",
  "date_of_birth": "1990-03-20",
  "qualification": "GNM",
  "nursing_council_registration_number": "KA-GNM-12345",
  "nursing_council_state": "Karnataka",
  "experience_years": 5,
  "specializations": "wound_care,elder_care",
  "permanent_address": "123 Jayanagar, Bengaluru",
  "base_salary": 18000.00,
  "commission_percentage": 10.00
}
```

### 6.2 List Staff

```http
GET /v1/staff?qualification=GNM&availability=on_duty&page=1&per_page=20
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "first_name": "Lakshmi",
      "last_name": "Devi",
      "phone": "+919876543220",
      "qualification": "GNM",
      "specializations": ["wound_care", "elder_care"],
      "current_availability": "on_duty",
      "performance_rating": 4.5,
      "today_shifts": 2,
      "completed_visits_this_month": 45
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### 6.3 Get Staff

```http
GET /v1/staff/{staff_id}
Authorization: Bearer <access_token>
```

### 6.4 Update Staff

```http
PUT /v1/staff/{staff_id}
Authorization: Bearer <access_token>
```

### 6.5 Update Staff Skills

```http
PUT /v1/staff/{staff_id}/skills
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "specializations": ["wound_care", "elder_care", "physio"],
  "skills_verified": true
}
```

### 6.6 Update Staff Availability

```http
PUT /v1/staff/{staff_id}/availability
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "availability": "on_leave",
  "leave_start_date": "2026-02-01",
  "leave_end_date": "2026-02-05",
  "reason": "Personal"
}
```

### 6.7 Get Staff Attendance

```http
GET /v1/staff/{staff_id}/attendance?month=2026-01
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staff_id": "550e8400-e29b-41d4-a716-446655440020",
    "month": "2026-01",
    "summary": {
      "working_days": 26,
      "present_days": 24,
      "absent_days": 2,
      "late_arrivals": 3,
      "total_visits": 72,
      "on_time_percentage": 87.5
    },
    "daily_records": [
      {
        "date": "2026-01-25",
        "status": "present",
        "shifts": 2,
        "check_ins": [
          {"time": "09:05", "status": "late", "patient": "Ramesh Patel"},
          {"time": "14:00", "status": "on_time", "patient": "Sunita Sharma"}
        ]
      }
    ]
  }
}
```

### 6.8 Get Available Staff

```http
GET /v1/staff/available?date=2026-01-26&start_time=09:00&end_time=17:00
Authorization: Bearer <access_token>
```

---

## 7. Roster Management

### 7.1 Create Roster

```http
POST /v1/rosters
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "staff_id": "550e8400-e29b-41d4-a716-446655440020",
  "patient_id": "550e8400-e29b-41d4-a716-446655440010",
  "shift_type": "12_hour",
  "shift_date": "2026-01-26",
  "shift_start": "09:00",
  "shift_end": "21:00",
  "notes": "Patient needs wound dressing",
  "special_instructions": "Call family before leaving"
}
```

### 7.2 Create Recurring Roster

```http
POST /v1/rosters/recurring
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "staff_id": "550e8400-e29b-41d4-a716-446655440020",
  "patient_id": "550e8400-e29b-41d4-a716-446655440010",
  "shift_type": "12_hour",
  "shift_start": "09:00",
  "shift_end": "21:00",
  "days_of_week": ["Mon", "Wed", "Fri"],
  "start_date": "2026-01-27",
  "end_date": "2026-02-28",
  "notes": "Regular elder care"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rosters_created": 12,
    "parent_roster_id": "550e8400-e29b-41d4-a716-446655440030"
  },
  "message": "12 recurring shifts created"
}
```

### 7.3 List Rosters

```http
GET /v1/rosters?start_date=2026-01-01&end_date=2026-01-31&staff_id=...&status=scheduled
Authorization: Bearer <access_token>
```

### 7.4 Get Roster

```http
GET /v1/rosters/{roster_id}
Authorization: Bearer <access_token>
```

### 7.5 Update Roster

```http
PUT /v1/rosters/{roster_id}
Authorization: Bearer <access_token>
```

### 7.6 Cancel Roster

```http
DELETE /v1/rosters/{roster_id}
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cancellation_reason": "Patient hospitalized"
}
```

### 7.7 Get Calendar View

```http
GET /v1/rosters/calendar?start_date=2026-01-20&end_date=2026-01-26
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date_range": {
      "start": "2026-01-20",
      "end": "2026-01-26"
    },
    "staff": [
      {
        "staff_id": "...",
        "staff_name": "Lakshmi Devi",
        "shifts": [
          {
            "date": "2026-01-20",
            "roster_id": "...",
            "patient_name": "Ramesh Patel",
            "shift_time": "09:00-21:00",
            "status": "completed"
          },
          {
            "date": "2026-01-21",
            "roster_id": null,
            "status": "available"
          }
        ]
      }
    ]
  }
}
```

### 7.8 Get Staff Schedule

```http
GET /v1/rosters/staff/{staff_id}/schedule?start_date=2026-01-20&end_date=2026-01-26
Authorization: Bearer <access_token>
```

---

## 8. Visit Tracking

### 8.1 Check-In

```http
PUT /v1/visits/{visit_id}/checkin
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 15.5,
  "timestamp": "2026-01-26T09:05:00Z",
  "device_info": {
    "platform": "android",
    "model": "Samsung Galaxy A52"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "visit_id": "...",
    "checkin_time": "2026-01-26T09:05:00Z",
    "distance_from_patient_home": 0.15,
    "arrival_status": "late",
    "arrival_minutes_delta": 5,
    "location_verified": true
  },
  "message": "Check-in recorded successfully"
}
```

### 8.2 Check-Out

```http
PUT /v1/visits/{visit_id}/checkout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 12.0,
  "timestamp": "2026-01-26T21:00:00Z",
  "visit_notes": "Patient stable, wound healing well",
  "patient_condition_notes": "Good appetite, no complaints"
}
```

### 8.3 Add Visit Notes

```http
PUT /v1/visits/{visit_id}/notes
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "visit_notes": "Changed wound dressing, administered medications",
  "vitals": {
    "bp": "130/85",
    "pulse": 78,
    "temperature": 98.4
  }
}
```

### 8.4 Upload Visit Photo

```http
POST /v1/visits/{visit_id}/photos
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### 8.5 Get Visit Details

```http
GET /v1/visits/{visit_id}
Authorization: Bearer <access_token>
```

### 8.6 List Visits

```http
GET /v1/visits?date=2026-01-26&staff_id=...&status=completed
Authorization: Bearer <access_token>
```

### 8.7 Get Today's Visits (Dashboard)

```http
GET /v1/visits/today
Authorization: Bearer <access_token>
```

### 8.8 Batch Sync Visits (Mobile)

```http
POST /v1/visits/batch-sync
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "visits": [
    {
      "local_id": "local-uuid-1",
      "roster_id": "...",
      "checkin_time": "2026-01-26T09:05:00Z",
      "checkin_latitude": 12.9716,
      "checkin_longitude": 77.5946,
      "checkout_time": "2026-01-26T21:00:00Z",
      "visit_notes": "..."
    }
  ]
}
```

---

## 9. Billing

### 9.1 Generate Invoice

```http
POST /v1/billing/invoices
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "patient_id": "550e8400-e29b-41d4-a716-446655440010",
  "billing_period_start": "2026-01-01",
  "billing_period_end": "2026-01-31",
  "line_items": [
    {
      "description": "Home nursing visits",
      "service_type": "home_visit",
      "quantity": 12,
      "unit": "visit",
      "rate": 500.00
    }
  ],
  "discount_percentage": 10,
  "notes": "Monthly nursing care package"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "invoice_number": "INV-2026-01-001",
    "patient_name": "Ramesh Patel",
    "subtotal": 6000.00,
    "discount_amount": 600.00,
    "tax_amount": 972.00,
    "total_amount": 6372.00,
    "payment_status": "unpaid"
  },
  "message": "Invoice generated successfully"
}
```

### 9.2 List Invoices

```http
GET /v1/billing/invoices?status=unpaid&start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <access_token>
```

### 9.3 Get Invoice

```http
GET /v1/billing/invoices/{invoice_id}
Authorization: Bearer <access_token>
```

### 9.4 Update Invoice Status

```http
PUT /v1/billing/invoices/{invoice_id}
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "payment_status": "paid",
  "payment_date": "2026-01-26",
  "amount_paid": 6372.00,
  "payment_method": "bank_transfer"
}
```

### 9.5 Get Outstanding Dues

```http
GET /v1/billing/outstanding
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_outstanding": 45000.00,
    "overdue_amount": 12000.00,
    "patients": [
      {
        "patient_id": "...",
        "patient_name": "Ramesh Patel",
        "total_due": 6372.00,
        "oldest_invoice_date": "2026-01-01",
        "days_overdue": 25
      }
    ]
  }
}
```

### 9.6 Create Payment Link

```http
POST /v1/billing/payment-link
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "invoice_id": "...",
  "send_via": "whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_link": "https://rzp.io/l/HealLogINV001",
    "razorpay_link_id": "plink_xxx",
    "sent_to": "+919876543213"
  }
}
```

### 9.7 Payment Reconciliation

```http
GET /v1/billing/reconciliation?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <access_token>
```

---

## 10. Payroll

### 10.1 Calculate Monthly Payroll

```http
GET /v1/payroll/{staff_id}/monthly?month=2026-01
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staff_id": "...",
    "staff_name": "Lakshmi Devi",
    "payroll_month": "2026-01",
    "attendance": {
      "working_days": 26,
      "present_days": 24,
      "absent_days": 2,
      "late_arrivals": 3
    },
    "visits": {
      "total_visits": 48,
      "completed_visits": 48
    },
    "compensation": {
      "base_salary": 18000.00,
      "commission_rate": 10,
      "commission_earned": 2400.00,
      "bonuses": 1000.00,
      "overtime": 0
    },
    "deductions": {
      "absent_deduction": 1384.62,
      "other_deductions": 0
    },
    "summary": {
      "gross_amount": 21400.00,
      "total_deductions": 1384.62,
      "net_payable": 20015.38
    },
    "status": "pending_approval"
  }
}
```

### 10.2 Get Payroll Report

```http
GET /v1/payroll/report?month=2026-01
Authorization: Bearer <access_token>
```

### 10.3 Approve Payroll

```http
PUT /v1/payroll/{payroll_id}/approve
Authorization: Bearer <access_token>
```

### 10.4 Process Payout

```http
POST /v1/payroll/{payroll_id}/payout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "payment_method": "bank_transfer",
  "bank_transfer_id": "UTR123456789"
}
```

### 10.5 Generate Salary Slips

```http
POST /v1/payroll/generate-slips?month=2026-01
Authorization: Bearer <access_token>
```

### 10.6 Get Pending Payouts

```http
GET /v1/payroll/pending
Authorization: Bearer <access_token>
```

---

## 11. Analytics

### 11.1 Dashboard Metrics

```http
GET /v1/analytics/dashboard
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "revenue": 15000.00,
      "visits_scheduled": 24,
      "visits_completed": 18,
      "staff_on_duty": 12
    },
    "this_month": {
      "revenue": 450000.00,
      "visits_completed": 540,
      "new_patients": 8,
      "collection_rate": 85.5
    },
    "trends": {
      "revenue_growth": 12.5,
      "visit_growth": 8.2
    }
  }
}
```

### 11.2 Staff Utilization

```http
GET /v1/analytics/staff-utilization?month=2026-01
Authorization: Bearer <access_token>
```

### 11.3 Revenue Analytics

```http
GET /v1/analytics/revenue?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <access_token>
```

### 11.4 Collection Rate

```http
GET /v1/analytics/collection?month=2026-01
Authorization: Bearer <access_token>
```

### 11.5 Attendance Summary

```http
GET /v1/analytics/attendance?month=2026-01
Authorization: Bearer <access_token>
```

### 11.6 Export Data

```http
GET /v1/analytics/export?type=invoices&format=csv&start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <access_token>
```

---

## 12. Integrations

### 12.1 SMS Setup

```http
POST /v1/integrations/sms-setup
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "provider": "msg91",
  "api_key": "...",
  "sender_id": "HEALOG"
}
```

### 12.2 WhatsApp Templates

```http
POST /v1/integrations/whatsapp-templates
Authorization: Bearer <access_token>
```

### 12.3 Test SMS

```http
POST /v1/integrations/test-sms
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "message": "Test message from HealLog"
}
```

### 12.4 Payment Gateway Setup

```http
POST /v1/integrations/payments
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "provider": "razorpay",
  "key_id": "rzp_live_xxx",
  "key_secret": "..."
}
```

---

## 13. Webhooks

### 13.1 Razorpay Payment Webhook

```http
POST /v1/webhooks/razorpay
X-Razorpay-Signature: <signature>
```

**Payload:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "amount": 637200,
        "currency": "INR",
        "status": "captured",
        "notes": {
          "invoice_id": "..."
        }
      }
    }
  }
}
```

---

## 14. Health & Monitoring

### 14.1 Health Check

```http
GET /v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2026-01-26T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "s3": "healthy"
  }
}
```

### 14.2 Version Info

```http
GET /v1/version
```

---

## 15. Rate Limiting

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Authentication | 10 requests/minute |
| Read Operations | 100 requests/minute |
| Write Operations | 50 requests/minute |
| File Uploads | 10 requests/minute |
| Batch Operations | 5 requests/minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706266800
```

---

## 16. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [User Roles & Permissions](./USER_ROLES_PERMISSIONS.md)
- [Security & Compliance](./SECURITY_COMPLIANCE.md)
