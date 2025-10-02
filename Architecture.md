Technical Architecture & Implementation Document: Clinic OS Lite
Version: 1.0 Date: October 2, 2025
Objective: This document outlines the complete technical architecture, data models, and core workflows for the "Clinic OS Lite" application. It serves as the primary guide for the development team to build, deploy, and scale the platform, incorporating the two-tier subscription model (Basic with Trial, and Pro).


Of course. Here is a detailed elaboration of the High-Level System Architecture section, suitable for a technical team document.

1. High-Level System Architecture
1.1. Architectural Overview
The "Clinic OS Lite" application is designed as a decoupled, three-tier architecture composed of two distinct client applications, a central backend service, and a set of managed cloud services. This model promotes separation of concerns, allowing for independent development, deployment, and scaling of each component.
The core of the system is the FastAPI backend, which serves as the single source of truth and handles all business logic. It communicates with two types of clients: a React Native mobile application for all users and a React.js web dashboard exclusively for Pro subscribers. Data persistence, file storage, and payment processing are offloaded to specialized, managed third-party services to reduce operational overhead and leverage their expertise in scalability and security.
1.2. Architectural Diagram
Code snippet

graph TD
    subgraph "Clients (User-Facing Layer)"
        A[<b>Android App (React Native)</b><br><i>Target: All Users (Basic & Pro)</i><br>Handles core patient management and on-the-go tasks.]
        B[<b>Web Dashboard (React.js)</b><br><i>Target: Pro Users Only</i><br>Provides advanced analytics, data management, and a desktop-optimized experience.]
    end
subgraph "Backend Service (Application Layer)"
        C{<b>FastAPI Backend API on Google Cloud Run</b><br><i>Central Business Logic</i><br>Stateless REST API handling authentication, data processing, and external service integration.}
    end
subgraph "Managed Services (Data & Infrastructure Layer)"
        D[<b>MongoDB Atlas</b><br><i>Primary Datastore</i><br>NoSQL database for flexible and scalable storage of user and patient data.]
        E[<b>Payment Gateway (e.g., Stripe)</b><br><i>Subscription Management</i><br>Handles secure payment processing and subscription lifecycle events via webhooks.]
        F[<b>Google Cloud Storage</b><br><i>File Storage (Pro Feature)</i><br>Stores user-uploaded documents like lab reports and prescriptions securely.]
    end
A -- "REST API Calls over HTTPS (JWT for Auth)" --> C
    B -- "REST API Calls over HTTPS (JWT for Auth)" --> C
    C -- "Database Operations (Motor Driver)" --> D
    C -- "Webhooks & API Calls" --> E
    C -- "Secure File Operations (SDK)" --> F
1.3. Architectural Principles & Rationale
The architecture is founded on the following principles, derived from the project's requirements:
    • Stateless Backend: The FastAPI application is designed to be completely stateless. It does not store any session information between requests. All necessary state is either contained within the JWT provided by the client or retrieved from the database on-demand. This is a critical design choice that enables seamless horizontal scaling. New instances of the backend container can be spun up or down by the hosting platform (Google Cloud Run) without impacting user sessions.
    • Secure by Design:
        ○ Transport Layer Security: All communication between clients and the backend is enforced over HTTPS to encrypt data in transit.
        ○ Authentication: User identity is verified using JSON Web Tokens (JWTs). The mobile and web clients receive a short-lived access token upon successful login, which must be included in the Authorization header of all subsequent requests to protected endpoints.
        ○ Authorization: The backend implements Role-Based Access Control (RBAC) at the API level. Pro-only endpoints are protected by a dependency that inspects the user's subscription plan within the JWT or a database lookup, ensuring that Basic users cannot access premium features.
    • Scalability & Cost-Effectiveness:
        ○ Serverless Compute: Deploying the containerized backend on Google Cloud Run aligns with the need for a production-grade ASGI server that can handle variable traffic efficiently. This provides automatic scaling (including scaling down to zero when there is no traffic) and eliminates the need for manual server management.
        ○ Managed Services: Offloading the database to MongoDB Atlas and file storage to Google Cloud Storage leverages their specialized infrastructure for high availability, automated backups, and security. This allows the development team to focus on application features rather than infrastructure maintenance.
