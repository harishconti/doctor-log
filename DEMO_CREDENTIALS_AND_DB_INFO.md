# Medical Contacts App - Demo Credentials & Database Backup Guide

## 🔑 Demo Account Credentials

### **Dr. Sarah Johnson (Cardiology Specialist)**
- **Email:** `dr.sarah@clinic.com`
- **Password:** `password123`
- **Subscription:** Pro Plan (Active)
- **Specialty:** Cardiology
- **Phone:** +1234567890
- **Patients:** 5 dummy patients with complete medical records

### **Dr. Mike Chen (Physiotherapy Specialist)**
- **Email:** `dr.mike@physio.com`
- **Password:** `password123`
- **Subscription:** Regular Plan (Active)
- **Specialty:** Physiotherapy
- **Phone:** +1987654321
- **Patients:** 2 dummy patients with physiotherapy records

## 👥 Test Account (Created During Testing)
- **Email:** `test.doctor@medical.com`
- **Password:** `TestPass123`
- **Full Name:** Dr. Test User
- **Specialty:** General
- **Phone:** +1234567890
- **Subscription:** Regular Plan (30-day trial)

## 🏥 Sample Patient Data

### Dr. Sarah's Patients (5 total):
1. **John Wilson (PAT001)** - Cardiology
   - Chief Complaint: "Chest pain and shortness of breath"
   - Diagnosis: "Suspected angina - requires ECG"
   - Status: ⭐ Favorited
   - Notes: Initial consultation completed

2. **Emma Rodriguez (PAT002)** - Cardiology
   - Chief Complaint: "High blood pressure medication review"
   - Diagnosis: "Hypertension - medication adjustment needed"
   - Recent Note: "Blood pressure readings improved with new medication"

3. **Robert Chang (PAT003)** - Endocrinology
   - Chief Complaint: "Diabetic foot care consultation"
   - Diagnosis: "Diabetic neuropathy - preventive care"
   - Location: Home Visit
   - Recent Note: "Home visit completed, no signs of infection"

4. **Lisa Thompson (PAT004)** - Obstetric Cardiology
   - Chief Complaint: "Pregnancy cardiac monitoring"
   - Diagnosis: "Pregnancy-related heart murmur - monitoring required"
   - Status: ⭐ Favorited
   - Recent Note: "20-week checkup completed, heart murmur is benign"

5. **David Miller (PAT005)** - Post-Surgical
   - Chief Complaint: "Post-cardiac surgery follow-up"
   - Diagnosis: "Post-operative recovery - valve replacement"
   - Recent Note: "6-week post-op visit, healing well, cleared for light exercise"

## 🔐 Authentication System

### **Features Working:**
- ✅ JWT-based authentication with 30-day token expiration
- ✅ Platform-specific secure storage (SecureStore for mobile, localStorage for web)
- ✅ Automatic token validation and refresh
- ✅ User registration with medical specialty selection
- ✅ Cross-device account synchronization
- ✅ User data isolation (each doctor only sees their patients)

### **Login Process:**
1. Enter email and password on login screen
2. JWT token generated and stored securely
3. User redirected to main patient list
4. Token automatically included in all API requests
5. Automatic logout on token expiry

## 📊 Database Structure & Backup

### **Collections:**
1. **users** - Doctor profiles, subscription info, medical specialties
2. **patients** - Patient records with medical data and notes
3. **counters** - Auto-increment patient ID sequences per user

### **Database Backup & Restore Commands:**

```bash
# Create full database backup
python /app/db_backup_restore.py backup --name medical_backup_2025

# Export specific user's data (for web dashboard sync)
python /app/db_backup_restore.py export --user dr.sarah@clinic.com

# List all available backups
python /app/db_backup_restore.py list

# Restore from backup (with overwrite)
python /app/db_backup_restore.py restore --file /app/backups/backup_name.json --overwrite

# Get database statistics
python /app/db_backup_restore.py stats
```

### **Current Database Stats:**
- **Users:** 5 total (2 regular, 3 pro plan)
- **Patients:** 7 total (3 favorited)
- **Average patients per user:** 3.5
- **Maximum patients per user:** 5 (Dr. Sarah)

## 🌐 Web Dashboard Integration

### **Shared Database Architecture:**
The database is designed for seamless sharing between:
- **Mobile App** (Current implementation)
- **Web Dashboard** (Future implementation)

### **Key Design Features:**
1. **User-based data isolation** - Each user ID has separate patient data
2. **Consistent API endpoints** - Same backend serves both mobile and web
3. **JWT authentication** - Works across all platforms
4. **Subscription management** - Pro users get web dashboard access
5. **Real-time sync** - Changes reflect immediately across platforms

### **Web Dashboard Data Access:**
```javascript
// Example: Get user's patients for web dashboard
const response = await fetch('/api/patients', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  }
});
```

### **Database Export for Web Analytics:**
```bash
# Export user data with statistics for web dashboard
python /app/db_backup_restore.py export --user dr.sarah@clinic.com
```

**Export includes:**
- Complete user profile
- All patient records with medical notes
- Patient statistics (favorites, groups, visit counts)
- Time-stamped note history
- Subscription plan and status

## 📱 Mobile App Features

### **Offline Support:**
- Patient data cached locally using AsyncStorage
- Automatic sync when internet connection restored
- Offline indicator shows when data might not be current

### **Security:**
- JWT tokens stored in SecureStore (iOS Keychain, Android Keystore)
- Automatic token refresh and validation
- Secure logout with complete data cleanup

### **Professional Features:**
- Auto-increment patient IDs (PAT001, PAT002, etc.)
- Time-stamped medical notes for each visit
- Patient grouping by medical specialty
- Favorites system for frequent patients
- Search across all patient fields
- Photo integration with base64 storage

## 🔄 Testing Workflow

### **Authentication Testing:**
1. Open app → Login screen appears
2. Click "Dr. Sarah (Cardiology)" demo button → auto-fills credentials
3. Click "Sign In" → JWT token generated and stored
4. Navigate to main app → 5 patients loaded with medical data
5. Test search, filtering, and favorites
6. Access profile → view subscription and statistics
7. Test logout → returns to login screen

### **Registration Testing:**
1. Click "Create New Account" on login screen
2. Fill form with medical specialty selection
3. Submit → account created with 30-day trial
4. Automatic login → empty patient list (new user)

### **Cross-Platform Testing:**
- Web browser: Authentication uses localStorage
- Mobile devices: Authentication uses SecureStore
- Both share same backend and database

## 💾 Backup Strategy for Production

### **Recommended Backup Schedule:**
- **Daily:** Full database backup
- **Weekly:** User data exports for analytics
- **Monthly:** Archive old backups
- **Real-time:** Transaction log backups (for high-volume usage)

### **Backup Storage:**
```bash
/app/backups/
├── daily/
│   ├── medical_contacts_backup_20250929_120000.json
│   └── medical_contacts_backup_20250930_120000.json
├── user_exports/
│   ├── user_export_dr.sarah@clinic.com_20250929_163220.json
│   └── user_export_dr.mike@physio.com_20250929_163220.json
└── archives/
    └── 2025_Q3_backup.json
```

### **Recovery Scenarios:**
1. **Single user data corruption:** Restore from user export
2. **Complete database loss:** Restore from full backup
3. **Web dashboard sync:** Use user exports for real-time data
4. **Cross-device migration:** Export user data, import on new device

This architecture ensures seamless data sharing between the current mobile app and future web dashboard while maintaining security and user data isolation.
</content>