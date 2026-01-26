# HealLog v2.0 - Feature Specifications

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

HealLog v2.0 is an **Operations OS for Home Care Agencies**. This document details the core features organized by priority tier.

---

## 2. Feature Roadmap

```
Q1 2026 (Months 1-3) - MVP
├── Multi-tenant PostgreSQL with RLS
├── Staff Rostering Engine
├── GPS Check-in/Check-out
├── Agency Billing & Invoicing
├── Staff Payroll Calculation
├── WhatsApp + SMS Integration
├── Field Staff PWA (Offline-first)
└── TARGET: ₹5-10L MRR with 5-10 agencies

Q2 2026 (Months 4-6) - Market Expansion
├── Family Notifications
├── Analytics Dashboard
├── ABHA Patient ID Linking
├── Basic Care Plan Templates
└── TARGET: ₹15-25L MRR with 20-30 agencies

Q3 2026 (Months 7-9) - Differentiation
├── Telemedicine Integration
├── Equipment Rental Tracking
├── Advanced Analytics
├── Regional Language Support
└── TARGET: ₹30-50L MRR with 40-60 agencies

Q4 2026 (Months 10-12) - Scale
├── ABDM M3 Integration
├── White-label Option
├── Enterprise Features
└── TARGET: ₹50-100L MRR
```

---

## 3. Tier 1: MVP Features (Q1 2026)

### 3.1 Staff Rostering Engine

**Priority:** Critical
**Effort:** 4 weeks
**Value:** Solves #1 pain point - shift scheduling chaos

#### User Stories

```
As an AGENCY ADMIN, I want to:
- View a calendar showing all staff shifts for the week
- Drag-and-drop to assign staff to patient visits
- Create recurring shifts (e.g., Mon/Wed/Fri for 4 weeks)
- See staff availability status (on-duty, on-leave, off-duty)
- Get warnings for double-booking conflicts
- Copy previous week's roster as a template

As a FIELD STAFF, I want to:
- See my upcoming shifts for the next 7 days
- Get SMS/WhatsApp notification when assigned to a shift
- View patient details (name, address, phone) for each shift
- Mark myself as unavailable for specific dates
```

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| RST-01 | Create single shift with staff, patient, date, time | Must Have |
| RST-02 | Create recurring shifts (select days, end date) | Must Have |
| RST-03 | Drag-drop shift reassignment on calendar | Must Have |
| RST-04 | Conflict detection (prevent double-booking) | Must Have |
| RST-05 | Staff availability check before assignment | Must Have |
| RST-06 | SMS notification on shift assignment | Must Have |
| RST-07 | Copy previous week's roster | Should Have |
| RST-08 | Bulk import shifts from Excel | Could Have |
| RST-09 | Auto-suggest optimal staff based on skills | Could Have |

#### UI Mockups

**Calendar View:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  January 2026                     [<] [Week View] [Month View] [>]  │
├─────────────────────────────────────────────────────────────────────┤
│         │ Mon 20  │ Tue 21  │ Wed 22  │ Thu 23  │ Fri 24  │ Sat 25 │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ Lakshmi │ ████████│         │ ████████│         │ ████████│        │
│         │ Ramesh  │         │ Ramesh  │         │ Ramesh  │        │
│         │ 9am-9pm │         │ 9am-9pm │         │ 9am-9pm │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ Priya   │         │ ████████│         │ ████████│         │████████│
│         │         │ Sunita  │         │ Sunita  │         │Mohan   │
│         │         │ 8am-8pm │         │ 8am-8pm │         │10am-6pm│
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ Kavya   │ ████████│ ████████│ ████████│ ████████│ ████████│        │
│         │ Anita   │ Anita   │ Anita   │ Anita   │ Anita   │        │
│         │ 24-hour │ 24-hour │ 24-hour │ 24-hour │ 24-hour │        │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘

Legend: ████ Scheduled  ░░░░ Available  ╳╳╳╳ On Leave
```

---

### 3.2 GPS Check-in/Check-out

**Priority:** Critical
**Effort:** 2 weeks
**Value:** Attendance verification, dispute resolution

#### User Stories

```
As a FIELD STAFF, I want to:
- Check-in when I arrive at patient's home (capture time + GPS)
- Check-out when I leave (capture time + GPS)
- See my distance from patient's home when checking in
- Upload photos as proof of visit
- Work offline and sync when I get connectivity

