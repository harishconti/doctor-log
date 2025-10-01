from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

# --- Patient Note Schemas ---
class PatientNoteBase(BaseModel):
    content: str
    visit_type: str = "regular"  # regular, follow-up, emergency

class PatientNoteCreate(PatientNoteBase):
    pass

class PatientNote(PatientNoteBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = "practitioner"

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
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

class PatientCreate(PatientBase):
    pass

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

class PatientInDBBase(PatientBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Auto-generated incremental ID like PAT001
    user_id: str  # Associate with logged-in user
    notes: List[PatientNote] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class Patient(PatientInDBBase):
    pass

class NoteCreate(BaseModel):
    content: str
    visit_type: str = "regular"