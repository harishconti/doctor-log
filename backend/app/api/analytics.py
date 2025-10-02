from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from app.core.security import require_pro_user
from app.services import analytics_service

router = APIRouter()

@router.get("/patient-growth", response_model=List[Dict])
async def get_patient_growth(
    current_user_id: str = Depends(require_pro_user)
):
    """
    Get patient growth analytics data. This is a PRO feature.
    """
    try:
        growth_data = await analytics_service.get_patient_growth_analytics(current_user_id)
        return growth_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching analytics data."
        )