from fastapi import APIRouter, Depends, Query
from typing import Dict, Any
from app.services import sync_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/pull")
async def pull(
    last_pulled_at: int = Query(0),
    user_id: str = Depends(get_current_user),
):
    """
    Pull changes for the client.
    """
    changes = await sync_service.pull_changes(last_pulled_at, user_id)
    return changes

@router.post("/push")
async def push(
    changes: Dict[str, Any],
    user_id: str = Depends(get_current_user),
):
    """
    Push changes from the client.
    """
    await sync_service.push_changes(changes, user_id)
    return {"status": "ok"}