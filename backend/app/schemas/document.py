from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import uuid

class DocumentBase(BaseModel):
    file_name: str = Field(..., description="The name of the uploaded file.")
    storage_url: str = Field(..., description="The URL of the file in cloud storage.")

class DocumentCreate(DocumentBase):
    patient_id: str

class Document(DocumentBase):
    id: str
    patient_id: str
    user_id: str
    uploaded_at: datetime

    class Config:
        from_attributes = True