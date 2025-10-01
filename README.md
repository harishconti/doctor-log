# Medical Contacts API & Application

Welcome to the Medical Contacts application, a comprehensive patient management system designed for medical professionals. This application provides a secure and efficient way to manage patient information, track medical notes, and streamline communication. The system is comprised of a FastAPI backend and is designed to support a mobile application (and a future web dashboard).

## ✨ Core Features

This application is a feature-complete patient management system.

### Patient Management
- **Full CRUD Operations:** Create, read, update, and delete patient records.
- **Detailed Patient Profiles:** Store comprehensive patient information, including photos, contact details, and medical history.
- **Medical Notes System:** Add and view time-stamped medical notes for each visit, with selectable visit types (e.g., initial, follow-up, emergency).
- **Photo Management:** Capture patient photos using the camera or select from a gallery, with support for updates and removal.
- **Auto-incrementing Patient IDs:** Automatically assign unique patient IDs (e.g., PAT001, PAT002).

### Communication & Integration
- **Google Contacts-Style Phone Integration:**
    - **Direct Dialing & SMS:** Tap to call or message patients directly from the app.
    - **Contact Sync:** Sync patient contact information to your device for caller ID.
- **Email Integration:** Send emails to patients using pre-defined templates.

### Professional & UX Features
- **Secure Authentication:** Robust JWT-based authentication with secure token storage for both mobile and web platforms.
- **User Data Isolation:** Each medical professional can only see and manage their own patient data.
- **Dark Mode:** Supports light, dark, and system default themes.
- **Offline Support:** Basic offline support with plans for more robust offline-first capabilities.
- **Search and Filter:** Easily find patients with powerful search and filtering tools.

## 🏗️ Technical Architecture

The application is built with a modern, modular architecture designed for scalability and maintainability.

- **Backend:** A FastAPI application serves as the core of the system, providing a robust API for all client applications.
- **Database:** MongoDB is used as the database, accessed asynchronously via `motor`.
- **Modularity:** The backend code is organized into a clean, service-oriented structure:
    - `api/`: API endpoints (routers).
    - `services/`: Business logic.
    - `db/`: Database interaction logic.
    - `models/` & `schemas/`: Pydantic models for data validation and structure.
- **Cross-Platform Support:** The architecture is designed to support both a mobile application (React Native) and a future web-based dashboard from a single backend.
- **Authentication:** JWT (JSON Web Tokens) are used for securing the API, with a token refresh mechanism.

## 💻 Tech Stack

### Current Stack
- **Backend:** Python, FastAPI
- **Database:** MongoDB
- **Authentication:** JWT, passlib, python-jose
- **Data Validation:** Pydantic
- **Async Support:** `motor` for non-blocking database calls
- **Frontend (Mobile):** React Native (as inferred from the documentation)

### Future Enhancements (Roadmap)
- **Offline Database:** WatermelonDB or Realm
- **Image Storage:** Cloudinary or AWS S3
- **Security:** Zod for validation, SlowAPI for rate limiting
- **Error Tracking:** Sentry or Firebase Crashlytics

## 🚀 Getting Started

Follow these instructions to set up the backend development environment.

### Prerequisites
- Python 3.10+
- MongoDB
- `pip` for package management

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
Create a `.env` file in the `backend` directory. This file is required to configure the database connection.
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
```

**c. Set Up the Database**
Ensure you have MongoDB installed and running on your local machine.
- **Install MongoDB:** Follow the official instructions for your operating system. For Debian/Ubuntu, you may need to add the official MongoDB repository.
- **Start MongoDB Service:**
  ```bash
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```

### 3. Run the Backend Server

Once the dependencies are installed and the environment is configured, you can start the FastAPI server:
```bash
# From the backend/ directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The `--reload` flag enables hot-reloading for development. The API will be available at `http://localhost:8000/api`.

## 🧪 Testing

A comprehensive test suite is available to verify the functionality of the backend API.

To run the tests, first ensure the backend server is running, and then execute the following command from the root directory:
```bash
python3 backend_test.py
```
The script will run a series of tests against the live API, covering health checks, user authentication, patient management, and data isolation.

## 🧑‍⚕️ Demo Accounts

You can use the following demo accounts to test the application with pre-populated data.

| Role                          | Email                  | Password      | Notes                               |
| ----------------------------- | ---------------------- | ------------- | ----------------------------------- |
| **Dr. Sarah Johnson**         | `dr.sarah@clinic.com`  | `password123` | Pro Plan, 5 patients (Cardiology)   |
| **Dr. Mike Chen**             | `dr.mike@physio.com`   | `password123` | Regular Plan, 2 patients (Physio) |
| **New Test Account**          | `test.doctor@medical.com` | `TestPass123` | 30-day trial, no patients           |

## 🗺️ Project History & Roadmap

This project has evolved from a basic application with placeholder functionality into a feature-complete patient management system.

### Key Milestones Achieved
- **Full Patient CRUD:** Complete implementation of patient creation, editing, and management screens.
- **Robust Authentication:** Secure, cross-platform JWT authentication.
- **Phone Integration:** Google Contacts-style integration for direct calling, SMS, and caller ID.
- **Code Quality:** Significant improvements in state management (Zustand), error handling, and component reusability.
- **UI/UX:** Added dark mode, skeleton loaders, and optimistic UI updates for a more responsive feel.

### Future Enhancements
The following high-priority features are on the roadmap:
- **Robust Offline Data Management:** Implementing a local database (e.g., WatermelonDB) for full offline functionality.
- **Enhanced Security:** Adding comprehensive client-side and server-side validation.
- **Performance Optimizations:** Including cloud image storage to reduce base64 load and code splitting for faster load times.
- **Advanced UI/UX:** Integrating haptic feedback, advanced loading states, and improved accessibility.