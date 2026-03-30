from fastapi import APIRouter, Query

from backend.api.v1.schemas import TrackListResponse
from backend.services.catalog import catalog_service

router = APIRouter()


@router.get('/trending', response_model=TrackListResponse)
def get_trending(limit: int = Query(default=20, ge=1, le=200)):
    return {'tracks': catalog_service.get_trending_tracks(limit)}


@router.get('/new', response_model=TrackListResponse)
def get_new(limit: int = Query(default=15, ge=1, le=200)):
    return {'tracks': catalog_service.get_new_releases(limit)}


@router.get('/search', response_model=TrackListResponse)
def search(
    q: str = Query(default='', max_length=100),
    genre: str = Query(default='', max_length=50, pattern=r'^[A-Za-z0-9 _-]*$'),
):
    cleaned_q = q.strip()
    cleaned_genre = genre.strip()

    if not cleaned_q and not cleaned_genre:
        return {'tracks': []}

    if cleaned_genre:
        return {'tracks': catalog_service.get_tracks_by_genre(cleaned_genre)}

    return {'tracks': catalog_service.search_tracks(cleaned_q)}
