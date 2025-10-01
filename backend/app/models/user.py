from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import uuid
from bson import ObjectId

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: Optional[str] = ""
    full_name: str
    medical_specialty: Optional[str] = "general"
    subscription_plan: str = "regular"  # regular, pro
    subscription_status: str = "active"  # active, inactive, trial
    trial_end_date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    password_hash: Optional[str] = None

    class Config:
        from_attributes = True
        # Helper to convert MongoDB's `_id` to `id`
        json_encoders = {
            ObjectId: str
        }

    def to_response(self):
        """
        Returns a dictionary representation of the user for API responses,
        excluding sensitive information like the password hash.
        """
        user_dict = self.dict()
        user_dict.pop("password_hash", None)
        return user_dict