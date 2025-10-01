from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Create a client instance
client = AsyncIOMotorClient(settings.MONGO_URL)

# Get the database from the client
# The database name is read from the environment variables
database = client[settings.DB_NAME]

# --- Collections ---
UserCollection = database.get_collection("users")
PatientCollection = database.get_collection("patients")
CounterCollection = database.get_collection("counters")

async def get_db():
    """
    Dependency to get the database session.
    In the context of motor, the client manages connection pooling,
    so we don't need to open/close connections for each request.
    """
    return database

async def shutdown_db_client():
    """
    Close the MongoDB client connection.
    This should be called during application shutdown.
    """
    client.close()