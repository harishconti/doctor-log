from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import require_pro_user
from app.services import document_service
from app.schemas.document import DocumentCreate, Document

router = APIRouter()

@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
async def upload_document(
    doc_data: DocumentCreate,
    current_user_id: str = Depends(require_pro_user)
):
    """
    Create a new document record. This is a PRO feature.
    """
    try:
        document = await document_service.create_document(doc_data, current_user_id)
        return document
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the document record."
        )

@router.get("/{patient_id}", response_model=List[Document])
async def get_patient_documents(
    patient_id: str,
    current_user_id: str = Depends(require_pro_user)
):
    """
    Get all documents for a specific patient. This is a PRO feature.
    """
    try:
        documents = await document_service.get_documents_for_patient(patient_id, current_user_id)
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching documents."
        )