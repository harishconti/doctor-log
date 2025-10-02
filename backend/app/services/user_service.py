from app.db.session import UserCollection
from app.schemas.user import UserCreate, UserLogin, UserPlan, SubscriptionStatus
from app.core.security import hash_password, verify_password
from app.models.user import User  # Corrected import
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
    # The 'plan' is now part of the user_data
    user_dict["subscription_status"] = SubscriptionStatus.TRIALING if user_data.plan == UserPlan.TRIAL else SubscriptionStatus.ACTIVE
    user_dict["subscription_end_date"] = datetime.utcnow() + timedelta(days=30)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()

    # Create a User model instance for the database
    db_user = User(**user_dict)

    # Insert the dictionary representation into the database
    await UserCollection.insert_one(db_user.dict())

    return db_user

async def authenticate_user(user_data: UserLogin) -> Optional[User]:
    """
    Authenticates a user. Returns the user object if successful, otherwise None.
    """
    user_from_db = await UserCollection.find_one({"email": user_data.email})
    if not user_from_db or not verify_password(user_data.password, user_from_db.get("password_hash", "")):
        return None

    return User(**user_from_db)

async def get_user_by_id(user_id: str) -> User | None:
    """
    Retrieves a user by their ID.
    """
    user_from_db = await UserCollection.find_one({"id": user_id})
    if user_from_db:
        return User(**user_from_db)
    return None