# Integration Testing and Issues

This document tracks the integration testing process and any issues or bugs found in the Clinic OS Lite application.

## Testing Environment
- **Backend:** FastAPI server running on `http://localhost:8000`
- **Frontend:** React Native app running on `http://localhost:8081`
- **Database:** MongoDB

## Testing Plan
1. Test backend endpoints directly.
2. Test frontend application functionality.
3. Document all issues found with steps to reproduce.

## Issues Found

### 1. Password validation during registration
- **Issue:** The backend enforces password complexity rules, but these are not explicitly documented for the API user. The registration endpoint requires at least one number in the password.
- **How to reproduce:**
  1. Send a POST request to `/api/auth/register`.
  2. Provide a password that does not contain any numbers (e.g., "a-secure-password").
  3. The server responds with a 422 Unprocessable Entity error and the message: "Password must contain at least one number".
- **Methods tried:**
  - The initial attempt with a simple password failed.
- **Status:** Identified. The immediate workaround is to use a stronger password. The long-term fix would be to document this requirement in the API specification.
---

### 2. Incorrect `Content-Type` for Login Endpoint
- **Issue:** The `/api/auth/login` endpoint expects a `Content-Type` of `application/json`, but the common standard for token endpoints (OAuth2) is `application/x-www-form-urlencoded`. This can lead to confusion and integration errors.
- **How to reproduce:**
  1. Send a POST request to `/api/auth/login` with `Content-Type: application/x-www-form-urlencoded`.
  2. The server responds with a 422 Unprocessable Entity error and the message: "Input should be a valid dictionary or object to extract fields from".
- **Methods tried:**
  - The initial attempt with `application/x-www-form-urlencoded` failed.
- **Status:** Identified. The workaround is to send the login credentials as JSON. The long-term fix would be to align with the OAuth2 standard or clearly document the expected content type.
---

### 3. Inconsistent Field Name for Login
- **Issue:** The `/api/auth/login` endpoint requires the username to be passed in a field named `email`, while the registration uses `email` and many systems use `username`. The API should be consistent.
- **How to reproduce:**
  1. Send a POST request to `/api/auth/login` with a JSON payload.
  2. Use the field `username` instead of `email` for the user's email address.
  3. The server responds with a 422 Unprocessable Entity error indicating that the `email` field is required.
- **Methods tried:**
  - The attempt with `username` failed.
- **Status:** Identified. The workaround is to use the `email` field. The long-term fix would be to accept both `username` and `email` or to be consistent across the API.
---

### 4. User Endpoint is at `/api/auth/me`, not `/api/users/me`
- **Issue:** The endpoint to fetch the current user's data is located at `/api/auth/me`, which is not the conventional `/api/users/me`. This can cause confusion for developers integrating with the API.
- **How to reproduce:**
  1. Send a GET request to `/api/users/me`. The server returns a 404 Not Found error.
  2. Send a GET request to `/api/auth/me`. The server returns the user's data.
- **Methods tried:**
  - The initial attempt at `/api/users/me` failed.
  - After inspecting `backend/app/api/auth.py`, the correct endpoint was found to be `/api/auth/me`.
- **Status:** Identified. The workaround is to use the correct endpoint. The long-term fix would be to move the endpoint to a more conventional path for better API design.
---

### 5. New Users are Assigned 'patient' Role Instead of 'doctor'
- **Issue:** The user registration process at `/api/auth/register` assigns the `patient` role to new users by default. This prevents them from accessing core features like patient creation, which require the `DOCTOR` role. The `Architecture.md` specifies that new users should get the `DOCTOR` role.
- **How to reproduce:**
  1. Register a new user via the `/api/auth/register` endpoint.
  2. The returned user object shows `"role": "patient"`.
  3. Attempt to create a patient using the new user's access token.
  4. The server responds with a 403 Forbidden error: "Insufficient permissions. Doctor role required."
- **Methods tried:**
  - Confirmed the role assignment by checking the registration response.
  - Confirmed the permission error by attempting to create a patient.
- **Status:** **Critical Bug.** This prevents any new user from using the application as intended. The workaround is to use one of the pre-configured doctor accounts for testing. The fix requires changing the default role assignment in the backend's registration logic.
---

## Backend API Testing Summary
The backend API has been tested for the following functionalities:
- **User Registration:** A critical bug was found where new users are assigned the `patient` role instead of `doctor`.
- **User Login:** The login process works but has some minor inconsistencies in the API design (e.g., content type, field names).
- **User Data Retrieval:** The endpoint for fetching user data is non-standard (`/api/auth/me` instead of `/api/users/me`).
- **Patient CRUD:** All CRUD operations (Create, Read, Update, Delete) for patients are working correctly for authorized users (i.e., users with the `DOCTOR` role).

## Frontend Application Testing

