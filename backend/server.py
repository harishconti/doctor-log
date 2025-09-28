from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_document(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Patient Models
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

# Auto-increment counter for patient IDs
async def get_next_patient_id():
    counter = await db.counters.find_one_and_update(
        {"_id": "patient_id"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=True
    )
    return f"PAT{counter['sequence']:03d}"

# Patient Routes
@api_router.post("/patients", response_model=dict)
async def create_patient(patient_data: PatientCreate):
    try:
        patient_id = await get_next_patient_id()
        patient_dict = patient_data.dict()
        patient_dict["patient_id"] = patient_id
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
async def get_patients(search: Optional[str] = None, group: Optional[str] = None, favorites_only: bool = False):
    try:
        query = {}
        
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
async def get_patient(patient_id: str):
    try:
        patient = await db.patients.find_one({"id": patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"success": True, "patient": serialize_document(patient)}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/patients/{patient_id}", response_model=dict)
async def update_patient(patient_id: str, patient_data: PatientUpdate):
    try:
        update_data = {k: v for k, v in patient_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.patients.update_one(
            {"id": patient_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = await db.patients.find_one({"id": patient_id})
        return {"success": True, "patient": serialize_document(patient)}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/patients/{patient_id}", response_model=dict)
async def delete_patient(patient_id: str):
    try:
        result = await db.patients.delete_one({"id": patient_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"success": True, "message": "Patient deleted successfully"}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Notes Routes
@api_router.post("/patients/{patient_id}/notes", response_model=dict)
async def add_patient_note(patient_id: str, note_data: NoteCreate):
    try:
        note = PatientNote(**note_data.dict())
        
        result = await db.patients.update_one(
            {"id": patient_id},
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
async def get_patient_notes(patient_id: str):
    try:
        patient = await db.patients.find_one({"id": patient_id}, {"notes": 1})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        notes = patient.get("notes", [])
        # Sort notes by timestamp descending (newest first)
        notes.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {"success": True, "notes": notes}
    except Exception as e:
        if "Patient not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Groups/Categories Routes
@api_router.get("/groups", response_model=dict)
async def get_patient_groups():
    try:
        # Get unique groups from all patients
        groups = await db.patients.distinct("group")
        groups = [group for group in groups if group]  # Filter out empty groups
        
        return {"success": True, "groups": groups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Statistics Route
@api_router.get("/stats", response_model=dict)
async def get_statistics():
    try:
        total_patients = await db.patients.count_documents({})
        favorite_patients = await db.patients.count_documents({"is_favorite": True})
        
        # Get patient count by group
        pipeline = [
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

# Original status check routes
@api_router.get("/")
async def root():
    return {"message": "Medical Contacts API"}

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