from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
from bson import ObjectId

class PatientNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    visit_type: str = "regular"
    created_by: str = "practitioner"

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    user_id: str
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

    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }