# Migration Report: Web Dashboard to Webapp

## Executive Summary

This report documents the required backend integrations to migrate from `web-dashboard` to `webapp` as the primary web application.

**Status Update (January 2026):** All authentication pages have been fully integrated with the backend API. The webapp now has real API integration for login, registration, email verification, forgot password, and password reset flows.

**Migration Status:** The webapp is nearly complete but has several remaining features that need implementation before the web-dashboard can be fully deprecated.

---

## Remaining Features (Before Web-Dashboard Deprecation)

### Critical Missing Features

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| **Patient Edit Form** | HIGH | ❌ Missing | Can only create patients, cannot edit existing |
| **Upgrade/Payment Page** | HIGH | ❌ Missing | No Stripe checkout, no plan comparison table |
| **Pro Plan Feature Gating** | HIGH | ❌ Missing | Analytics visible to all users without restrictions |
| **Full Clinical Notes View** | MEDIUM | ❌ Missing | No paginated notes list in patient detail |

### UI/UX Gaps

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| **Loading Skeleton States** | MEDIUM | ❌ Missing | No skeleton loaders during data fetch |
| **Favorite Toggle in Patient List** | MEDIUM | ⚠️ Partial | API ready, button not visible in list |
| **Multiple Chart Types** | LOW | ❌ Missing | Only line charts (missing Bar, Pie) |

### Partially Implemented (UI Not Wired)

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Photo Upload | ⚠️ API ready | Not integrated into ProfilePage UI |
| Activity History | ⚠️ API ready | Not displayed in Profile |
| 2FA Setup | ⚠️ API available | UI not functional |

### Testing Gap

| Type | Status | Notes |
|------|--------|-------|
| Unit Tests | ❌ 0 tests | Web-dashboard has 8 test files |
| Component Tests | ❌ None | Need Vitest + RTL setup |

---

## Current State Analysis

### Webapp (New Frontend)
- **Location**: `frontend/webapp/`
- **Framework**: React with Vite
- **Styling**: TailwindCSS
- **State**: Zustand (authStore) for authentication, local React state for UI
- **API Integration**: ✅ Full authentication flow integrated
- **AI Features**: Gemini integration for patient summaries
- **Auth**: ✅ JWT with token refresh, OTP verification (fully implemented)

### Web-Dashboard (Current Production)
- **Location**: `frontend/web-dashboard/`
- **Framework**: React with Vite
- **Styling**: TailwindCSS with shadcn/ui
- **State**: Zustand (authStore)
- **API Integration**: Full backend integration
- **Auth**: JWT with token refresh, OTP verification

---

## 1. Authentication Pages

### 1.1 Login Screen ✅ COMPLETED

**File**: `components/LoginScreen.tsx`

**Status**: ✅ Fully integrated with backend API

**Implementation Details**:
- Real API call using `authApi.login()` with OAuth2 form encoding
- Proper error handling for 401 (invalid credentials), 403 (unverified email), 429 (rate limit)
- Automatic redirect to OTP verification on 403
- Token storage in sessionStorage via Zustand authStore
- Email normalization (lowercase, trim)
- Server connection error handling

**Implemented Features**:
- [x] Input validation (email format, password required)
- [x] Error message display for invalid credentials
- [x] Account lockout notification (after 5 failed attempts - 429 handling)
- [x] Redirect to OTP page if email not verified
- [ ] Remember email option (optional - not implemented)
- [ ] Google/Microsoft OAuth (UI exists but non-functional)

---

### 1.2 Create Account Screen ✅ COMPLETED

**File**: `components/CreateAccountScreen.tsx`

**Status**: ✅ Fully integrated with backend API

**Implementation Details**:
- Real API call using `authApi.register()`
- Full password strength validation with 5 requirements (12+ chars, uppercase, lowercase, digit, special char)
- Visual strength indicator with color-coded bars
- Proper error handling for 409 (email exists), 422 (validation)
- Stores pending email for OTP verification
- Server connection error handling

**Implemented Features**:
- [ ] Add phone number field (optional - not implemented)
- [ ] Add medical specialty dropdown (optional - not implemented)
- [x] Password strength indicator (like web-dashboard)
- [x] Password requirements display (12+ chars, etc.)
- [x] Handle 409 Conflict (email already exists)
- [x] Redirect to OTP verification on success
- [ ] Google/Microsoft OAuth (UI exists but non-functional)

---

### 1.3 Forgot Password Screen ✅ COMPLETED

**File**: `components/ForgotPasswordScreen.tsx`

**Status**: ✅ Fully integrated with backend API

**Implementation Details**:
- Real API call using `authApi.forgotPassword()`
- Shows success even on errors to prevent email enumeration (security best practice)
- Rate limit error handling (429 status)
- Email validation before submission
- Server connection error handling

