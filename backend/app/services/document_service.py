from app.db.session import DocumentCollection
from app.models.document import Document
from app.schemas.document import DocumentCreate
from typing import List

async def create_document(doc_data: DocumentCreate, user_id: str) -> Document:
    """
    Creates a new document record in the database.
    """
    document = Document(
        patient_id=doc_data.patient_id,
        user_id=user_id,
        file_name=doc_data.file_name,
        storage_url=doc_data.storage_url
    )
    await DocumentCollection.insert_one(document.model_dump())
    return document

async def get_documents_for_patient(patient_id: str, user_id: str) -> List[Document]:
    """
    Retrieves all documents for a specific patient that belong to the user.
    """
    documents_cursor = DocumentCollection.find({
        "patient_id": patient_id,
        "user_id": user_id
    })
    documents = await documents_cursor.to_list(length=None)
    return [Document(**doc) for doc in documents]