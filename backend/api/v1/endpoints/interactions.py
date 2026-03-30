import logging
from typing import Optional, Union

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from backend.api.v1.schemas import StatusResponse
from backend.core.auth import get_current_user, require_admin_user
from backend.db.firestore import get_db

try:
    from backend.sync_graph import sync_interactions_to_graph
except ImportError:
    import os
    import sys

    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from backend.sync_graph import sync_interactions_to_graph

router = APIRouter()
audit_logger = logging.getLogger('sonicstream.audit')


class InteractionPayload(BaseModel):
    model_config = ConfigDict(extra='forbid')

    song_id: str = Field(min_length=1, max_length=128)
    duration_listened: Optional[float] = Field(default=None, ge=0, le=10800)
    total_duration: Optional[float] = Field(default=None, ge=0, le=10800)
    timestamp: Optional[Union[int, str]] = None
    percent_listened: Optional[float] = Field(default=None, ge=0, le=1)
    is_complete: Optional[bool] = None


@router.post('/track', response_model=StatusResponse)
def track_interaction(data: InteractionPayload, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not configured')

    payload = data.model_dump(exclude_none=True)
    payload['user_id'] = user['uid']

    try:
        db.collection('interactions').add(payload)
        audit_logger.info(
            'interaction_recorded request_id=%s actor_uid=%s song_id=%s duration_listened=%s',
            getattr(request.state, 'request_id', 'n/a'),
            user['uid'],
            payload.get('song_id'),
            payload.get('duration_listened'),
        )
        return {'status': 'recorded'}
    except Exception as exc:
        print(f'Error saving interaction: {exc}')
        raise HTTPException(status_code=500, detail='Failed to record interaction')


@router.post('/sync', response_model=StatusResponse)
def trigger_sync(background_tasks: BackgroundTasks, request: Request, user: dict = Depends(require_admin_user)):
    background_tasks.add_task(sync_interactions_to_graph)
    audit_logger.info(
        'interaction_sync_triggered request_id=%s actor_uid=%s',
        getattr(request.state, 'request_id', 'n/a'),
        user.get('uid', 'unknown'),
    )
    return {'status': 'Sync started'}