**Implemented Features**:
- [x] API integration
- [x] Rate limit error handling (429)
- [x] Security: Shows success to prevent email enumeration
- [ ] Resend functionality with cooldown (using form resubmit)

---

### 1.4 Email Verification Screen (OTP) ✅ COMPLETED

**File**: `components/VerifyEmailScreen.tsx`

**Status**: ✅ Fully integrated with backend API

**Implementation Details**:
- Real API calls using `authApi.verifyOtp()` and `authApi.resendOtp()`
- 6-digit OTP input with auto-focus and auto-advance
- Paste support for OTP codes
- 60-second resend cooldown with countdown timer
- Token storage on successful verification
- Error handling for 400 (invalid/expired), 429 (rate limit)
- Email masking display

**Implemented Features**:
- [x] 6-digit OTP input with auto-focus
- [x] Numeric-only validation
- [x] Paste support for OTP codes
- [x] Auto-advance to next input on entry
- [x] Backspace navigation between inputs
- [x] Loading state animation
- [x] API integration for OTP verification
- [x] Resend functionality with 60s cooldown timer
- [x] Display email address being verified (masked)
- [x] Error handling for invalid/expired OTP
- [x] Rate limit error handling

---

### 1.5 Reset Password Screen ✅ COMPLETED

**File**: `components/ResetPasswordScreen.tsx`

**Status**: ✅ Fully integrated with backend API

**Implementation Details**:
- Real API call using `authApi.resetPassword()`
- Full password strength validation with 5 requirements (same as registration)
- Visual strength indicator with color-coded bars
- Token extraction from URL query params or prop
- Error handling for 400/404 (invalid/expired token), 429 (rate limit)
- Success state with auto-redirect to login
- Password match validation with visual feedback

**Implemented Features**:
- [x] New password input with show/hide toggle
- [x] Confirm password input with show/hide toggle
- [x] Password match validation with visual feedback
- [x] Loading state animation
- [x] Back to login navigation
- [x] API integration for password reset
- [x] Extract reset token from URL query parameters
- [x] Password strength indicator (like web-dashboard)
- [x] Password requirements display
- [x] Handle 400/404 for invalid/expired token
- [x] Success state with auto-redirect

---

## 2. API Client Infrastructure ✅ COMPLETED

### 2.1 API Client Module ✅ COMPLETED

**File**: `lib/client.ts`

**Status**: ✅ Fully implemented

**Implemented Features**:
- [x] Axios instance with base URL configuration
- [x] Request interceptor for Bearer token
- [x] Response interceptor for 401 handling
- [x] Automatic token refresh with mutex pattern
- [x] Token manager utility (get/set/clear/validate)
- [x] sessionStorage for token persistence
- [x] JWT expiration validation
- [x] Custom event dispatch on auth failure

---

### 2.2 Auth API Module ✅ COMPLETED

**File**: `lib/auth.ts`

**Status**: ✅ Fully implemented

**Implemented API Methods**:
```typescript
export const authApi = {
  login(data: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<{ message: string; user_id: string }>;
  verifyOtp(email: string, otp: string): Promise<AuthResponse>;
  resendOtp(email: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
  getCurrentUser(): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  logout(): Promise<void>;
};
```

---

## 3. State Management ✅ COMPLETED

### 3.1 Auth Store ✅ COMPLETED

**File**: `store/authStore.ts`

**Status**: ✅ Fully implemented with Zustand

**Implemented Interface**:
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingVerificationEmail: string | null;

  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setPendingVerificationEmail: (email: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
}
```

**Features**:
- Token storage in sessionStorage via tokenManager
- Pending verification email tracking for OTP flow
- User state persistence

---

## 4. Patients Page

**File**: `components/PatientsPage.tsx`

**Current State**: Mock data from constants
```typescript
// Line 186: Uses MOCK_PATIENTS
{MOCK_PATIENTS.map((patient) => (
  <PatientListItem ... />
))}
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Data Source | `MOCK_PATIENTS` constant | `GET /api/patients/` |
| Pagination | UI only (fake pages) | Real pagination with API |
| Search | UI only | API search with query params |
| Filters | UI only | API filtering (group, favorites) |
| Stats | Hardcoded (145, 12, 24, 8) | `GET /api/patients/stats/` |
| Create | UI button only | Modal + `POST /api/patients/` |
| Delete | None | `DELETE /api/patients/:id` |

**Backend Endpoints**:
```typescript
GET  /api/patients/?search=&group=&is_favorite=&page=&page_size=&sort_by=&sort_order=
GET  /api/patients/:id
POST /api/patients/
PUT  /api/patients/:id
DELETE /api/patients/:id
GET  /api/patients/stats/
GET  /api/patients/groups/
```

