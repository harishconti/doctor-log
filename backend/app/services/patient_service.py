from app.db.session import PatientCollection, CounterCollection
from app.schemas.patient import PatientCreate, PatientUpdate, NoteCreate
from app.models.patient import Patient, PatientNote
from typing import List, Optional, Dict
from bson import ObjectId
import uuid
from datetime import datetime

async def get_next_patient_id(user_id: str) -> str:
    """
    Generates the next patient ID for a given user.
    """
    counter = await CounterCollection.find_one_and_update(
        {"_id": f"patient_id_{user_id}"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=True
    )
    return f"PAT{counter['sequence']:03d}"

async def create_patient(patient_data: PatientCreate, user_id: str) -> Patient:
    """
    Creates a new patient for a user.
    """
    patient_id = await get_next_patient_id(user_id)
    patient_dict = patient_data.dict()
    patient_dict["id"] = str(uuid.uuid4())
    patient_dict["patient_id"] = patient_id
    patient_dict["user_id"] = user_id
    patient_dict["created_at"] = datetime.utcnow()
    patient_dict["updated_at"] = datetime.utcnow()
    patient_dict["notes"] = []

    await PatientCollection.insert_one(patient_dict)
    return Patient(**patient_dict)

async def get_patient_by_id(patient_id: str, user_id: str) -> Optional[Patient]:
    """
    Retrieves a single patient by their ID and user ID.
    """
    patient = await PatientCollection.find_one({"id": patient_id, "user_id": user_id})
    if patient:
        return Patient(**patient)
    return None

async def get_patients_by_user_id(
    user_id: str,
    search: Optional[str] = None,
    group: Optional[str] = None,
    favorites_only: bool = False
) -> List[Patient]:
    """
    Retrieves a list of patients for a user, with optional filters.
    """
    query = {"user_id": user_id}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"patient_id": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if group:
        query["group"] = group
    if favorites_only:
        query["is_favorite"] = True

    patients_cursor = PatientCollection.find(query).sort("created_at", -1)
    patients = await patients_cursor.to_list(1000)
    return [Patient(**p) for p in patients]

async def update_patient(patient_id: str, patient_data: PatientUpdate, user_id: str) -> Optional[Patient]:
    """
    Updates a patient's information.
    """
    update_data = {k: v for k, v in patient_data.dict().items() if v is not None}
    if not update_data:
        # No fields to update, return the original patient
        return await get_patient_by_id(patient_id, user_id)

    update_data["updated_at"] = datetime.utcnow()

    result = await PatientCollection.update_one(
        {"id": patient_id, "user_id": user_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return None

    return await get_patient_by_id(patient_id, user_id)

async def delete_patient(patient_id: str, user_id: str) -> bool:
    """
    Deletes a patient by their ID. Returns True if successful.
    """
    result = await PatientCollection.delete_one({"id": patient_id, "user_id": user_id})
    return result.deleted_count > 0

async def add_note_to_patient(patient_id: str, note_data: NoteCreate, user_id: str) -> Optional[PatientNote]:
    """
    Adds a new note to a patient's record.
    """
    note = PatientNote(**note_data.dict())

    result = await PatientCollection.update_one(
        {"id": patient_id, "user_id": user_id},
        {"$push": {"notes": note.dict()}, "$set": {"updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return None

    return note

async def get_patient_notes(patient_id: str, user_id: str) -> Optional[List[PatientNote]]:
    """
    Retrieves all notes for a specific patient.
    """
    patient = await get_patient_by_id(patient_id, user_id)
    if not patient:
        return None

    # Sort notes by timestamp descending
    sorted_notes = sorted(patient.notes, key=lambda n: n.timestamp, reverse=True)
    return sorted_notes

async def get_patient_groups(user_id: str) -> List[str]:
    """
    Retrieves all unique patient groups for a user.
    """
    groups = await PatientCollection.distinct("group", {"user_id": user_id})
    return [group for group in groups if group]

async def get_user_stats(user_id: str) -> Dict[str, any]:
    """
    Retrieves statistics for a user.
    """
    total_patients = await PatientCollection.count_documents({"user_id": user_id})
    favorite_patients = await PatientCollection.count_documents({"user_id": user_id, "is_favorite": True})

    pipeline = [
        {"$match": {"user_id": user_id, "group": {"$ne": None}}},
        {"$group": {"_id": "$group", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    group_stats = await PatientCollection.aggregate(pipeline).to_list(100)

    return {
        "total_patients": total_patients,
        "favorite_patients": favorite_patients,
        "groups": group_stats
    }