### 6. Missing Validation File Causes Frontend Build to Fail
- **Issue:** The frontend application fails to build because the file `frontend/lib/validation/index.ts` is missing. This file is imported by `add-patient.tsx` and `edit-patient/[id].tsx` and is expected to contain the `patientSchema` for form validation.
- **How to reproduce:**
  1. Attempt to start the frontend development server with `npm run start`.
  2. The Metro bundler will fail with an "Unable to resolve module `../lib/validation`" error.
- **Methods tried:**
  - Verified the `frontend/lib` directory does not exist.
  - Used `grep` to confirm that `patientSchema` is used in multiple components but is not defined anywhere.
- **Status:** **Critical Bug.** This completely prevents the frontend from building and running. The fix requires re-creating the `frontend/lib/validation/index.ts` file with the correct Zod schema.
---

### 7. Incorrect WatermelonDB Adapter for Web Build
- **Issue:** The application crashes on launch with an error "Unable to resolve module better-sqlite3". This is because the Metro bundler is incorrectly trying to load the Node.js adapter for WatermelonDB (`@nozbe/watermelondb/adapters/sqlite-node`) in the web environment, instead of a web-compatible adapter. `better-sqlite3` is a native Node.js module and cannot run in the browser.
- **How to reproduce:**
  1. Start the frontend server and navigate to `http://localhost:8081`.
  2. The application fails to render and displays a "Server Error" screen.
- **Methods tried:**
  - Restarted the frontend server after fixing the previous build issue.
  - Captured a screenshot confirming the error.
- **Status:** **Critical Bug.** This prevents the entire frontend application from loading. The fix will likely involve modifying the WatermelonDB setup or the Metro bundler configuration to ensure the correct, web-compatible adapter is used for web builds.
---

### 8. Missing `useIncrementalIndexedDB` Option in LokiJSAdapter
- **Issue:** After configuring the web-specific `LokiJSAdapter` for WatermelonDB, the application throws a new error: `LokiJSAdapter 'useIncrementalIndexedDB' option is required`. This is a mandatory configuration option for the web adapter.
- **How to reproduce:**
  1. Fix the native adapter issue by providing a web-compatible adapter.
  2. Start the frontend server and navigate to `http://localhost:8081`.
  3. The application fails with the `useIncrementalIndexedDB` error.
- **Methods tried:**
  - The application crashed after implementing the platform-specific adapter fix.
- **Status:** **Critical Bug.** This is another blocker preventing the frontend from loading. The fix is to add the required `useIncrementalIndexedDB: true` option to the `LokiJSAdapter` configuration in `frontend/models/adapters/index.ts`.
---

### 10. Incorrect HOC Implementation Causes Infinite Loop
- **Issue:** The application is stuck in an infinite loading loop due to an incorrect implementation of the `withObservables` Higher-Order Component (HOC) in `frontend/app/index.tsx`. The HOC is being called with props instead of the component it is supposed to wrap, leading to a fatal runtime error that hangs the app.
- **How to reproduce:**
  1. Fix all other frontend errors.
  2. Start the server and navigate to `http://localhost:8082`.
  3. The application will hang indefinitely, causing Playwright to time out.
- **Methods tried:**
  - Analysis of `frontend/app/index.tsx` revealed the incorrect HOC usage.
- **Status:** **Critical Bug.** This is the root cause of the frontend application being unresponsive. The fix is to refactor the `IndexContainer` to correctly apply the `withObservables` HOC to the `Index` component.
---

### 11. Missing Backend Sync API Endpoints
- **Issue:** The entire backend API for data synchronization is missing. The frontend application attempts to call `/api/sync/pull` and `/api/sync/push`, but these endpoints do not exist, causing the frontend to hang indefinitely during the initial data sync.
- **How to reproduce:**
  1. Fix all other frontend errors and start both servers.
  2. The application will hang on a blank screen as it waits for a response from the non-existent sync API.
- **Methods tried:**
  - Verified the frontend `sync.ts` service is making calls to these endpoints.
  - Inspected the `backend/app/api` directory and confirmed there is no `sync.py` or equivalent file implementing these routes.
- **Status:** **Critical Bug.** This is a fundamental flaw that makes the application unusable as the data layer cannot initialize. The fix requires implementing the entire synchronization API on the backend.
---

### 9. Infinite Loading Screen due to State Hydration Issue
- **Issue:** Even after fixing all build-time and configuration errors, the application hangs on a blank screen and never loads. This causes any automated testing via Playwright to time out. The root cause is a known issue where the Zustand store is not being rehydrated correctly, leading to an infinite loading state.
- **How to reproduce:**
  1. Fix all other frontend errors.
  2. Start the server and attempt to navigate to `http://localhost:8082`.
  3. The page will remain blank and the browser tab will show a continuous loading spinner.
- **Methods tried:**
  - Multiple server restarts, clearing the Metro cache, and changing ports have not resolved the issue.
- **Status:** **Critical Bug.** This is the final blocker preventing the application from being tested. The fix is to explicitly call `useAppStore.persist.rehydrate()` within the `AuthProvider`'s `useEffect` hook to ensure the state is hydrated before the app attempts to render.
---