**New Features Needed**:
- [ ] Patients API module (`webapp/api/patients.ts`)
- [ ] Replace mock data with API calls
- [ ] Loading states during API fetches
- [ ] Error handling and retry logic
- [ ] Real search with debouncing
- [ ] Real pagination
- [ ] Filter tabs (All, Favorites, Critical, Department)
- [ ] Create patient modal/page
- [ ] Delete confirmation

---

## 4.1 Register Patient Page

**File**: `components/RegisterPatientPage.tsx`

**Status**: ✅ UI Implemented (Mock)

**Current State**: Form submission logs to console only
```typescript
// Lines 40-43: Mock patient registration
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(formData);  // Currently just passes data to parent
};
```

**Implemented Features**:
- ✅ Full patient registration form with styled inputs
- ✅ Personal info fields (Full Name, Gender, Age)
- ✅ Contact info fields (Phone, Email)
- ✅ Location dropdown
- ✅ Medical Group Category dropdown
- ✅ Emergency contact section (Name, Phone)
- ✅ Reason for visit textarea (optional)
- ✅ Back navigation to Patients list
- ✅ Favorite star toggle (UI only)

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| fullName | text | Yes |
| gender | select (Male/Female/Other) | Yes |
| age | number | Yes |
| phone | tel | Yes |
| email | email | No |
| location | select | Yes |
| category | select (Medical Group) | Yes |
| emergencyName | text | Yes |
| emergencyPhone | tel | Yes |
| reason | textarea | No |

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /api/patients/` |
| Field Mapping | Local field names | Map to backend schema (name, year_of_birth, etc.) |
| Validation | Basic HTML5 | Zod/custom validation |
| Photo Upload | None | `POST /api/patients/:id/photo` |
| Success Feedback | Navigate back | Toast notification + navigate |
| Error Handling | None | Handle validation errors, duplicates |

**Backend Endpoint**: `POST /api/patients/`
```typescript
// Request: application/json
// Body: {
//   name: string,
//   phone?: string,
//   email?: string,
//   location?: string,
//   group?: string,
//   year_of_birth?: number,
//   gender?: 'male' | 'female' | 'other',
//   initial_complaint?: string
// }
// Response: Patient object
```

**New Features Needed**:
- [ ] API integration for patient creation
- [ ] Map form fields to backend schema
- [ ] Validation with error messages
- [ ] Success toast notification
- [ ] Patient photo upload
- [ ] Favorite toggle API integration

---

## 5. Analytics Page

**File**: `components/AnalyticsPage.tsx`

**Current State**: Hardcoded mock data
```typescript
// Lines 27-40: Hardcoded data
const GROWTH_DATA = [
  { name: 'WEEK 1', newPatients: 30, returning: 15 },
  // ...
];
const TREATMENTS_DATA = [
  { name: 'Physiotherapy...', dept: 'ORTHOPEDICS', count: 128, ... },
  // ...
];
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Patient Growth | Hardcoded | `GET /api/analytics/patient-growth` |
| Notes Activity | None | `GET /api/analytics/notes-activity` |
| Weekly Activity | None | `GET /api/analytics/weekly-activity` |
| Demographics | None | `GET /api/analytics/demographics` |
| Export | UI only | `GET /api/analytics/export` (blob) |
| Time Range | Hardcoded "Last 30 Days" | Dynamic with query params |

**Backend Endpoints**:
```typescript
GET /api/analytics/patient-growth?days=30
GET /api/analytics/notes-activity?days=30
GET /api/analytics/weekly-activity
GET /api/analytics/demographics
GET /api/analytics/export (returns CSV blob)
```

**New Features Needed**:
- [ ] Analytics API module (`webapp/api/analytics.ts`)
- [ ] Replace hardcoded data with API calls
- [ ] Date range selector functionality
- [ ] Export to CSV functionality
- [ ] Loading states for charts

---

## 6. Profile Page

**File**: `components/ProfilePage.tsx`

**Current State**: Completely hardcoded
```typescript
// Lines 101-129: Hardcoded profile data
<p className="text-base font-bold text-gray-900">Dr. Alexander James Smith</p>
<p className="text-base font-bold text-gray-900">MED-883421-NY</p>
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| User Data | Hardcoded | `GET /api/users/me` or from auth store |
| Edit Profile | UI button only | `PUT /api/users/me` |
| Change Password | UI only | `POST /api/users/me/password` |
| Activity History | Hardcoded | API (if endpoint exists) |

**Backend Endpoints**:
```typescript
GET  /api/users/me
PUT  /api/users/me        // { full_name?, phone?, medical_specialty? }
POST /api/users/me/password // { current_password, new_password }
```

**New Features Needed**:
- [ ] User API module (`webapp/api/user.ts`)
- [ ] Fetch profile from API on mount
- [ ] Edit profile modal/form
- [ ] Change password modal with validation
- [ ] Notification preferences (if backend supports)

---

## 7. Settings Page

**File**: `components/SettingsPage.tsx`

**Current State**: Local state only, no persistence
```typescript
// Lines 40-48: Local state
const [notifications, setNotifications] = useState({
  email: true,
  desktop: true,
  critical: true
});
const [is2FAEnabled, setIs2FAEnabled] = useState(false);
const [theme, setTheme] = useState('light');
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Email Display | Hardcoded | From auth store |
| Language/Timezone | UI only | Backend if supported, else localStorage |
| Change Password | UI only | `POST /api/users/me/password` |
| 2FA Toggle | UI only | Backend if implemented |
| Notifications | Local state | Backend or localStorage |
| Theme | Local state | localStorage or user preferences |
| Save Button | UI only | API call to save settings |

