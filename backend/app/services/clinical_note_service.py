from app.db.session import ClinicalNoteCollection
from app.models.clinical_note import ClinicalNote
from app.schemas.clinical_note import ClinicalNoteCreate
from typing import List

async def create_note(note_data: ClinicalNoteCreate, user_id: str) -> ClinicalNote:
    """
    Creates a new clinical note for a patient.
    """
    note = ClinicalNote(
        patient_id=note_data.patient_id,
        user_id=user_id,
        content=note_data.content,
        visit_type=note_data.visit_type
    )
    await ClinicalNoteCollection.insert_one(note.model_dump())
    return note

async def get_notes_for_patient(patient_id: str, user_id: str) -> List[ClinicalNote]:
    """
    Retrieves all clinical notes for a specific patient that belong to the user.
    """
    notes_cursor = ClinicalNoteCollection.find({
        "patient_id": patient_id,
        "user_id": user_id
    })
    notes = await notes_cursor.to_list(length=None)
    return [ClinicalNote(**note) for note in notes]