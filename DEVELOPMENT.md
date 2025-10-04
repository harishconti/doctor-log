# Frontend Development Itinerary: Clinic OS Lite
This document outlines the development plan for the two client applications: the existing React Native Mobile App and the new React.js Web Dashboard.
## Part 1: Mobile App (React Native) - Enhancements Itinerary
Objective: To update the existing mobile application to support the new subscription tiers, manage trial periods, and integrate the payment flow for upgrading to the Pro plan. The core codebase in the frontend/ directory will be modified and extended.
### 1. Core Features & User Tier Implementation
#### Global State Enhancement
* Task: Update the global state management to handle detailed user subscription information.
* Implementation:
* Modify the AuthContext (frontend/contexts/AuthContext.tsx) and/or the Zustand store (frontend/store/useAppStore.ts) to store the complete user object received from the API upon login, including plan, status, and trial_ends_at.
* This state will be used throughout the app to control feature access and UI presentation.
#### Conditional UI Rendering
* Task: Implement UI changes that reflect the user's current subscription status.
* Implementation:
* Profile Screen (frontend/app/profile.tsx): Create a new component to display the user's current plan. It will show a "You have X days left in your trial" message if status === 'trialing', or a persistent "Upgrade to Pro" button if the trial is over and the plan is basic.
* Feature Locking: Wrap Pro-level features in a conditional check. For example, on the Patient Detail screen (frontend/app/patient/[id].tsx), the "Upload Document" button will be wrapped in a component that only renders if user.plan === 'pro'..tsx]
#### Payment & Upgrade Flow
* Task: Integrate a payment gateway's SDK to allow users to subscribe to the Pro plan.
* Implementation:
* New Screen (frontend/app/upgrade.tsx): Create a dedicated screen that outlines the benefits of the Pro plan.
* SDK Integration: Integrate the official React Native SDK for Stripe or Razorpay. The "Upgrade" button will trigger a call to the backend's /api/payments/create-checkout-session endpoint.
* Checkout Process: The app will use the checkout_url from the backend response to launch the payment provider's secure, native checkout flow. After payment, the user's state should be refreshed to reflect their new "Pro" status.
### New Feature Implementation
* Task: Build the UI for the new Pro features that are accessible on mobile.
* Implementation:
* Document Upload: On the Patient Detail screen, add a new section for documents. This will include a button that opens the device's file picker. Upon selection, the app will make a multipart/form-data request to a new /api/documents/upload endpoint.
* Document List: Display a list of uploaded documents for the patient, with an option to download or view them.
## Part 2: Web Dashboard (React.js) - New Build Itinerary
Objective: To build a new, secure, and data-rich web application from scratch for Pro subscribers. This will be a separate project, likely in a new dashboard/ directory.
### 1. Core Features & Architecture
#### Project Setup
* Task: Initialize a new React.js project.
* Implementation: Use create-react-app or a more advanced framework like Next.js for better performance and routing. A professional UI library like Material-UI (MUI) or Ant Design will be installed for a consistent look and feel.
#### Authentication & Pro-User Guarding
* Task: Implement a secure login flow and protect the entire dashboard from non-Pro users.
* Implementation:
* Login Page: Create a login page that sends credentials to the exact same /api/token endpoint used by the mobile app.
* Route Guarding: Implement a "protected route" mechanism. After login, the app will fetch the user's full profile. If user.plan is not 'pro', the user will be redirected to a page with instructions on how to access the dashboard, otherwise, they will be allowed to proceed.
* API Client: An Axios (or similar) instance will be configured to automatically attach the stored JWT to the Authorization header of every API request.
#### Data Analytics Dashboard
* Task: Create the main dashboard page to visualize key practice metrics.
* Implementation:
* UI Layout: Design a main dashboard view with multiple "widget" components (e.g., "New Patients This Month," "Appointments Overview").
* Charting: Integrate a charting library (e.g., Recharts, Chart.js).
* Data Fetching: Each widget will fetch its data from the corresponding /api/analytics/* endpoint. The components will handle loading and error states gracefully.
#### Advanced Patient Management
* Task: Build a comprehensive interface for managing patient records.
* Implementation:
* Patient Data Grid: Use a powerful data grid component (e.g., from MUI X or AG Grid) to display a searchable, sortable, and filterable list of all patients.
* Detailed Patient View: Create a master-detail view where selecting a patient from the grid displays their full information, a timeline of clinical notes, and a management interface for their uploaded documents.
#### Full-Featured Calendar
* Task: Implement a full-screen calendar for appointment management.
* Implementation: Integrate a dedicated calendar library (e.g., FullCalendar or Big Calendar) to display appointments. The component will fetch data from a new /api/appointments endpoint and allow for creating, dragging, and editing appointments directly on the calendar.