**New Features Needed**:
- [ ] Connect to auth store for email display
- [ ] Change password integration (same as Profile)
- [ ] localStorage for theme preference
- [ ] Actual notification settings (if backend supports)
- [ ] 2FA integration (if backend supports)

---

## 8. Dashboard Layout & Logout

**File**: `components/DashboardLayout.tsx`

**Current State**: Mock logout
```typescript
// App.tsx lines 320-324
const handleLogout = () => {
  setAuth({ isAuthenticated: false, user: null });
  setCurrentView(ViewState.DASHBOARD);
  setAuthView('LOGIN');
};
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| User Display | Hardcoded "Dr. Alexander Smith" | From auth store |
| Logout | Just clears state | Call `POST /api/auth/logout` + clear tokens |
| Notifications | UI only | Real notifications (if endpoint exists) |

**Backend Endpoint**: `POST /api/auth/logout`

**New Features Needed**:
- [ ] Connect user info to auth store
- [ ] Real logout with token revocation
- [ ] Clear sessionStorage on logout

---

## 9. Types & Interfaces (UPDATE)

**File**: `types.ts`

**Current State**: Basic types with ViewState enum
```typescript
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
  status: 'Critical' | 'Stable' | 'Recovering';
  notes: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  REGISTER_PATIENT = 'REGISTER_PATIENT',  // ✅ NEW
  ANALYTICS = 'ANALYTICS',
  AI_SCRIBE = 'AI_SCRIBE',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}
```

**Required Changes**: Align with backend models

```typescript
// User type to match backend
export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  medical_specialty?: string;
  plan: 'basic' | 'pro';
  role: 'doctor' | 'admin';
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due';
  subscription_end_date?: string;
  is_verified: boolean;
  is_beta_tester: boolean;
  created_at: string;
  updated_at: string;
}

// Patient type to match backend
export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  initial_complaint?: string;
  initial_diagnosis?: string;
  photo?: string;
  group?: string;
  is_favorite: boolean;
  year_of_birth?: number;
  gender?: 'male' | 'female' | 'other';
  active_treatment_plan?: string;
  created_at: string;
  updated_at: string;
}

// Add new types
export interface ClinicalNote { ... }
export interface LoginRequest { ... }
export interface RegisterRequest { ... }
export interface AuthResponse { ... }
export interface PaginatedResponse<T> { ... }
```

---

## 10. New Files to Create

### Required New Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/client.ts` | Axios instance, token management, interceptors | ✅ Created |
| `lib/auth.ts` | Auth API functions | ✅ Created |
| `api/patients.ts` | Patients API functions | ✅ Created |
| `api/analytics.ts` | Analytics API functions | ✅ Created |
| `api/user.ts` | User profile API functions | ✅ Created |
| `api/index.ts` | Export all API modules | ✅ Created |
| `store/authStore.ts` | Zustand auth state management | ✅ Created |
| `store/themeStore.ts` | Theme persistence with localStorage | ✅ Created |
| `utils/logger.ts` | Console logging utility | ✅ Created |

### Authentication Files (Fully Integrated)

| File | Purpose | Status |
|------|---------|--------|
| `components/LoginScreen.tsx` | Login page | ✅ API integrated |
| `components/CreateAccountScreen.tsx` | Registration page | ✅ API integrated |
| `components/VerifyEmailScreen.tsx` | OTP/Email verification page | ✅ API integrated |
| `components/ForgotPasswordScreen.tsx` | Forgot password page | ✅ API integrated |
| `components/ResetPasswordScreen.tsx` | Reset password page | ✅ API integrated |
| `components/RegisterPatientPage.tsx` | New patient registration form | ✅ API integrated |
| `components/PatientsPage.tsx` | Patient list with search/filter | ✅ API integrated |
| `services/geminiService.ts` | Gemini AI integration for summaries | ✅ Functional |

### Dependencies Added

