from app.db.session import UserCollection
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.models.user import User
from bson import ObjectId
from typing import Optional
import uuid
from datetime import datetime, timedelta

async def create_user(user_data: UserCreate) -> User:
    """
    Creates a new user in the database.
    """
    existing_user = await UserCollection.find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("Email already registered")

    user_dict = user_data.dict()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    user_dict["subscription_plan"] = "regular"
    user_dict["subscription_status"] = "trial"
    user_dict["trial_end_date"] = datetime.utcnow() + timedelta(days=30)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()

    await UserCollection.insert_one(user_dict)

    # Return a User model instance
    return User(**user_dict)

async def authenticate_user(user_data: UserLogin) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    user = await UserCollection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        return None

    return User(**user)

async def get_user_by_id(user_id: str) -> User | None:
    """
    Retrieves a user by their ID.
    """
    user = await UserCollection.find_one({"id": user_id})
    if user:
        return User(**user)
    return None