# Project Roadmap: Clinic OS Lite

This document outlines the development status and future roadmap for all components of the Clinic OS Lite application. It serves as the single source of truth for tracking progress toward the beta release and beyond.

---

## 1. Mobile App (React Native)

### ✅ Completed Features

- **Core Subscription & Auth:**
  - [x] Enhanced global state (Zustand) to store user's subscription plan, status, and trial end date.
  - [x] Login process correctly populates subscription state from the backend.
- **Conditional UI:**
  - [x] Profile screen displays the user's current plan and trial status.
  - [x] Pro-level features are visually locked for Basic/Trial users.
  - [x] UI elements like "Upgrade" buttons are displayed conditionally.
- **Payment Integration:**
  - [x] A dedicated "Upgrade" screen outlines Pro plan benefits.
  - [x] The checkout flow is implemented, calling the backend to create a secure checkout session.

### ⏳ Pending Features

- **Document Management (Pro Feature):**
  - [ ] Implement the document upload UI on the patient detail screen.
  - [ ] Implement a view to list, download, and manage a patient's uploaded documents.
- **General Improvements:**
  - [ ] **Offline Support:** Implement robust offline data management (e.g., using WatermelonDB or Realm) to ensure the app is usable without a constant internet connection.
  - [ ] **Input Validation:** Add comprehensive client-side validation to all user input fields.
  - [ ] **UI/UX:** Add haptic feedback and more advanced loading states.

---

## 2. Web Dashboard (React.js) - *New Build*

This is a new, Pro-exclusive application to be built from scratch.

### ⏳ Pending Features

- **Core Architecture:**
  - [ ] Set up a new React.js project (e.g., with Next.js).
  - [ ] Implement shared authentication logic to connect to the existing backend.
  - [ ] Implement a "Pro User" route guard to protect the entire dashboard.
- **Feature Development:**
  - [ ] **Analytics Dashboard:** Develop components to visualize key practice metrics from the `/api/analytics` endpoints.
  - [ ] **Advanced Patient Management:** Build a comprehensive data grid (e.g., MUI X, AG Grid) for searching, sorting, and filtering patients.
  - [ ] **Appointment Calendar:** Implement a full-featured calendar for appointment management using a library like FullCalendar.

---

## 3. Backend (FastAPI)

### ✅ Completed Features

- **Core APIs:**
  - [x] User Authentication and Registration.
  - [x] Patient and Clinical Note Management (CRUD).
- **Subscription & Payments:**
  - [x] Payment gateway integration for creating checkout sessions.
  - [x] Webhook endpoint to handle payment status updates.
- **Pro-Tier APIs:**
  - [x] API endpoints for `Documents` and `Analytics` are implemented and protected.

### ⏳ Pending Features

- **Core Functionality:**
  - [ ] **RBAC:** Finalize and polish Role-Based Access Control.
  - [ ] **Appointments:** Develop API endpoints for appointment management.
  - [ ] **Image Storage:** Integrate with a cloud storage service (e.g., AWS S3, Cloudinary) for document files.
- **Infrastructure & Quality:**
  - [ ] **Rate Limiting:** Implement rate limiting with `slowapi` to prevent abuse.
  - [ ] **Server-Side Validation:** Enhance server-side validation logic (e.g., using Zod via a Python port or more detailed Pydantic validators).

---

## 4. General / Cross-Cutting Concerns

- [ ] **Error Handling:** Integrate a monitoring service like Sentry or Firebase Crashlytics across both frontend and backend.
- [ ] **Performance:** Conduct performance analysis and implement optimizations like code splitting.
- [ ] **Accessibility:** Enhance accessibility to meet standard guidelines (WCAG).