As an AGENCY ADMIN, I want to:
- See real-time check-in/check-out status for today's visits
- View GPS coordinates and distance from patient home
- Flag visits where staff checked in far from patient location
- View attendance trends (late arrivals, early departures)
```

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| GPS-01 | Capture GPS coordinates on check-in | Must Have |
| GPS-02 | Capture GPS coordinates on check-out | Must Have |
| GPS-03 | Calculate distance from patient home (haversine) | Must Have |
| GPS-04 | Store timestamp with timezone | Must Have |
| GPS-05 | Flag late arrivals (> 15 min after scheduled) | Must Have |
| GPS-06 | Offline storage and background sync | Must Have |
| GPS-07 | Photo capture for proof of visit | Should Have |
| GPS-08 | GPS accuracy indicator (warn if > 100m) | Should Have |
| GPS-09 | Geofencing alerts (entered/left area) | Could Have |

#### Check-In Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHECK-IN SCREEN                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    📍 Your Location                                                  │
│    ───────────────                                                   │
│    Lat: 12.9716° N                                                   │
│    Lng: 77.5946° E                                                   │
│    Accuracy: 15 meters ✅                                            │
│                                                                      │
│    📏 Distance from Patient Home                                     │
│    ─────────────────────────────                                     │
│    150 meters ✅                                                     │
│                                                                      │
│    ⏰ Current Time                                                   │
│    ──────────────                                                    │
│    9:05 AM (5 min late)                                             │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │                                                             │  │
│    │              [  ✓  CONFIRM CHECK-IN  ]                     │  │
│    │                                                             │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Agency Billing & Invoicing

**Priority:** Critical
**Effort:** 3 weeks
**Value:** Revenue tracking, professional invoicing

#### User Stories

```
As a FINANCE MANAGER, I want to:
- Generate invoices from completed visits
- Set per-visit or package-based pricing
- Apply discounts and adjustments
- Send invoices via email/WhatsApp
- Track payment status (unpaid, partial, paid, overdue)
- Create Razorpay payment links for families
- View outstanding receivables by patient

As an AGENCY ADMIN, I want to:
- See total revenue and collection rate on dashboard
- View overdue invoices with days outstanding
- Export billing data to Excel for accountant
```

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| BIL-01 | Generate invoice from attendance records | Must Have |
| BIL-02 | Per-visit pricing (₹X per visit) | Must Have |
| BIL-03 | Package pricing (₹Y for N visits) | Must Have |
| BIL-04 | Discount/adjustment entry | Must Have |
| BIL-05 | GST calculation (18%) | Must Have |
| BIL-06 | Payment status tracking | Must Have |
| BIL-07 | Send invoice via email | Must Have |
| BIL-08 | Send invoice via WhatsApp | Should Have |
| BIL-09 | Razorpay payment link generation | Should Have |
| BIL-10 | Outstanding dues dashboard | Must Have |
| BIL-11 | Export to Excel | Should Have |

#### Invoice Template

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INVOICE                                    │
│                                                                      │
│  Care Plus Nursing Bureau                    Invoice #: INV-2026-001│
│  123 MG Road, Bengaluru                      Date: January 25, 2026 │
│  Phone: +91 98765 43210                      Due: February 25, 2026 │
│  GSTIN: 29ABCDE1234F1Z5                                             │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  BILL TO:                                                            │
│  Mr. Ramesh Patel                                                    │
│  789 Park Street, Bengaluru 560002                                   │
│  Phone: +91 98765 43213                                              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  DESCRIPTION                          QTY    RATE     AMOUNT        │
│  ─────────────────────────────────────────────────────────────────  │
│  Home Nursing Visits (Jan 1-31)       12     ₹500     ₹6,000        │
│  Wound Care Supplies                  1      ₹500     ₹500          │
│                                                                      │
│                                       Subtotal:       ₹6,500        │
│                                       Discount (10%): -₹650         │
│                                       CGST (9%):      ₹527          │
│                                       SGST (9%):      ₹527          │
│                                       ─────────────────────────     │
│                                       TOTAL:          ₹6,904        │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Payment Link: https://rzp.io/l/HealLog001                          │
│  UPI: careplus@upi                                                   │
│                                                                      │
│  Thank you for choosing Care Plus!                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Staff Payroll Calculation

**Priority:** Critical
**Effort:** 3 weeks
**Value:** Reduces month-end chaos, staff retention

#### User Stories

```
As a FINANCE MANAGER, I want to:
- Calculate monthly payroll from attendance and visits
- Support fixed salary + commission models
- Apply bonuses (attendance bonus, performance bonus)
- Apply deductions (absent days, advances)
- Approve payroll before processing
- Generate salary slips
- Track payment status