1.4. Data and Communication Flow
All interactions follow a standard client-server RESTful pattern.
    1. A user action on either the React Native or React.js client initiates an HTTPS request to the FastAPI backend.
    2. The request includes a JWT Bearer token in its Authorization header for all protected resources.
    3. The backend API receives the request, authenticates the JWT, and authorizes the user's access based on their subscription plan.
    4. The relevant service layer in the backend processes the request. This may involve:
        ○ Performing CRUD (Create, Read, Update, Delete) operations on the MongoDB Atlas database.
        ○ Interacting with the Payment Gateway's API to create a checkout session.
        ○ Uploading or generating a secure download URL for a file in Google Cloud Storage.
    5. The backend then formats a JSON response and sends it back to the client.
    6. The client receives the response and updates its UI accordingly.
    7. For asynchronous events, such as a successful payment, the Payment Gateway sends a webhook to a dedicated endpoint on the backend, which then updates the user's subscription status in the database.


Of course. Here is a detailed elaboration of the Component Breakdown section for your technical architecture document.

2. Component Breakdown
This section provides a detailed description of each primary component in the "Clinic OS Lite" architecture, outlining its role, core technologies, and key implementation responsibilities.
2.1. Backend Service (FastAPI)
Role:
The backend is the centralized brain and single source of truth for the entire application. It is responsible for all business logic, data persistence, user authentication and authorization, and secure communication with third-party services. It serves a RESTful API consumed by both the mobile and web clients.
Core Technologies:
    • Framework: Python 3.9+ with FastAPI, chosen for its high performance, asynchronous capabilities, and automatic API documentation generation.
    • Data Validation: Pydantic is used for data validation, settings management, and defining clear, type-hinted data schemas for API requests and responses.
    • Database Interaction: Asynchronous communication with MongoDB Atlas is handled by Motor, ensuring non-blocking database operations that complement FastAPI's async nature.
    • Authentication: JWTs (JSON Web Tokens) are generated and verified using python-jose and passlib for password hashing, forming the basis of the secure, token-based authentication system.
    • Deployment: The application will be containerized using Docker and deployed on Google Cloud Run, running on a production-grade ASGI server like Gunicorn with Uvicorn workers.
Key Implementation Tasks:
    1. Extend Data Models & Schemas:
        ○ Modify the User model in backend/app/models/user.py to include plan, status, and trial_ends_at fields.
        ○ Create new Pydantic models and schemas for ClinicalNote, Document, and Appointment.
    2. Implement Role-Based Access Control (RBAC):
        ○ Create a new FastAPI dependency (e.g., get_pro_user) that verifies the user's JWT and checks if their plan is "pro" and status is "active". This will be used to protect all Pro-tier API endpoints.
    3. Develop New API Endpoints:
        ○ Build CRUD endpoints for the new models (e.g., /patients/{id}/notes, /documents).
        ○ Create a dedicated router for /analytics that serves aggregated data for the web dashboard (e.g., /analytics/patient-growth). These endpoints must be protected by the RBAC dependency.
    4. Integrate Payment Gateway:
        ○ Create an endpoint (e.g., /payments/create-checkout-session) that communicates with the Stripe/Razorpay API to initiate a subscription.
        ○ Develop a secure webhook endpoint (e.g., /webhooks/stripe) to receive and process subscription status updates from the payment provider.
2.2. Mobile Client (React Native)
Role:
The mobile app is the primary, on-the-go interface for all users (both Basic and Pro). It is optimized for a mobile-first experience, focusing on core daily tasks such as managing patient information, scheduling, and note-taking.
Core Technologies:
    • Framework: React Native with Expo, enabling rapid development and a single codebase for Android.
    • State Management: Zustand is used for simple and effective global state management, particularly for user authentication status and patient lists. The existing AuthContext will be enhanced to hold detailed subscription information.
    • Navigation: Expo Router is used for file-based routing and navigation within the app.
Key Implementation Tasks:
    1. Enhance Global State:
        ○ Update the authentication state (in AuthContext or Zustand store) to include the full user object, containing plan, status, and trial_ends_at. This data should be fetched and stored upon successful login.
    2. Conditional UI Rendering:
        ○ Implement logic throughout the app to conditionally render UI components based on the user's plan. For example:
            § The profile screen (frontend/app/profile.tsx) will display trial status or an "Upgrade" button.
            § The patient detail screen (frontend/app/patient/[id].tsx) will only show the "Upload Document" button if user.plan === 'pro'.
    3. Payment Flow Integration:
        ○ Integrate the chosen payment provider's official React Native SDK.
        ○ Create a new "Upgrade" screen that uses the SDK to launch the secure checkout flow, triggered from the profile or feature-lock prompts.