```json
{
  "dependencies": {
    "axios": "^1.x",      // ✅ Added
    "zustand": "^4.x"     // ✅ Added
  }
}
```

---

## 11. Security Considerations

### Token Storage
- Use `sessionStorage` (not localStorage) for tokens
- Tokens clear on tab/browser close
- Consider HttpOnly cookies for production (requires backend changes)

### Password Requirements
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

### Rate Limiting (Backend Enforced)
- Login: Limited per IP
- Registration: Limited per IP
- OTP Verification: 5 attempts per email per 15 minutes
- Forgot Password: 5/10min, 10/day per IP; 3/hour, 5/day per email

### Account Lockout
- 5 failed login attempts = 30-minute lockout
- Lockout cleared on successful login

---

## 12. Implementation Priority

### Phase 1: Core Authentication ✅ COMPLETED
1. ✅ API Client infrastructure (`lib/client.ts`)
2. ✅ Auth Store (Zustand) (`store/authStore.ts`)
3. ✅ Login page with API
4. ✅ OTP Verification page
5. ✅ Logout functionality

### Phase 2: Registration & Password Reset ✅ COMPLETED
6. ✅ Create Account with API
7. ✅ Forgot Password with API
8. ✅ Reset Password page

### Phase 3: Patient Management ✅ COMPLETED
9. ✅ Patients API integration (`api/patients.ts`)
10. ✅ Patient list with real data (PatientsPage.tsx updated)
11. ✅ Patient CRUD operations (create with RegisterPatientPage.tsx)
12. ✅ Patient Card AI summary (already works with Gemini)

### Phase 4: Analytics & Profile ✅ COMPLETED
13. ✅ Analytics API integration (AnalyticsPage.tsx updated)
14. ✅ Profile page with user data (ProfilePage.tsx uses auth store)
15. ✅ Edit profile functionality (Edit Profile Modal with API + photo upload)
16. ✅ Change password functionality (ProfilePage + SettingsPage)

### Phase 5: Settings & Polish ✅ COMPLETED
17. ✅ Settings persistence (auth store used for email, password change works)
18. ✅ Theme persistence (localStorage with Zustand persist middleware)
19. ✅ Notification preferences (API integration with save functionality)
20. ✅ Loading states (added to all pages)
21. ✅ Edit Profile Modal (full API integration with photo upload)

### Phase 6: Feature Parity (Required for Web-Dashboard Deprecation) ❌ PENDING

22. ❌ Patient Edit Form
23. ❌ Upgrade/Payment Page with Stripe
24. ❌ Pro Plan Feature Gating
25. ❌ Full Clinical Notes Management
26. ❌ Loading Skeleton States
27. ❌ Test Suite Setup

---

## 13. Phase 6 Implementation Details

### 13.1 Patient Edit Form ❌ NOT IMPLEMENTED

**Required Files**:
- `components/EditPatientPage.tsx` (new)

**Current Gap**:
- `RegisterPatientPage.tsx` only creates new patients
- No way to edit existing patient information

**Implementation Requirements**:

| Feature | Description |
|---------|-------------|
| Edit Button | Add to PatientCard and patient list items |
| Pre-populate Form | Load existing patient data into form |
| API Integration | `PUT /api/patients/:id` |
| Field Mapping | Same fields as RegisterPatientPage |
| Navigation | Add `EDIT_PATIENT` to ViewState enum |

**Backend Endpoint**: `PUT /api/patients/:id`
```typescript
// Request body same as POST /api/patients/
{
  name?: string,
  phone?: string,
  email?: string,
  location?: string,
  group?: string,
  year_of_birth?: number,
  gender?: 'male' | 'female' | 'other',
  initial_complaint?: string
}
```

**Tasks**:
- [ ] Create `EditPatientPage.tsx` component
- [ ] Add `EDIT_PATIENT` to ViewState enum
- [ ] Add edit button to PatientCard
- [ ] Add edit button to patient list items
- [ ] Pre-populate form with patient data
- [ ] Handle form submission with PUT request
- [ ] Add success/error notifications

---

### 13.2 Upgrade/Payment Page ❌ NOT IMPLEMENTED

**Required Files**:
- `components/UpgradePage.tsx` (new)

**Current Gap**:
- No payment/subscription management
- All users have access to all features

**Implementation Requirements**:

| Feature | Description |
|---------|-------------|
| Plan Comparison | Table showing Basic vs Pro features |
| Current Plan | Display user's current plan from auth store |
| Stripe Integration | Create checkout session |
| Pro Badge | Crown icon for Pro users in sidebar |
| Upgrade CTA | Button in navigation for Basic users |

**Backend Endpoint**: `POST /api/payments/create-checkout-session`
```typescript
// Request
{ plan: 'pro' }

// Response
{ checkout_url: string }
```

