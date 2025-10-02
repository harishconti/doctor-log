from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
import uuid

class ClinicalNoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="The content of the clinical note.")
    visit_type: Literal["regular", "follow-up", "emergency"] = "regular"

class NoteCreate(ClinicalNoteBase):
    """Schema for creating a note from an API request body."""
    pass

class ClinicalNoteCreate(ClinicalNoteBase):
    """Schema for creating a note in the service layer, including patient_id."""
    patient_id: str

class ClinicalNote(ClinicalNoteBase):
    id: str
    patient_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True