2.3. Web Client (React.js Dashboard)
Role:
The web dashboard is a premium, Pro-exclusive interface designed for desktop use. It provides a broader, more analytical view of the practice, focusing on data visualization, comprehensive record management, and administrative tasks that are less suited to a small mobile screen.
Core Technologies:
    • Framework: React.js (or a framework like Next.js for performance and potential future static/server-rendered pages).
    • UI Components: A robust component library like Material-UI (MUI) or Ant Design will be used to build a professional and consistent interface quickly.
    • Data Visualization: A charting library such as Recharts or Chart.js will be integrated to render the analytics data fetched from the backend.
    • State Management: A scalable state management solution like Redux Toolkit or React Query will be used to manage API data, caching, and application state.
Key Implementation Tasks:
    1. Build from Scratch: This is a new, separate frontend project.
    2. Shared Authentication Logic:
        ○ Implement a login flow that authenticates against the exact same /token endpoint as the mobile app.
        ○ Securely store the JWT (e.g., in an HttpOnly cookie or local storage) and create an API client instance (e.g., using Axios) that automatically attaches the token to all outgoing requests.
    3. Develop Dashboard Components:
        ○ Create a main layout with a navigation sidebar and a content area.
        ○ Build data-driven components for analytics visualizations, a detailed patient data grid with search/filtering, and a full-page calendar view.
    4. API Integration:
        ○ Connect the UI components to the backend API, specifically targeting the protected /analytics, /documents, and other Pro-feature endpoints. Implement robust loading and error states for all data-fetching operations.





Of course. Here is a detailed elaboration of the Data Models (MongoDB Schema) section for your technical architecture document.

3. Data Models (MongoDB Schema)
3.1. Overview
This section defines the logical structure of the data that will be stored in the MongoDB Atlas database. While MongoDB is a schemaless database, our application will enforce a consistent and predictable structure for all documents within each collection at the application layer. This is achieved through Pydantic models, which serve as the single source of truth for data shapes, validation, and serialization throughout the backend.
The data is organized into several collections, each representing a distinct entity within the "Clinic OS Lite" domain. Relationships between collections are maintained using ObjectId references, functioning as foreign keys.
3.2. users Collection
This collection is the cornerstone of the application, storing information about the medical professionals who use the service. It is central to authentication, authorization, and subscription management.
    • Pydantic Model: backend/app/models/user.py (to be modified)
    • Schema Definition:
JSON

{
  "_id": "ObjectId", // Auto-generated unique identifier
  "username": "String", // Doctor's full name
  "email": "String (Unique, Indexed)", // Primary login identifier and communication email
  "hashed_password": "String", // Securely hashed password using passlib
  "plan": "String (Enum: 'basic', 'pro')", // The user's current subscription plan
  "status": "String (Enum: 'trialing', 'active', 'inactive')", // The lifecycle status of the subscription
  "trial_ends_at": "ISODate", // Timestamp for when the 3-month trial period expires. Null for non-trialing users.
  "created_at": "ISODate" // Timestamp of user registration
}
    • Field Descriptions & Rationale:
        ○ email: This field will have a unique index to prevent duplicate accounts and ensure fast lookups during login.
        ○ plan & status: These two fields work together to manage user access. For example, a user can have plan: 'basic' and status: 'trialing'. After payment, this changes to plan: 'pro' and status: 'active'. If a trial expires without payment, the status becomes inactive.
        ○ trial_ends_at: A concrete timestamp is used to manage the trial period accurately. A scheduled task or a check at login can be used to update the user's status when this date is passed.
3.3. patients Collection
This collection stores the demographic and contact information for each patient associated with a specific user (doctor). It is based on the existing patient.py model.
    • Pydantic Model: backend/app/models/patient.py
    • Schema Definition:
JSON

{
  "_id": "ObjectId",
  "user_id": "ObjectId (Indexed)", // Foreign key linking to the `users` collection
  "name": "String",
  "phone_number": "String",
  "address": "String",
  "notes": "String", // General, non-clinical notes about the patient
  "created_at": "ISODate"
}
    • Field Descriptions & Rationale:
        ○ user_id: This is the most critical field for data multi-tenancy. It ensures that a doctor can only ever access their own patients. A database index on this field is essential for performant queries that fetch all patients for a given user.
3.4. clinical_notes Collection (New)
This new collection is designed to store an unlimited number of timestamped, clinical entries for each patient visit or interaction. This separates encounter-specific information from the general patient profile.
    • Pydantic Model: backend/app/models/clinical_note.py (to be created)
    • Schema Definition:
JSON