As a FIELD STAFF, I want to:
- View my monthly attendance summary
- See how my salary is calculated (base + commission)
- View payment history
```

#### Compensation Models

**Model 1: Fixed Salary**
```
Base Salary: ₹18,000/month
Deductions: ₹692/day for absences (18000/26 working days)
```

**Model 2: Commission-Based**
```
Base Salary: ₹10,000/month
Commission: ₹100/visit
Example: 60 visits × ₹100 = ₹6,000 commission
Total: ₹16,000
```

**Model 3: Hybrid**
```
Base Salary: ₹15,000/month
Commission: 10% of billing from visits
Attendance Bonus: ₹1,000 if >95% attendance
```

#### Payroll Calculation Example

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SALARY SLIP - JANUARY 2026                        │
├─────────────────────────────────────────────────────────────────────┤
│  Employee: Lakshmi Devi                  Staff ID: STF-001          │
│  Designation: GNM Nurse                  Department: Field Staff    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ATTENDANCE SUMMARY                                                  │
│  ─────────────────                                                   │
│  Working Days: 26          Present: 24          Absent: 2           │
│  Total Visits: 48          Late Arrivals: 3                         │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  EARNINGS                              DEDUCTIONS                    │
│  ─────────────────                     ─────────────────             │
│  Base Salary:     ₹18,000              Absent (2 days): ₹1,385      │
│  Commission:      ₹4,800               PF Contribution:  ₹2,160     │
│  Attendance Bonus: ₹0                                                │
│                                                                      │
│  Gross:           ₹22,800              Total Deductions: ₹3,545     │
│                                                                      │
│                                        NET PAYABLE:      ₹19,255    │
├─────────────────────────────────────────────────────────────────────┤
│  Payment Date: February 5, 2026                                      │
│  Payment Method: Bank Transfer (HDFC ****1234)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.5 WhatsApp + SMS Integration

**Priority:** Critical
**Effort:** 2 weeks
**Value:** 80% of Indian healthcare communication is via WhatsApp

#### Use Cases

| Trigger | Message | Channel |
|---------|---------|---------|
| Shift assigned | "You have a new shift: Ramesh Patel, Jan 26, 9AM-9PM" | WhatsApp |
| Shift reminder | "Reminder: Your shift at Ramesh Patel's home starts in 1 hour" | WhatsApp |
| Staff checked in | "Nurse Lakshmi has arrived at 9:05 AM" | WhatsApp to family |
| Staff checked out | "Visit completed. Duration: 11h 55m" | WhatsApp to family |
| Invoice generated | "Invoice ₹6,904 for January. Pay here: [link]" | WhatsApp |
| Payment received | "Payment of ₹6,904 received. Thank you!" | SMS |
| Salary credited | "Your salary ₹19,255 has been credited" | SMS to staff |

#### Provider Integration

**MSG91 Configuration:**
```python
# SMS Template (DLT Registered)
SHIFT_REMINDER = "Dear {staff_name}, reminder: Your shift at {patient_name}'s home starts at {time}. Address: {address}. - HealLog"

# WhatsApp Business API Template
STAFF_ARRIVAL = """
Hi {family_name},

Your nurse {nurse_name} has arrived at {time}.

Patient: {patient_name}
Visit Type: {visit_type}

If you have any concerns, call us at {agency_phone}.

- {agency_name}
"""
```

---

## 4. Tier 2: Market Viability Features (Q2 2026)

### 4.1 Analytics Dashboard

**Key Metrics:**

| Metric | Description | Visualization |
|--------|-------------|---------------|
| MRR | Monthly Recurring Revenue | Line chart |
| Collection Rate | Paid / Invoiced % | Gauge |
| Staff Utilization | Hours worked / Available hours | Bar chart |
| Visit Completion | Completed / Scheduled visits | Pie chart |
| Patient Churn | Patients who stopped visits | Trend line |
| Attendance Rate | On-time / Total check-ins | Heat map |

### 4.2 Family Notifications

**Automated Messages:**
- Nurse arrival confirmation with photo
- Visit completion summary
- Upcoming appointment reminders
- Payment reminders
- Care plan updates

### 4.3 ABHA Integration (Non-Clinical)

**Scope:**
- Link existing ABHA ID to patient record
- Display ABHA ID on patient profile
- No clinical data exchange (Phase 1)
- Compliance readiness for future ABDM integration

---

## 5. Tier 3: Differentiation Features (Q3-Q4 2026)

### 5.1 Telemedicine Integration

- Video consult for follow-up checks
- Third-party integration (Doxy.me, JioHealthHub)
- Log consult to patient record
- Payment processing for consults

### 5.2 Equipment Tracking

- Inventory management (oxygen concentrators, beds, wheelchairs)
- Rental assignment to patients
- Return tracking
- Maintenance logs

### 5.3 Care Plans

- Pre-defined templates (wound care, physio, elder care)
- Checklist per visit (vitals, tasks, exercises)
- Field staff marks completion
- Doctor approval workflow

---

## 6. Features NOT Included (Deferred)

| Feature | Reason | When to Reconsider |
|---------|--------|-------------------|
| ABDM Clinical Exchange | High compliance cost (₹40L-1.5Cr audit) | When MRR > ₹50L |
| White-Label Branding | Adds complexity | When > 50 customers |
| Multi-Language | Focus on English metros first | Q3 2026 |
| Predictive Analytics | Nice-to-have, not MVP | Q4 2026 |
| Native iOS App | PWA is sufficient | If App Store required |

---

## 7. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [API Reference](./API_REFERENCE.md)
- [User Roles & Permissions](./USER_ROLES_PERMISSIONS.md)
