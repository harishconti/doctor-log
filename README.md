# Clinic OS Lite

Welcome to Clinic OS Lite, a comprehensive patient management system designed for medical professionals. This application provides a secure and efficient way to manage patient information, track medical notes, and streamline communication. The system is comprised of a FastAPI backend, a React Native mobile app, and a React.js web dashboard for Pro users.

## ✨ Core Features

### Subscription Tiers
- **Basic Plan:** Full access to the mobile app with a 90-day trial period. Includes core patient management features.
- **Pro Plan:** Unlocks advanced features, including a web-based dashboard for analytics and comprehensive data management, and document storage.

### Patient Management (All Plans)
- **Full CRUD Operations:** Create, read, update, and delete patient records.
- **Detailed Patient Profiles:** Store comprehensive patient information, including contact details and medical history.
- **Clinical Notes System:** Add and view time-stamped clinical notes for each patient.

### Pro Features
- **Web Dashboard:** A desktop-optimized interface for analytics, data visualization, and advanced patient management.
- **Secure Document Storage:** Upload and manage patient-related documents like lab reports and prescriptions.

### Professional & UX Features
- **Secure Authentication:** Robust JWT-based authentication with secure token storage for both mobile and web platforms.
- **User Data Isolation:** Each medical professional can only see and manage their own patient data.
- **Dark Mode:** Supports light, dark, and system default themes in the mobile app.
- **Search and Filter:** Easily find patients with powerful search and filtering tools.

## 🏗️ Technical Architecture

The application is built with a modern, modular architecture designed for scalability and maintainability. For a detailed overview, please see [`Architecture.md`](./Architecture.md). For the development roadmap, see [`todo.md`](./todo.md).

- **Backend:** A FastAPI application serves as the core of the system, providing a robust API for all client applications.
- **Database:** MongoDB is used as the database, accessed asynchronously via `motor`.
- **Modularity:** The backend code is organized into a clean, service-oriented structure.
- **Cross-Platform Clients:** The architecture supports a React Native mobile app and a React.js web dashboard.
- **Authentication:** JWT (JSON Web Tokens) are used for securing the API.

## 💻 Tech Stack

### Current Stack
- **Backend:** Python, FastAPI
- **Database:** MongoDB
- **Authentication:** JWT, passlib, python-jose
- **Data Validation:** Pydantic
- **Async Support:** `motor` for non-blocking database calls
- **Frontend (Mobile):** React Native, Expo, Zustand
- **Frontend (Web):** React.js (Planned)

## 🚀 Getting Started

Follow these instructions to set up the development environment.

### Prerequisites
- Python 3.9+
- MongoDB
- `pip` for package management
- Node.js and `npm` for the frontend

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Set Up the Backend Environment

**a. Install Dependencies**
Navigate to the `backend` directory and install the required Python packages:
```bash
cd backend
pip install -r requirements.txt
```

**b. Configure Environment Variables**
Create a `.env` file in the `backend` directory.
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=clinic_os_lite
SECRET_KEY=<A_VERY_SECRET_KEY>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**c. Run the Backend Server**
```bash
# From the backend/ directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Set Up the Frontend Environment

**a. Install Dependencies**
Navigate to the `frontend` directory and install the required Node.js packages:
```bash
cd frontend
npm install
```

**b. Configure Environment Variables**
Create a `.env` file in the `frontend` directory.
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

**c. Run the Frontend Development Server**
```bash
# From the frontend/ directory
npm run start
```

## 🧪 Testing

A comprehensive test suite is available to verify the functionality of the backend API.

To run the tests, first ensure the backend server is running, and then execute the following command from the root directory:
```bash
python3 backend_test.py
```

## 🧑‍⚕️ Demo Accounts

You can use the following demo accounts to test the application.

| Role                          | Email                  | Password      | Notes                               |
| ----------------------------- | ---------------------- | ------------- | ----------------------------------- |
| **Dr. Sarah Johnson (Pro)**   | `dr.sarah@clinic.com`  | `password123` | Pro Plan, 5 patients (Cardiology)   |
| **Dr. Mike Chen (Basic)**     | `dr.mike@physio.com`   | `password123` | Basic Plan, 2 patients (Physio)   |
| **New User (Trial)**          | `test.doctor@medical.com` | `TestPass123` | 90-day trial, no patients           |

## 🗺️ Project History

This project has evolved from a basic application with placeholder functionality into a feature-complete patient management system.

### Key Milestones Achieved
- **Full Patient CRUD:** Complete implementation of patient creation, editing, and management screens.
- **Robust Authentication:** Secure, cross-platform JWT authentication.
- **Phone Integration:** Google Contacts-style integration for direct calling, SMS, and caller ID.
- **Code Quality:** Significant improvements in state management (Zustand), error handling, and component reusability.
- **UI/UX:** Added dark mode, skeleton loaders, and optimistic UI updates for a more responsive feel.