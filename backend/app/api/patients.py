from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.security import get_current_user, require_pro_user
from app.services import patient_service, clinical_note_service
from app.schemas.patient import (
    PatientCreate, PatientUpdate, Patient
)
from app.schemas.clinical_note import NoteCreate, ClinicalNote

router = APIRouter()

import logging

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    current_user_id: str = Depends(get_current_user)
):
    """
    Create a new patient record.
    """
    try:
        patient = await patient_service.create_patient(patient_data, current_user_id)
        return {"success": True, "patient": patient}
    except Exception as e:
        logging.error(f"Error creating patient for user {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the patient."
        )

@router.get("/", response_model=dict)
async def get_all_patients(
    search: Optional[str] = None,
    group: Optional[str] = None,
    favorites_only: bool = False,
    current_user_id: str = Depends(get_current_user)
):
    """
    Retrieve all patients for the current user, with optional filters.
    """
    try:
        patients = await patient_service.get_patients_by_user_id(
            user_id=current_user_id,
            search=search,
            group=group,
            favorites_only=favorites_only
        )
        return {"success": True, "patients": patients}
    except Exception as e:
        logging.error(f"Error fetching patients for user {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching patients."
        )

@router.get("/{id}", response_model=dict)
async def get_patient_by_id(
    id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Retrieve a single patient by their unique ID.
    """
    patient = await patient_service.get_patient_by_id(id, current_user_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "patient": patient}

@router.put("/{id}", response_model=dict)
async def update_patient(
    id: str,
    patient_data: PatientUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """
    Update a patient's details.
    """
    patient = await patient_service.update_patient(id, patient_data, current_user_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "patient": patient}

@router.delete("/{id}", response_model=dict)
async def delete_patient(
    id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Delete a patient record.
    """
    success = await patient_service.delete_patient(id, current_user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "message": "Patient deleted successfully"}

# --- Notes Routes ---

@router.post("/{id}/notes", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_patient_note(
    id: str,
    note_data: NoteCreate,
    current_user_id: str = Depends(get_current_user)
):
    """
    Add a new note to a patient's record.
    """
    note = await patient_service.add_note_to_patient(id, note_data, current_user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "note": note}

@router.get("/{id}/notes", response_model=dict)
async def get_patient_notes(
    id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get all notes for a specific patient.
    """
    notes = await patient_service.get_patient_notes(id, current_user_id)
    if notes is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return {"success": True, "notes": notes}

# --- Other Utility Routes ---

@router.get("/groups/", response_model=dict)
async def get_patient_groups(current_user_id: str = Depends(get_current_user)):
    """
    Get a list of unique patient groups for the user.
    """
    try:
        groups = await patient_service.get_patient_groups(current_user_id)
        return {"success": True, "groups": groups}
    except Exception as e:
        logging.error(f"Error fetching groups for user {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching groups."
        )

@router.get("/stats/", response_model=dict)
async def get_statistics(current_user_id: str = Depends(get_current_user)):
    """
    Get user-specific statistics (total patients, favorites, etc.).
    """
    try:
        stats = await patient_service.get_user_stats(current_user_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        logging.error(f"Error fetching stats for user {current_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching statistics."
        )

# --- Pro-Only Endpoint Example ---

@router.get("/pro-feature/", response_model=dict)
async def pro_feature_endpoint(current_user_id: str = Depends(require_pro_user)):
    """
    An example endpoint that is only accessible to PRO users.
    """
    return {"success": True, "message": f"Welcome, PRO user {current_user_id}! You have access to this exclusive feature."}