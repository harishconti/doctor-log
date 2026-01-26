# HealLog v2.0 - User Roles & Permissions

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

HealLog implements Role-Based Access Control (RBAC) with **5 distinct user roles**, each with specific permissions tailored to their responsibilities within a home care agency.

---

## 2. User Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENCY OWNER / ADMIN                      │
│       (Full access: staff, patients, billing, reports)       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ FINANCE MGR   │    │    DOCTOR     │    │ RECEPTIONIST  │
│               │    │               │    │               │
│ • Billing     │    │ • Clinical    │    │ • Scheduling  │
│ • Payroll     │    │   Notes       │    │ • Patient     │
│ • Reports     │    │ • Care Plans  │    │   Comms       │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │  FIELD STAFF  │
                    │    (NURSE)    │
                    │               │
                    │ • Check-in/out│
                    │ • Visit Notes │
                    └───────────────┘
```

---

## 3. Role Definitions

### 3.1 Admin (Agency Owner)

**Who:** Home care agency owner, clinic manager, senior administrator

**Access Level:** Full system access

**Responsibilities:**
- Manage entire agency operations
- Create and manage staff accounts
- Configure agency settings and integrations
- Access all reports and analytics
- Approve payroll and billing

#### Permissions Matrix

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | ✅ | ✅ | ✅ | ✅ |
| Staff | ✅ | ✅ | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ | ✅ |
| Rosters | ✅ | ✅ | ✅ | ✅ |
| Visits | ✅ | ✅ | ✅ | ✅ |
| Clinical Notes | ❌ | ✅ | ❌ | ❌ |
| Care Plans | ✅ | ✅ | ✅ | ✅ |
| Billing | ✅ | ✅ | ✅ | ✅ |
| Payroll | ✅ | ✅ | ✅ | ✅ |
| Analytics | N/A | ✅ | N/A | N/A |
| Settings | ✅ | ✅ | ✅ | ✅ |
| Integrations | ✅ | ✅ | ✅ | ✅ |

#### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Today's      │  │ Active       │  │ Outstanding  │  │ Staff    ││
│  │ Revenue      │  │ Rosters      │  │ Collections  │  │ On Duty  ││
│  │ ₹24,500      │  │ 24           │  │ ₹1,25,000    │  │ 12       ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Upcoming Shifts (Next 7 Days)                                   ││
│  │ ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐             ││
│  │ │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun  │             ││
│  │ ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤             ││
│  │ │ 24   │ 22   │ 26   │ 24   │ 20   │ 18   │ 15   │             ││
│  │ └──────┴──────┴──────┴──────┴──────┴──────┴──────┘             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Attendance Summary      │  │ Alerts                          │  │
│  │ • On Time: 85%         │  │ ⚠️ 3 staff absent today         │  │
│  │ • Late: 10%            │  │ ⚠️ 2 rosters unassigned         │  │
│  │ • Absent: 5%           │  │ ⚠️ ₹45,000 overdue >30 days     │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│                                                                      │
│  Quick Actions: [+ Create Roster] [+ Add Patient] [Generate Invoice]│
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Finance Manager

**Who:** Accountant, finance officer, billing manager

**Access Level:** Financial operations only

**Responsibilities:**
- Generate and manage invoices
- Track payments and collections
- Calculate and process staff payroll
- Generate financial reports
- Reconcile payment gateway transactions

#### Permissions Matrix

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | ❌ | ❌ | ❌ | ❌ |
| Staff | ❌ | ✅ (basic) | ❌ | ❌ |
| Patients | ❌ | ✅ (basic) | ❌ | ❌ |
| Rosters | ❌ | ✅ | ❌ | ❌ |
| Visits | ❌ | ✅ | ❌ | ❌ |
| Clinical Notes | ❌ | ❌ | ❌ | ❌ |
| Care Plans | ❌ | ❌ | ❌ | ❌ |
| Billing | ✅ | ✅ | ✅ | ❌ |
| Payroll | ✅ | ✅ | ✅ | ❌ |
| Analytics | N/A | ✅ (financial) | N/A | N/A |
| Settings | ❌ | ❌ | ❌ | ❌ |
| Integrations | ❌ | ✅ (payment) | ❌ | ❌ |

#### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FINANCE DASHBOARD                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Outstanding  │  │ Collection   │  │ Pending      │  │ This     ││
│  │ Receivables  │  │ Rate         │  │ Payroll      │  │ Month    ││
│  │ ₹1,25,000    │  │ 85.5%        │  │ ₹2,45,000    │  │ ₹4,50,000││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Outstanding by Patient                                          ││
│  │ ┌──────────────────────────┬─────────┬────────────┬───────────┐││
│  │ │ Patient                  │ Amount  │ Days       │ Action    │││
│  │ ├──────────────────────────┼─────────┼────────────┼───────────┤││
│  │ │ Ramesh Patel             │ ₹12,500 │ 35         │ [Send]    │││
│  │ │ Sunita Sharma            │ ₹8,200  │ 22         │ [Send]    │││
│  │ │ Mohan Rao                │ ₹6,800  │ 15         │ [Send]    │││
│  │ └──────────────────────────┴─────────┴────────────┴───────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Revenue Trend (Last 30 Days)                                   │ │
│  │      ₹                                                         │ │
│  │  20k │     ╱╲    ╱╲                                           │ │
│  │  15k │   ╱    ╲╱    ╲   ╱╲                                    │ │
│  │  10k │ ╱              ╲╱                                      │ │
│  │      └────────────────────────────────────────────────────→   │ │
│  │        Jan 1                                      Jan 31      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Quick Actions: [Generate Invoice] [Send Reminders] [Export Excel]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Doctor / Clinical Staff

**Who:** MBBS doctor, physiotherapist, specialized care professional

**Access Level:** Clinical data for assigned patients

**Responsibilities:**
- View and manage assigned patients
- Create and edit clinical notes
- Write prescriptions
- Design and monitor care plans
- Review field staff visit reports

#### Permissions Matrix

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | ❌ | ❌ | ❌ | ❌ |
| Staff | ❌ | ✅ (assigned) | ❌ | ❌ |
| Patients | ❌ | ✅ (assigned) | ✅ (medical) | ❌ |
| Rosters | ❌ | ✅ (assigned) | ❌ | ❌ |
| Visits | ❌ | ✅ (assigned) | ❌ | ❌ |
| Clinical Notes | ✅ | ✅ | ✅ | ✅ |
| Care Plans | ✅ | ✅ | ✅ | ✅ |
| Billing | ❌ | ❌ | ❌ | ❌ |
| Payroll | ❌ | ❌ | ❌ | ❌ |
| Analytics | N/A | ✅ (clinical) | N/A | N/A |
| Settings | ❌ | ❌ | ❌ | ❌ |

#### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCTOR DASHBOARD                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ My Patients  │  │ Pending      │  │ Care Plan    │  │ Today's  ││
│  │ Today        │  │ Reviews      │  │ Compliance   │  │ Follow   ││
│  │ 8            │  │ 5            │  │ 92%          │  │ Ups: 3   ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Today's Patient Schedule                                        ││
│  │ ┌──────┬─────────────────┬──────────────┬───────────┬─────────┐││
│  │ │ Time │ Patient         │ Visit Type   │ Staff     │ Action  │││
│  │ ├──────┼─────────────────┼──────────────┼───────────┼─────────┤││
│  │ │ 9:00 │ Ramesh Patel    │ Wound Care   │ Lakshmi   │ [View]  │││
│  │ │10:30 │ Sunita Sharma   │ Physio       │ Priya     │ [View]  │││
│  │ │14:00 │ Mohan Rao       │ Elder Care   │ Kavya     │ [View]  │││
│  │ └──────┴─────────────────┴──────────────┴───────────┴─────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Recent Clinical Notes   │  │ Pending Reviews                 │  │
│  │ • Ramesh - Jan 25       │  │ ⚠️ Sunita Sharma - Vitals       │  │
│  │ • Sunita - Jan 24       │  │ ⚠️ Mohan Rao - Medication       │  │
│  │ • Mohan - Jan 24        │  │ ⚠️ Priya Singh - Care Plan      │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│                                                                      │
│  Quick Actions: [+ Clinical Note] [+ Care Plan] [Review Visits]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Receptionist

**Who:** Clinic receptionist, patient call handler, booking coordinator

**Access Level:** Patient communication and scheduling

**Responsibilities:**
- Manage patient directory
- Schedule appointments and visits
- Communicate with patients via phone/SMS/WhatsApp
- Track visit status and updates
- Handle appointment requests

#### Permissions Matrix

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | ❌ | ❌ | ❌ | ❌ |
| Staff | ❌ | ✅ (availability) | ❌ | ❌ |
| Patients | ✅ | ✅ | ✅ (contact) | ❌ |
| Rosters | ✅ (request) | ✅ | ❌ | ❌ |
| Visits | ❌ | ✅ (status) | ❌ | ❌ |
| Clinical Notes | ❌ | ❌ | ❌ | ❌ |
| Care Plans | ❌ | ❌ | ❌ | ❌ |
| Billing | ❌ | ❌ | ❌ | ❌ |
| Payroll | ❌ | ❌ | ❌ | ❌ |
| Analytics | N/A | ✅ (appointments) | N/A | N/A |
| SMS/WhatsApp | ✅ (individual) | ✅ | N/A | N/A |

#### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RECEPTIONIST DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Today's      │  │ Confirmed    │  │ Pending      │  │ Cancelled││
│  │ Visits       │  │              │  │ Confirmation │  │          ││
│  │ 24           │  │ 20           │  │ 3            │  │ 1        ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Visit Schedule                                                  ││
│  │ ┌──────┬─────────────────┬───────────┬───────────┬────────────┐││
│  │ │ Time │ Patient         │ Staff     │ Status    │ Action     │││
│  │ ├──────┼─────────────────┼───────────┼───────────┼────────────┤││
│  │ │ 9:00 │ Ramesh Patel    │ Lakshmi   │ ✅ Done   │ [View]     │││
│  │ │10:30 │ Sunita Sharma   │ Priya     │ 🔄 Ongoing│ [Track]    │││
│  │ │14:00 │ Mohan Rao       │ Kavya     │ ⏳ Pending│ [Confirm]  │││
│  │ │16:00 │ Anita Devi      │ -         │ ❓ Need   │ [Assign]   │││
│  │ └──────┴─────────────────┴───────────┴───────────┴────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Upcoming (Next 7 Days)  │  │ Patient Communication Log       │  │
│  │ Mon: 22 | Tue: 24       │  │ 📱 Ramesh - Reminder sent       │  │
│  │ Wed: 20 | Thu: 26       │  │ 📱 Sunita - Confirmed           │  │
│  │ Fri: 18 | Sat: 15       │  │ ☎️ Mohan - Called, no answer    │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│                                                                      │
│  Quick Actions: [+ New Patient] [Book Visit] [Send Reminder]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.5 Field Staff (Nurse/Attendant)

**Who:** GNM nurses, Ayahs, physiotherapists, senior care assistants

**Access Level:** Personal roster and assigned patients only

**Responsibilities:**
- View personal shift schedule
- Check-in/check-out at patient locations
- Complete care plan tasks
- Record visit notes and observations
- Upload proof photos
- View personal attendance and pay history

#### Permissions Matrix

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | ❌ | ❌ | ❌ | ❌ |
| Staff | ❌ | ✅ (self) | ❌ | ❌ |
| Patients | ❌ | ✅ (assigned) | ❌ | ❌ |
| Rosters | ❌ | ✅ (self) | ❌ | ❌ |
| Visits | ✅ | ✅ (self) | ✅ (own) | ❌ |
| Clinical Notes | ❌ | ❌ | ❌ | ❌ |
| Care Plans | ❌ | ✅ (execute) | ❌ | ❌ |
| Billing | ❌ | ❌ | ❌ | ❌ |
| Payroll | ❌ | ✅ (self) | ❌ | ❌ |
| Analytics | N/A | ✅ (self) | N/A | N/A |

#### Mobile App Screens

```
┌─────────────────────────────────────────────────┐
│                FIELD STAFF APP                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Good Morning, Lakshmi! 👋                       │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Today's Shifts                            │  │
│  │ ─────────────────────────────────────     │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │ 09:00 - 21:00                       │  │  │
│  │  │ Ramesh Patel                        │  │  │
│  │  │ 📍 123 MG Road, Bengaluru           │  │  │
│  │  │ 📋 Wound Care, Medication           │  │  │
│  │  │                                     │  │  │
│  │  │ [🟢 START VISIT]                    │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │ 22:00 - 06:00 (Tomorrow)            │  │  │
│  │  │ Sunita Sharma                       │  │  │
│  │  │ 📍 456 Jayanagar, Bengaluru         │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ This Month                                │  │
│  │ ─────────────────────────────────────     │  │
│  │ Shifts: 24  ✅ Completed: 22              │  │
│  │ Attendance: 92%                           │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🏠 Home   📅 Schedule   💰 Payroll   👤 Profile│
└─────────────────────────────────────────────────┘
```

---

## 4. Permission Codes

### 4.1 Module Permissions

```json
{
  "users": {
    "create": "users:create",
    "read": "users:read",
    "update": "users:update",
    "delete": "users:delete"
  },
  "patients": {
    "create": "patients:create",
    "read": "patients:read",
    "read_assigned": "patients:read:assigned",
    "update": "patients:update",
    "update_medical": "patients:update:medical",
    "delete": "patients:delete"
  },
  "rosters": {
    "create": "rosters:create",
    "read": "rosters:read",
    "read_self": "rosters:read:self",
    "update": "rosters:update",
    "delete": "rosters:delete"
  },
  "visits": {
    "create": "visits:create",
    "read": "visits:read",
    "read_self": "visits:read:self",
    "update_self": "visits:update:self",
    "checkin": "visits:checkin",
    "checkout": "visits:checkout"
  },
  "clinical": {
    "create": "clinical:create",
    "read": "clinical:read",
    "update": "clinical:update",
    "delete": "clinical:delete"
  },
  "billing": {
    "create": "billing:create",
    "read": "billing:read",
    "update": "billing:update",
    "delete": "billing:delete"
  },
  "payroll": {
    "read_self": "payroll:read:self",
    "read": "payroll:read",
    "create": "payroll:create",
    "approve": "payroll:approve"
  },
  "analytics": {
    "read": "analytics:read",
    "read_financial": "analytics:read:financial",
    "read_clinical": "analytics:read:clinical",
    "export": "analytics:export"
  },
  "settings": {
    "read": "settings:read",
    "update": "settings:update"
  },
  "integrations": {
    "manage": "integrations:manage",
    "read": "integrations:read"
  }
}
```

### 4.2 Default Role Permissions

```json
{
  "admin": [
    "users:*",
    "patients:*",
    "staff:*",
    "rosters:*",
    "visits:*",
    "clinical:read",
    "care_plans:*",
    "billing:*",
    "payroll:*",
    "analytics:*",
    "settings:*",
    "integrations:*"
  ],
  "finance": [
    "patients:read",
    "staff:read",
    "rosters:read",
    "visits:read",
    "billing:*",
    "payroll:*",
    "analytics:read:financial",
    "analytics:export",
    "integrations:read"
  ],
  "doctor": [
    "patients:read:assigned",
    "patients:update:medical",
    "staff:read:assigned",
    "rosters:read:assigned",
    "visits:read:assigned",
    "clinical:*",
    "care_plans:*",
    "analytics:read:clinical"
  ],
  "receptionist": [
    "patients:create",
    "patients:read",
    "patients:update:contact",
    "staff:read:availability",
    "rosters:create:request",
    "rosters:read",
    "visits:read:status",
    "notifications:send:individual"
  ],
  "nurse": [
    "patients:read:assigned",
    "rosters:read:self",
    "visits:create",
    "visits:read:self",
    "visits:update:self",
    "visits:checkin",
    "visits:checkout",
    "care_plans:read:execute",
    "payroll:read:self"
  ]
}
```

---

## 5. Access Control Implementation

### 5.1 Middleware Check

```python
# Python/FastAPI example
from fastapi import Depends, HTTPException

def require_permission(permission: str):
    async def check_permission(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission}"
            )
        return current_user
    return check_permission

@router.get("/patients")
async def list_patients(
    user: User = Depends(require_permission("patients:read"))
):
    # Only users with patients:read can access this
    pass
```

### 5.2 Frontend Route Protection

```typescript
// React example
const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission
}: {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredPermission?: string;
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

---

## 6. Custom Permissions

Admins can grant additional permissions to specific users beyond their role defaults:

```json
// User with additional permissions
{
  "id": "user-uuid",
  "role": "receptionist",
  "permissions": [
    "billing:read"  // Additional permission not in receptionist defaults
  ]
}
```

---

## 7. Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Security & Compliance](./SECURITY_COMPLIANCE.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