**Plan Comparison Features (from web-dashboard)**:
| Feature | Basic | Pro |
|---------|-------|-----|
| Patient Management | ✅ | ✅ |
| Clinical Notes | ✅ | ✅ |
| AI Summaries | Limited | ✅ Unlimited |
| Analytics Dashboard | ❌ | ✅ |
| Data Export | ❌ | ✅ |
| Priority Support | ❌ | ✅ |
| Custom Reports | ❌ | ✅ |
| Team Collaboration | ❌ | ✅ |
| API Access | ❌ | ✅ |

**Tasks**:
- [ ] Create `UpgradePage.tsx` component
- [ ] Add `UPGRADE` to ViewState enum
- [ ] Build plan comparison table
- [ ] Add Stripe checkout integration
- [ ] Add upgrade button to sidebar (for Basic users)
- [ ] Add Pro badge/crown icon for Pro users
- [ ] Handle successful upgrade redirect

---

### 13.3 Pro Plan Feature Gating ❌ NOT IMPLEMENTED

**Current Gap**:
- Analytics page accessible to all users
- No visual differentiation between plan tiers

**Implementation Requirements**:

| Feature | Description |
|---------|-------------|
| Plan Check | Read `user.plan` from auth store |
| Gate Analytics | Show upgrade prompt for Basic users |
| Visual Indicators | Lock icons on Pro-only features |
| Upgrade Prompts | CTA buttons leading to Upgrade page |

**Gating Logic**:
```typescript
// In AnalyticsPage.tsx
const { user } = useAuthStore();

if (user?.plan !== 'pro') {
  return <UpgradePrompt feature="Analytics Dashboard" />;
}
```

**Tasks**:
- [ ] Create `UpgradePrompt.tsx` component
- [ ] Add plan check to AnalyticsPage
- [ ] Add lock icons to gated features in sidebar
- [ ] Add upgrade CTA in gated areas

---

### 13.4 Full Clinical Notes View ❌ NOT IMPLEMENTED

**Current Gap**:
- PatientCard only shows single notes field
- No paginated notes list
- No note creation UI

**Implementation Requirements**:

| Feature | Description |
|---------|-------------|
| Notes List | Paginated list in patient detail |
| Create Note | Modal/form for new notes |
| Visit Types | Regular, Follow-up, Emergency |
| Pagination | 20 notes per page |

**Backend Endpoints**:
```typescript
// Get notes
GET /api/patients/:id/notes?page=1&page_size=20

// Create note
POST /api/patients/:id/notes
{
  content: string,
  visit_type: 'regular' | 'follow_up' | 'emergency'
}
```

**Note Interface**:
```typescript
interface ClinicalNote {
  id: string;
  patient_id: string;
  content: string;
  visit_type: 'regular' | 'follow_up' | 'emergency';
  created_at: string;
  updated_at: string;
}
```

**Tasks**:
- [ ] Create `ClinicalNotesList.tsx` component
- [ ] Create `CreateNoteModal.tsx` component
- [ ] Add notes tab/section to PatientCard
- [ ] Implement pagination for notes
- [ ] Add visit type selector
- [ ] Integrate with notes API endpoints

---

### 13.5 Loading Skeleton States ❌ NOT IMPLEMENTED

**Current Gap**:
- Pages show blank or loading spinner
- No skeleton placeholders during data fetch

**Implementation Requirements**:

| Page | Skeleton Elements |
|------|-------------------|
| Dashboard | KPI cards, charts, activity list |
| Patients | Patient list items, stats cards |
| Analytics | Chart placeholders, stats |
| Profile | User info card, activity timeline |

**Tasks**:
- [ ] Create reusable `Skeleton.tsx` component
- [ ] Add skeleton to DashboardPage
- [ ] Add skeleton to PatientsPage
- [ ] Add skeleton to AnalyticsPage
- [ ] Add skeleton to ProfilePage

---

### 13.6 Test Suite Setup ❌ NOT IMPLEMENTED

**Current Gap**:
- 0 test files in webapp
- Web-dashboard has 8 test files

**Implementation Requirements**:

| Type | Files Needed |
|------|--------------|
| Config | `vitest.config.ts`, `setupTests.ts` |
| Unit Tests | Auth store, API modules |
| Component Tests | LoginScreen, PatientCard, etc. |
| Integration | Auth flow, patient CRUD |

**Tasks**:
- [ ] Configure Vitest with React Testing Library
- [ ] Create test setup file
- [ ] Add auth store tests
- [ ] Add LoginScreen tests
- [ ] Add PatientsPage tests
- [ ] Add at least 80% coverage for critical paths

---

## 14. Comparison: Webapp vs Web-Dashboard

