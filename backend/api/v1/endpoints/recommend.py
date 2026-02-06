from fastapi import APIRouter
from backend.services.recommendation import recommendation_service

router = APIRouter()

@router.get("/{user_id}")
def get_recommendations(user_id: str):
    # Retrieve top 20 recommendations
    recs = recommendation_service.get_recommendations(user_id, top_k=20)
    
    # If no recs (cold start or error), return empty list with info
    if not recs:
         return {"recommendations": [], "info": "No recommendations available"}
         
    return {"recommendations": recs}
