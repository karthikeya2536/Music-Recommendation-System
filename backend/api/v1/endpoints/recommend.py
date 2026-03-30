import logging

from fastapi import APIRouter, Depends, Request

from backend.api.v1.schemas import RecommendationsResponse
from backend.core.auth import require_user_match
from backend.services.recommendation import get_recommendation_service

router = APIRouter()
audit_logger = logging.getLogger('sonicstream.audit')


@router.get('/{user_id}', response_model=RecommendationsResponse)
def get_recommendations(user_id: str, request: Request, _: dict = Depends(require_user_match)):
    recs = get_recommendation_service().get_recommendations(user_id, top_k=20)

    audit_logger.info(
        'recommendations_requested request_id=%s actor_uid=%s result_count=%s',
        getattr(request.state, 'request_id', 'n/a'),
        user_id,
        len(recs),
    )

    if not recs:
        return {'recommendations': [], 'info': 'No recommendations available'}

    return {'recommendations': recs}
