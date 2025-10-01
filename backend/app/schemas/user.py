from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
import uuid

class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = ""
    full_name: str
    medical_specialty: Optional[str] = "general"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    medical_specialty: Optional[str] = None

class UserInDBBase(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subscription_plan: str = "regular"
    subscription_status: str = "active"
    trial_end_date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    password_hash: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str