| Feature | Webapp | Web-Dashboard | Status |
|---------|--------|---------------|--------|
| **Authentication** | | | |
| Login | ✅ Full API | ✅ Full | Parity |
| Registration | ✅ Full API | ✅ Full | Parity |
| OTP Verification | ✅ Full API | ✅ Full | Parity |
| Forgot Password | ✅ Full API | ✅ Full | Parity |
| Reset Password | ✅ Full API | ✅ Full | Parity |
| Token Refresh | ✅ Full | ✅ Full | Parity |
| OAuth (Google/Microsoft) | ❌ UI Only | ❌ UI Only | Both Missing |
| **Patient Management** | | | |
| Patient List | ✅ Full API | ✅ Full | Parity |
| Patient Create | ✅ Full API | ✅ Full | Parity |
| Patient Edit | ❌ Missing | ✅ Full | **Gap** |
| Patient Delete | ✅ Full API | ✅ Full | Parity |
| Favorite Toggle | ⚠️ API Only | ✅ Full UI | **Gap** |
| **Clinical Notes** | | | |
| View Notes | ⚠️ Limited | ✅ Full List | **Gap** |
| Create Note | ⚠️ API Ready | ✅ Full | **Gap** |
| Notes Pagination | ❌ Missing | ✅ Yes | **Gap** |
| **Analytics** | | | |
| Analytics Page | ✅ Full API | ✅ Full | Parity |
| Date Range | ✅ Yes | ✅ Yes | Parity |
| Export CSV | ✅ Yes | ✅ Yes | Parity |
| Pro Plan Gating | ❌ Missing | ✅ Yes | **Gap** |
| Chart Types | ⚠️ Line Only | ✅ Line/Bar/Pie | **Gap** |
| **Profile & Settings** | | | |
| Profile View | ✅ Full | ✅ Full | Parity |
| Edit Profile | ✅ Modal | ✅ Full | Parity |
| Change Password | ✅ Full | ✅ Full | Parity |
| Photo Upload | ⚠️ API Ready | ✅ Full UI | **Gap** |
| Activity History | ⚠️ API Ready | ✅ Displayed | **Gap** |
| Theme Persistence | ✅ localStorage | ❌ No | Webapp Better |
| Notifications | ✅ API | ❌ No | Webapp Better |
| 2FA Setup | ⚠️ API Ready | ❌ No | Webapp Better |
| **Payments** | | | |
| Upgrade Page | ❌ Missing | ✅ Full | **Gap** |
| Stripe Integration | ❌ Missing | ✅ Yes | **Gap** |
| Plan Display | ❌ Missing | ✅ Crown Badge | **Gap** |
| **AI Features** | | | |
| AI Summary | ✅ Gemini | ❌ No | Webapp Only |
| Clinical Analysis | ✅ Yes | ❌ No | Webapp Only |
| **UX** | | | |
| Loading Skeletons | ❌ Missing | ✅ Yes | **Gap** |
| URL Deep Linking | ❌ ViewState | ✅ React Router | Different Approach |
| **Testing** | | | |
| Test Suite | ❌ 0 tests | ✅ 8 files | **Gap** |

### Summary: Features Webapp Has That Web-Dashboard Doesn't
- ✅ Theme persistence (Light/Dark/System with localStorage)
- ✅ Gemini AI integration for patient summaries
- ✅ Notification preferences API
- ✅ 2FA setup API (endpoints available)
- ✅ Treatment statistics in analytics
- ✅ Combined analytics endpoint (more optimized)

---

## 15. API Endpoints Summary

### Authentication
```
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
```

### Patients
```
GET    /api/patients/
GET    /api/patients/:id
POST   /api/patients/
PUT    /api/patients/:id
DELETE /api/patients/:id
GET    /api/patients/stats/
GET    /api/patients/groups/
GET    /api/patients/:id/notes
POST   /api/patients/:id/notes
```

### Analytics
```
GET /api/analytics/patient-growth?days=30
GET /api/analytics/notes-activity?days=30
GET /api/analytics/weekly-activity
GET /api/analytics/demographics
GET /api/analytics/export
```

### User
```
GET  /api/users/me
PUT  /api/users/me
POST /api/users/me/password
```

### Payments (Optional)
```
POST /api/payments/create-checkout-session
```

---

## 16. Environment Configuration

### Required Environment Variables
```env
VITE_API_URL=/api          # or full URL for production
VITE_APP_NAME=HealLog
```