{
  "_id": "ObjectId",
  "patient_id": "ObjectId (Indexed)", // Foreign key to the `patients` collection
  "user_id": "ObjectId (Indexed)", // Foreign key to the `users` collection for ownership verification
  "content": "String", // The text content of the clinical note
  "created_at": "ISODate" // Timestamp of the note, crucial for chronological display
}
    • Field Descriptions & Rationale:
        ○ patient_id: An index on this field will allow for rapid retrieval of all notes for a specific patient, which will be displayed in their timeline.
        ○ user_id: While redundant if we always query through a patient, including user_id adds a layer of security, ensuring a note can never be accidentally orphaned or accessed by the wrong user.
3.5. documents Collection (New, Pro Feature)
This collection stores metadata about files uploaded by Pro users, such as lab reports or prescriptions. It does not store the files themselves; it stores pointers to the files in a dedicated object storage service (Google Cloud Storage).
    • Pydantic Model: backend/app/models/document.py (to be created)
    • Schema Definition:
JSON

{
  "_id": "ObjectId",
  "patient_id": "ObjectId (Indexed)", // Foreign key to the `patients` collection
  "user_id": "ObjectId (Indexed)", // Foreign key to the `users` collection
  "file_name": "String", // The original name of the uploaded file (e.g., "blood_report_jan.pdf")
  "storage_key": "String", // The unique path/key of the file in Google Cloud Storage
  "content_type": "String", // The MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
  "size_bytes": "Number", // The size of the file in bytes
  "uploaded_at": "ISODate" // Timestamp of the file upload
}
    • Field Descriptions & Rationale:
        ○ storage_key: This is the critical link to the actual file in Google Cloud Storage. It is used by the backend to generate secure, time-limited download URLs for the client. Storing only metadata in the database is more efficient and secure than storing binary file data.




Of course. Here is a detailed elaboration of the Core Workflows & Data Flow section for your technical architecture document.

4. Core Workflows & Data Flow
4.1. Overview
This section describes the primary interaction sequences and data flows within the "Clinic OS Lite" application. These workflows illustrate how the various components—clients, backend, and managed services—collaborate to deliver key features. The diagrams below use the sequence diagram format to show the step-by-step process for critical user journeys.
4.2. User Registration & Trial Activation Flow
This is the first interaction a new user has with the system. The goal is to create a new user account and automatically activate their 3-month trial of the Basic plan.
Sequence Diagram:
Code snippet

sequenceDiagram
    participant Client as Mobile App
    participant Server as FastAPI Backend
    participant DB as MongoDB
Client->>Server: 1. POST /api/users/register (username, email, password)
    Server->>Server: 2. Validate input & hash password
    Server->>DB: 3. INSERT INTO users (..., plan: 'basic', status: 'trialing', trial_ends_at: NOW() + 90 days)
    DB-->>Server: 4. Return created user document
    Server->>Server: 5. Generate JWT for the new user
    Server-->>Client: 6. 201 Created (user data + JWT)
Step-by-Step Elaboration:
    1. Initiation (Client): The user fills out the registration form in the React Native app (frontend/app/register.tsx) and submits it. The app sends a POST request to the backend's registration endpoint.
    2. Processing (Server): The FastAPI backend receives the request. The user_service.py validates the incoming data (using Pydantic schemas) and securely hashes the user's password using passlib.
    3. Database Insertion (Server -> DB): The service creates a new user document. Crucially, it sets the default values: plan is set to 'basic', status is set to 'trialing', and trial_ends_at is calculated as the current UTC timestamp plus 90 days. This document is then inserted into the users collection in MongoDB.
    4. Confirmation (DB -> Server): MongoDB confirms the successful creation and returns the newly created user document, including its unique _id.
    5. Token Generation (Server): The authentication service (backend/app/api/auth.py) generates a JWT access token for the new user. The token's payload includes the user_id and may also include the plan and status for efficient access control.
    6. Response (Server -> Client): The server sends a 201 Created response back to the mobile app, containing the new user's data (excluding the password) and the JWT. The client stores this token securely and navigates the user to the main part of the application.
4.3. Subscription Upgrade Flow
This workflow details the critical process of a user converting from a Basic (or trial) plan to a paid Pro plan. It involves the client, the backend, and the external payment gateway.
Sequence Diagram:
Code snippet

sequenceDiagram
    participant Client as Mobile App
    participant Server as FastAPI Backend
    participant PaymentGW as Payment Gateway
    participant DB as MongoDB
Client->>Server: 1. POST /api/payments/create-session (with JWT)
    Server->>PaymentGW: 2. Create payment session (with user_id in metadata)
    PaymentGW-->>Server: 3. Return session_id and checkout_url
    Server-->>Client: 4. Respond with checkout_url
    Client->>PaymentGW: 5. User completes payment on secure page
