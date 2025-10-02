from app.db.session import PatientCollection
from typing import List, Dict

async def get_patient_growth_analytics(user_id: str) -> List[Dict]:
    """
    Generates patient growth analytics data for a specific user.
    This function will aggregate patient creation data by month.
    """
    pipeline = [
        {
            "$match": {
                "user_id": user_id
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {
                "_id.year": 1,
                "_id.month": 1
            }
        },
        {
            "$project": {
                "_id": 0,
                "year": "$_id.year",
                "month": "$_id.month",
                "count": "$count"
            }
        }
    ]

    growth_data = await PatientCollection.aggregate(pipeline).to_list(length=None)
    return growth_data