### Vite Config Updates
```typescript
// vite.config.ts - add proxy for development
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Conclusion

The webapp has a solid UI foundation matching the web-dashboard design. Core authentication and patient management features are fully functional.

### Completed Components ✅
- ✅ `LoginScreen.tsx` - Full API integration with error handling
- ✅ `CreateAccountScreen.tsx` - Full API integration with password strength validation
- ✅ `VerifyEmailScreen.tsx` - OTP/Email verification with resend functionality
- ✅ `ForgotPasswordScreen.tsx` - Full API integration with security best practices
- ✅ `ResetPasswordScreen.tsx` - Full API integration with password strength validation
- ✅ `lib/client.ts` - Axios client with token refresh and mutex pattern
- ✅ `lib/auth.ts` - Auth API module with all endpoints
- ✅ `store/authStore.ts` - Zustand state management
- ✅ `store/themeStore.ts` - Theme persistence with localStorage (light/dark/system)
- ✅ `geminiService.ts` - AI-powered patient summaries (functional)
- ✅ `api/patients.ts` - Patients API module with full CRUD operations
- ✅ `api/user.ts` - User profile API module
- ✅ `api/analytics.ts` - Analytics API module
- ✅ `api/index.ts` - Centralized API exports
- ✅ `PatientsPage.tsx` - Full API integration with search, pagination, and filters
- ✅ `RegisterPatientPage.tsx` - Full API integration with validation
- ✅ `AnalyticsPage.tsx` - Full API integration with date range, export, loading states
- ✅ `ProfilePage.tsx` - Auth store integration, edit profile modal, change password modal
- ✅ `SettingsPage.tsx` - Theme persistence, notification API, change password

### Components Needing Implementation ❌
- ❌ `EditPatientPage.tsx` - Patient edit form (critical)
- ❌ `UpgradePage.tsx` - Stripe payment integration (critical)
- ❌ `UpgradePrompt.tsx` - Pro plan gating component (critical)
- ❌ `ClinicalNotesList.tsx` - Full notes management (critical)
- ❌ `CreateNoteModal.tsx` - Note creation UI
- ❌ `Skeleton.tsx` - Loading skeleton components
- ❌ Test files - Unit and integration tests

### Remaining Work

#### Critical (Must Complete Before Deprecating Web-Dashboard)

1. **Patient Edit Form** ❌
   - Create `EditPatientPage.tsx` component
   - Add edit button to PatientCard and patient list
   - Implement `PUT /api/patients/:id` integration
   - Pre-populate form with existing patient data
   - Handle validation and error states

2. **Upgrade/Payment Page** ❌
   - Create `UpgradePage.tsx` component
   - Add plan comparison table (Basic vs Pro features)
   - Integrate Stripe checkout via `POST /api/payments/create-checkout-session`
   - Display current plan status with crown badge for Pro users
   - Add upgrade CTA in sidebar/navigation

3. **Pro Plan Feature Gating** ❌
   - Check user's `plan` field from auth store
   - Gate analytics page behind Pro plan
   - Show upgrade prompt for Basic users
   - Add visual indicators for Pro-only features

4. **Full Clinical Notes View** ❌
   - Create notes list component in patient detail view
   - Implement pagination (20 notes per page)
   - Add create note modal/form
   - Support visit types (regular/follow-up/emergency)
   - Integrate with `GET /api/patients/:id/notes` and `POST /api/patients/:id/notes`

#### Medium Priority

5. **Loading Skeleton States** ❌
   - Add skeleton components for Dashboard, Patients, Analytics pages
   - Show during initial data fetch

6. **Favorite Toggle in Patient List** ⚠️
   - Add visible favorite star button to patient list items
   - Connect to existing `POST /api/patients/:id/favorite` API

7. **Profile Photo Upload UI** ⚠️
   - Wire photo upload to ProfilePage
   - Show current photo or placeholder
   - Allow photo change via file picker

8. **Activity History Display** ⚠️
   - Show user activity timeline in ProfilePage
   - Use `GET /api/users/me/activity` endpoint

#### Low Priority

9. **Multiple Chart Types** ❌
   - Add Bar chart support for demographics
   - Add Pie chart for category breakdowns

10. **Test Suite** ❌
    - Configure Vitest with React Testing Library
    - Add unit tests for critical components
    - Add integration tests for auth flow

11. **Optional**: Google/Microsoft OAuth (UI exists, needs backend support)

**Updated Status**: Phases 1-5 complete for core features. Phase 6 (Feature Parity) must be completed before web-dashboard can be deprecated.

### Migration Readiness Checklist

Before deprecating web-dashboard, ensure:

- [ ] Patient Edit Form implemented and tested
- [ ] Upgrade/Payment Page with Stripe integration
- [ ] Pro Plan feature gating (especially Analytics)
- [ ] Full Clinical Notes view with pagination
- [ ] Loading skeleton states for better UX
- [ ] Favorite toggle visible in patient list
- [ ] Profile photo upload wired to UI
- [ ] Activity history displayed in Profile
- [ ] Minimum test coverage (recommend 80% for critical paths)
- [ ] End-to-end testing of all user flows

**Estimated Remaining Work**: 4 critical components, 6 medium priority items