%% Asynchronous Webhook Notification %%
    PaymentGW->>Server: 6. POST /api/webhooks/payment-status (event: 'payment_successful')
    Server->>Server: 7. Verify webhook signature
    Server->>DB: 8. Find user by user_id and UPDATE SET plan='pro', status='active'
    DB-->>Server: 9. Confirm update
    Server-->>PaymentGW: 10. 200 OK
Step-by-Step Elaboration:
    1. Initiation (Client): A user in the mobile app clicks an "Upgrade to Pro" button. The app sends an authenticated request to the backend to start the payment process.
    2. Session Creation (Server -> PaymentGW): The backend receives the request, identifies the user via their JWT, and makes a server-to-server API call to the payment gateway (e.g., Stripe) to create a new checkout session. It crucially includes the user's internal _id in the session's metadata.
    3. Session Response (PaymentGW -> Server): The payment gateway creates the session and returns a unique session_id and a secure checkout_url.
    4. Redirection (Server -> Client): The backend sends the checkout_url back to the mobile client.
    5. Payment (Client -> PaymentGW): The client uses the payment gateway's SDK to present the secure checkout page to the user. The user enters their payment details directly on the gateway's interface; no sensitive payment data ever touches the backend server.
    6. Webhook (PaymentGW -> Server): After the payment is successfully processed, the payment gateway sends an asynchronous webhook (a POST request) to a pre-configured endpoint on the backend (e.g., /api/webhooks/payment-status). This event payload contains all the details of the transaction, including the user_id from the metadata.
    7. Verification (Server): The backend receives the webhook. Its first and most important step is to cryptographically verify the webhook's signature to ensure it genuinely came from the payment gateway and was not forged.
    8. Database Update (Server -> DB): Once verified, the backend extracts the user_id from the webhook payload. It then updates the corresponding user document in the MongoDB users collection, setting plan to 'pro' and status to 'active'.
    9. Confirmation (DB -> Server): The database confirms that the update was successful.
    10. Acknowledgement (Server -> PaymentGW): The backend sends a 200 OK status code back to the payment gateway to acknowledge successful receipt of the webhook.
4.4. Pro-Feature Access Control Flow
This workflow demonstrates how the system protects a Pro-only feature, such as the analytics data for the web dashboard.
Sequence Diagram:
Code snippet

sequenceDiagram
    participant Client as Web Dashboard
    participant Server as FastAPI Backend
    participant DB as MongoDB
Client->>Server: 1. GET /api/analytics/patient-growth (Header: 'Authorization: Bearer <JWT>')
    
    Server->>Server: 2. **Dependency: get_pro_user()**
    Server->>Server: 3. Decode JWT, extract user_id, plan, status
    alt User Plan is 'pro' AND Status is 'active'
        Server->>Server: 4a. Proceed with request logic
        Server->>DB: 5a. Aggregate data from `patients` collection WHERE user_id matches
        DB-->>Server: 6a. Return analytics data
        Server-->>Client: 7a. 200 OK (with JSON payload)
    else User Plan is not 'pro' OR Status is not 'active'
        Server-->>Client: 4b. **403 Forbidden**
    end
Step-by-Step Elaboration:
    1. Request (Client): A logged-in Pro user navigates to the analytics page on the web dashboard. The React.js application sends a GET request to /api/analytics/patient-growth, including the user's JWT in the Authorization header.
    2. Dependency Injection (Server): The FastAPI endpoint is decorated with a dependency (e.g., @app.get("/analytics/...", dependencies=[Depends(get_pro_user)])). This function runs before the main endpoint logic.
    3. Authentication & Authorization (Server): The get_pro_user dependency automatically decodes the JWT, extracts the user's identity and subscription details. It then checks if the user's plan is 'pro' and their status is 'active'.
    4. Access Control Decision (Server):
        ○ 4a. (Access Granted): If the conditions are met, the dependency successfully completes, and execution is passed to the main endpoint function.
        ○ 4b. (Access Denied): If the user is not a paying Pro member, the dependency immediately raises an HTTPException, and the server returns a 403 Forbidden error to the client. The main endpoint logic is never executed.
    5. Data Processing (Server -> DB): For an authorized user, the endpoint proceeds. It queries the patients collection in MongoDB, using an aggregation pipeline to group patients by their creation date for the specified user_id.
    6. Data Retrieval (DB -> Server): MongoDB performs the aggregation and returns the calculated analytics data.
    7. Response (Server -> Client): The server serializes the data into a JSON response and sends it back to the web dashboard with a 200 OK status. The client then uses this data to render the charts.




