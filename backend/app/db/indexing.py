import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
from app.db.session import UserCollection, PatientCollection, ClinicalNoteCollection, DocumentCollection

logger = logging.getLogger(__name__)

async def create_indexes():
    """
    Creates all necessary indexes for the collections if they don't already exist.
    """
    logger.info("Starting index creation process...")
    try:
        # User Collection Indexes
        await UserCollection.create_indexes([
            IndexModel([("email", ASCENDING)], name="email_unique_asc", unique=True),
            IndexModel([("id", ASCENDING)], name="id_unique_asc", unique=True)
        ])
        logger.info("Indexes for UserCollection created successfully.")

        # Patient Collection Indexes
        await PatientCollection.create_indexes([
            IndexModel([("user_id", ASCENDING)], name="user_id_asc"),
            IndexModel([("id", ASCENDING)], name="id_asc", unique=True),
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created_at_desc")
        ])
        logger.info("Indexes for PatientCollection created successfully.")

        # ClinicalNote Collection Indexes
        await ClinicalNoteCollection.create_indexes([
            IndexModel([("patient_id", ASCENDING)], name="patient_id_asc"),
            IndexModel([("user_id", ASCENDING)], name="user_id_asc")
        ])
        logger.info("Indexes for ClinicalNoteCollection created successfully.")

        # Document Collection Indexes
        await DocumentCollection.create_indexes([
            IndexModel([("patient_id", ASCENDING)], name="patient_id_asc"),
            IndexModel([("user_id", ASCENDING)], name="user_id_asc")
        ])
        logger.info("Indexes for DocumentCollection created successfully.")

        logger.info("All indexes have been processed.")
    except Exception as e:
        logger.error(f"An error occurred during index creation: {e}", exc_info=True)
        # Depending on the deployment strategy, you might want to raise the exception
        # to halt startup if indexes are critical.
        raise