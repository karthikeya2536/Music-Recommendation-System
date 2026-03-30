import logging
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import firestore
from pydantic import BaseModel, ConfigDict, Field

from backend.api.v1.schemas import LibraryResponse, LikeActionResponse, PlaylistResponse
from backend.core.auth import get_current_user, require_user_match
from backend.db.firestore import get_db

router = APIRouter()
audit_logger = logging.getLogger('sonicstream.audit')


@router.get('/{user_id}', response_model=LibraryResponse)
def get_user_library(user_id: str, request: Request, _: dict = Depends(require_user_match)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not available')

    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()

    if not doc.exists:
        user_ref.set({'liked_songs': []}, merge=True)
        audit_logger.info(
            'library_initialized request_id=%s actor_uid=%s',
            getattr(request.state, 'request_id', 'n/a'),
            user_id,
        )
        return {'liked': [], 'playlists': []}

    data = doc.to_dict()

    playlists = []
    try:
        playlist_docs = user_ref.collection('playlists').stream()
        playlists = [p.to_dict() for p in playlist_docs]
    except Exception as exc:
        print(f'Error reading playlists subcollection: {exc}')

    return {
        'liked': data.get('liked_songs', []),
        'playlists': playlists,
    }


class LikePayload(BaseModel):
    model_config = ConfigDict(extra='forbid')

    song_id: str = Field(min_length=1, max_length=128)
    action: Literal['add', 'remove']


class PlaylistData(BaseModel):
    model_config = ConfigDict(extra='forbid')

    id: Optional[str] = Field(default=None, max_length=128)
    title: str = Field(min_length=1, max_length=120)
    coverUrl: str = Field(default='', max_length=2048)
    tracks: list[dict[str, Any]] = Field(default_factory=list, max_length=1000)


class PlaylistPayload(BaseModel):
    model_config = ConfigDict(extra='forbid')

    playlist: PlaylistData


@router.post('/like', response_model=LikeActionResponse)
def toggle_like(payload: LikePayload, request: Request, user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not available')

    uid = user['uid']
    sid = payload.song_id
    action = payload.action

    user_ref = db.collection('users').document(uid)
    user_ref.set({'liked_songs': []}, merge=True)

    if action == 'add':
        user_ref.update({'liked_songs': firestore.ArrayUnion([sid])})
    else:
        user_ref.update({'liked_songs': firestore.ArrayRemove([sid])})

    audit_logger.info(
        'library_like_mutation request_id=%s actor_uid=%s song_id=%s action=%s',
        getattr(request.state, 'request_id', 'n/a'),
        uid,
        sid,
        action,
    )

    return {'status': 'success', 'song_id': sid, 'action': action}


@router.post('/playlist', response_model=PlaylistResponse)
def manage_playlist(payload: PlaylistPayload, request: Request, user: dict = Depends(get_current_user)):
    import time

    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not available')

    uid = user['uid']
    playlist = payload.playlist.model_dump()

    playlist_id = playlist.get('id')
    if not playlist_id:
        playlist_id = f"p_{int(time.time())}"
        playlist['id'] = playlist_id

    db.collection('users').document(uid).collection('playlists').document(playlist_id).set(playlist)

    audit_logger.info(
        'library_playlist_upsert request_id=%s actor_uid=%s playlist_id=%s title=%s track_count=%s',
        getattr(request.state, 'request_id', 'n/a'),
        uid,
        playlist_id,
        playlist.get('title', ''),
        len(playlist.get('tracks', [])),
    )

    return {'status': 'saved', 'playlist': playlist}
