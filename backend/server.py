from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import jwt
import bcrypt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "medical_contacts_secret_key_2025"  # In production, use environment variable
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_document(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# User & Subscription Models
class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = ""
    password: str
    full_name: str
    medical_specialty: Optional[str] = "general"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    phone: Optional[str] = ""
    full_name: str
    medical_specialty: Optional[str] = "general"
    subscription_plan: str = "regular"  # regular, pro
    subscription_status: str = "active"  # active, inactive, trial
    trial_end_date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Patient Models (Updated with user association)
class PatientNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    visit_type: str = "regular"  # regular, follow-up, emergency
    created_by: str = "practitioner"

class PatientCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    location: Optional[str] = ""  # clinic/home visit
    initial_complaint: Optional[str] = ""
    initial_diagnosis: Optional[str] = ""
    photo: Optional[str] = ""  # base64 encoded image
    group: Optional[str] = "general"
    is_favorite: bool = False

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Auto-generated incremental ID like PAT001
    user_id: str  # Associate with logged-in user
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    location: Optional[str] = ""
    initial_complaint: Optional[str] = ""
    initial_diagnosis: Optional[str] = ""
    photo: Optional[str] = ""
    group: Optional[str] = "general"
    is_favorite: bool = False
    notes: List[PatientNote] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    initial_complaint: Optional[str] = None
    initial_diagnosis: Optional[str] = None
    photo: Optional[str] = None
    group: Optional[str] = None
    is_favorite: Optional[bool] = None

class NoteCreate(BaseModel):
    content: str
    visit_type: str = "regular"

# Auto-increment counter for patient IDs per user
async def get_next_patient_id(user_id: str):
    counter = await db.counters.find_one_and_update(
        {"_id": f"patient_id_{user_id}"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=True
    )
    return f"PAT{counter['sequence']:03d}"

# Initialize database with dummy data
async def init_dummy_data():
    """Create dummy users and patients for testing"""
    
    # Create dummy users
    demo_users = [
        {
            "id": "demo_user_1",
            "email": "dr.sarah@clinic.com", 
            "phone": "+1234567890",
            "full_name": "Dr. Sarah Johnson",
            "medical_specialty": "cardiology",
            "password_hash": hash_password("password123"),
            "subscription_plan": "pro",
            "subscription_status": "active",
            "trial_end_date": datetime.utcnow() + timedelta(days=365),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "demo_user_2", 
            "email": "dr.mike@physio.com",
            "phone": "+1987654321",
            "full_name": "Dr. Mike Chen",
            "medical_specialty": "physiotherapy",
            "password_hash": hash_password("password123"),
            "subscription_plan": "regular",
            "subscription_status": "active",
            "trial_end_date": datetime.utcnow() + timedelta(days=30),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for user_data in demo_users:
        existing = await db.users.find_one({"email": user_data["email"]})
        if not existing:
            await db.users.insert_one(user_data)
    
    # Create dummy patients for Dr. Sarah
    dummy_patients = [
        {
            "id": str(uuid.uuid4()),
            "patient_id": "PAT001",
            "user_id": "demo_user_1",
            "name": "John Wilson",
            "phone": "+1555123456",
            "email": "john.wilson@email.com",
            "address": "123 Main St, Springfield",
            "location": "Clinic Room 1",
            "initial_complaint": "Chest pain and shortness of breath",
            "initial_diagnosis": "Suspected angina - requires ECG",
            "photo": "",
            "group": "cardiology",
            "is_favorite": True,
            "notes": [
                {
                    "id": str(uuid.uuid4()),
                    "content": "Initial consultation - patient reports chest tightness during exercise. Scheduled for stress test.",
                    "timestamp": datetime.utcnow() - timedelta(days=5),
                    "visit_type": "initial",
                    "created_by": "Dr. Sarah Johnson"
                }
            ],
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": "PAT002", 
            "user_id": "demo_user_1",
            "name": "Emma Rodriguez",
            "phone": "+1555987654",
            "email": "emma.r@email.com",
            "address": "456 Oak Ave, Springfield",
            "location": "Clinic Room 2",
            "initial_complaint": "High blood pressure medication review",
            "initial_diagnosis": "Hypertension - medication adjustment needed",
            "photo": "",
            "group": "cardiology",
            "is_favorite": False,
            "notes": [
                {
                    "id": str(uuid.uuid4()),
                    "content": "Blood pressure readings have improved with new medication. Continue current dosage.",
                    "timestamp": datetime.utcnow() - timedelta(days=2),
                    "visit_type": "follow-up",
                    "created_by": "Dr. Sarah Johnson"
                }
            ],
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": "PAT003",
            "user_id": "demo_user_1", 
            "name": "Robert Chang",
            "phone": "+1555456789",
            "email": "robert.chang@email.com",
            "address": "789 Pine St, Springfield",
            "location": "Home Visit",
            "initial_complaint": "Diabetic foot care consultation",
            "initial_diagnosis": "Diabetic neuropathy - preventive care",
            "photo": "",
            "group": "endocrinology",
            "is_favorite": False,
            "notes": [
                {
                    "id": str(uuid.uuid4()),
                    "content": "Home visit completed. Patient education on foot care provided. No signs of infection.",
                    "timestamp": datetime.utcnow() - timedelta(days=1),
                    "visit_type": "home_visit", 
                    "created_by": "Dr. Sarah Johnson"
                }
            ],
            "created_at": datetime.utcnow() - timedelta(days=7),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": "PAT004",
            "user_id": "demo_user_1",
            "name": "Lisa Thompson", 
            "phone": "+1555654321",
            "email": "lisa.thompson@email.com",
            "address": "321 Elm Dr, Springfield",
            "location": "Clinic Room 1",
            "initial_complaint": "Pregnancy cardiac monitoring",
            "initial_diagnosis": "Pregnancy-related heart murmur - monitoring required",
            "photo": "",
            "group": "obstetric_cardiology",
            "is_favorite": True,
            "notes": [
                {
                    "id": str(uuid.uuid4()),
                    "content": "20-week checkup completed. Heart murmur is benign. Next appointment in 4 weeks.",
                    "timestamp": datetime.utcnow() - timedelta(hours=6),
                    "visit_type": "routine",
                    "created_by": "Dr. Sarah Johnson"
                }
            ],
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(hours=6)
        },
        {
            "id": str(uuid.uuid4()),
            "patient_id": "PAT005",
            "user_id": "demo_user_1",
            "name": "David Miller",
            "phone": "+1555789012", 
            "email": "david.miller@email.com",
            "address": "654 Maple Ave, Springfield",
            "location": "Clinic Room 3",
            "initial_complaint": "Post-cardiac surgery follow-up",
            "initial_diagnosis": "Post-operative recovery - valve replacement",
            "photo": "",
            "group": "post_surgical",
            "is_favorite": False,
            "notes": [
                {
                    "id": str(uuid.uuid4()),
                    "content": "6-week post-op visit. Healing well, cleared for light exercise. Next visit in 3 months.",
                    "timestamp": datetime.utcnow() - timedelta(hours=2),
                    "visit_type": "post_surgical", 
                    "created_by": "Dr. Sarah Johnson"
                }
            ],
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(hours=2)
        }
    ]
    
    # Insert dummy patients
    for patient_data in dummy_patients:
        existing = await db.patients.find_one({"patient_id": patient_data["patient_id"], "user_id": patient_data["user_id"]})
        if not existing:
            await db.patients.insert_one(patient_data)
    
    # Set up counters
    await db.counters.update_one(
        {"_id": "patient_id_demo_user_1"},
        {"$set": {"sequence": 5}},
        upsert=True
    )

# Auth Routes
@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_dict = user_data.dict()
        user_dict["id"] = str(uuid.uuid4())
        user_dict["password_hash"] = hash_password(user_dict.pop("password"))
        user_dict["subscription_plan"] = "regular"
        user_dict["subscription_status"] = "trial"
        user_dict["trial_end_date"] = datetime.utcnow() + timedelta(days=30)
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        await db.users.insert_one(user_dict)
        
        # Create access token
        access_token = create_access_token(data={"sub": user_dict["id"]})
        
        # Return user data without password
        user_dict.pop("password_hash", None)
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": serialize_document(user_dict)
        }
    except Exception as e:
        if "Email already registered" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login", response_model=dict)
async def login_user(user_data: UserLogin):
    try:
        # Find user by email
        user = await db.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Return user data without password
        user.pop("password_hash", None)
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer", 
            "user": serialize_document(user)
        }
    except Exception as e:
        if "Invalid email or password" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me", response_model=dict)
async def get_current_user_info(current_user_id: str = Depends(get_current_user)):
    try:
        user = await db.users.find_one({"id": current_user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.pop("password_hash", None)
        return {"success": True, "user": serialize_document(user)}
    except Exception as e:
        if "User not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Patient Routes (Updated with authentication)
@api_router.post("/patients", response_model=dict)
async def create_patient(patient_data: PatientCreate, current_user_id: str = Depends(get_current_user)):
    try:
        patient_id = await get_next_patient_id(current_user_id)
        patient_dict = patient_data.dict()
        patient_dict["patient_id"] = patient_id
        patient_dict["user_id"] = current_user_id
        patient_dict["id"] = str(uuid.uuid4())
        patient_dict["created_at"] = datetime.utcnow()
        patient_dict["updated_at"] = datetime.utcnow()
        patient_dict["notes"] = []
        
        result = await db.patients.insert_one(patient_dict)
        patient_dict["_id"] = str(result.inserted_id)
        
        return {"success": True, "patient": serialize_document(patient_dict)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/patients", response_model=dict)
async def get_patients(
    current_user_id: str = Depends(get_current_user),
    search: Optional[str] = None, 
    group: Optional[str] = None, 
    favorites_only: bool = False
):
    try:
        query = {"user_id": current_user_id}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"patient_id": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        if group:
            query["group"] = group
            
        if favorites_only:
            query["is_favorite"] = True
        
        patients = await db.patients.find(query).sort("created_at", -1).to_list(1000)
        serialized_patients = [serialize_document(patient) for patient in patients]
        
        return {"success": True, "patients": serialized_patients}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/patients/{patient_id}", response_model=dict)
async def get_patient(patient_id: str, current_user_id: str = Depends(get_current_user)):
    try:
        patient = await db.patients.find_one({"id": patient_id, "user_id": current_user_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"success": True, "patient": serialize_document(patient)}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/patients/{patient_id}", response_model=dict)
async def update_patient(patient_id: str, patient_data: PatientUpdate, current_user_id: str = Depends(get_current_user)):
    try:
        update_data = {k: v for k, v in patient_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.patients.update_one(
            {"id": patient_id, "user_id": current_user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = await db.patients.find_one({"id": patient_id, "user_id": current_user_id})
        return {"success": True, "patient": serialize_document(patient)}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/patients/{patient_id}", response_model=dict)
async def delete_patient(patient_id: str, current_user_id: str = Depends(get_current_user)):
    try:
        result = await db.patients.delete_one({"id": patient_id, "user_id": current_user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"success": True, "message": "Patient deleted successfully"}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Notes Routes (Updated with authentication)
@api_router.post("/patients/{patient_id}/notes", response_model=dict)
async def add_patient_note(patient_id: str, note_data: NoteCreate, current_user_id: str = Depends(get_current_user)):
    try:
        note = PatientNote(**note_data.dict())
        
        result = await db.patients.update_one(
            {"id": patient_id, "user_id": current_user_id},
            {"$push": {"notes": note.dict()}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"success": True, "note": note.dict()}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/patients/{patient_id}/notes", response_model=dict)
async def get_patient_notes(patient_id: str, current_user_id: str = Depends(get_current_user)):
    try:
        patient = await db.patients.find_one({"id": patient_id, "user_id": current_user_id}, {"notes": 1})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        notes = patient.get("notes", [])
        notes.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {"success": True, "notes": notes}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Groups/Categories Routes (Updated with authentication)
@api_router.get("/groups", response_model=dict)
async def get_patient_groups(current_user_id: str = Depends(get_current_user)):
    try:
        groups = await db.patients.distinct("group", {"user_id": current_user_id})
        groups = [group for group in groups if group]
        
        return {"success": True, "groups": groups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statistics Route (Updated with authentication)
@api_router.get("/stats", response_model=dict)
async def get_statistics(current_user_id: str = Depends(get_current_user)):
    try:
        total_patients = await db.patients.count_documents({"user_id": current_user_id})
        favorite_patients = await db.patients.count_documents({"user_id": current_user_id, "is_favorite": True})
        
        pipeline = [
            {"$match": {"user_id": current_user_id}},
            {"$group": {"_id": "$group", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        group_stats = await db.patients.aggregate(pipeline).to_list(100)
        
        return {
            "success": True,
            "stats": {
                "total_patients": total_patients,
                "favorite_patients": favorite_patients,
                "groups": group_stats
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Subscription Routes
@api_router.get("/subscription", response_model=dict)
async def get_subscription_info(current_user_id: str = Depends(get_current_user)):
    try:
        user = await db.users.find_one({"id": current_user_id}, {"subscription_plan": 1, "subscription_status": 1, "trial_end_date": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "subscription": user}
    except Exception as e:
        if "User not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/upgrade", response_model=dict)
async def upgrade_subscription(current_user_id: str = Depends(get_current_user)):
    try:
        result = await db.users.update_one(
            {"id": current_user_id},
            {
                "$set": {
                    "subscription_plan": "pro",
                    "subscription_status": "active",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "Successfully upgraded to Pro plan"}
    except Exception as e:
        if "User not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Initialize dummy data on startup
@app.on_event("startup")
async def startup_event():
    await init_dummy_data()

# Health check
@api_router.get("/")
async def root():
    return {"message": "Medical Contacts API with Authentication", "version": "2.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()