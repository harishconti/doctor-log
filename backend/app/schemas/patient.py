from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime
import uuid

# --- Patient Schemas ---
class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(default="", max_length=25)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default="", max_length=255)
    location: Optional[str] = Field(default="", max_length=100)
    initial_complaint: Optional[str] = Field(default="", max_length=5000)
    initial_diagnosis: Optional[str] = Field(default="", max_length=5000)
    photo: Optional[str] = None  # base64 encoded image, validation can be complex
    group: Optional[str] = Field(default="general", max_length=50)
    is_favorite: bool = False

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=25)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default=None, max_length=255)
    location: Optional[str] = Field(default=None, max_length=100)
    initial_complaint: Optional[str] = Field(default=None, max_length=5000)
    initial_diagnosis: Optional[str] = Field(default=None, max_length=5000)
    photo: Optional[str] = None
    group: Optional[str] = Field(default=None, max_length=50)
    is_favorite: Optional[bool] = None

class PatientInDBBase(PatientBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Auto-generated incremental ID like PAT001
    user_id: str  # Associate with logged-in user
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class Patient(PatientInDBBase):
    pass

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"