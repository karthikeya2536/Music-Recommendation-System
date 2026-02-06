from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from backend.services.catalog import catalog_service

router = APIRouter()

@router.get("/trending")
def get_trending(limit: int = 20):
    return {"tracks": catalog_service.get_trending_tracks(limit)}

@router.get("/new")
def get_new(limit: int = 15):
    return {"tracks": catalog_service.get_new_releases(limit)}

@router.get("/search")
def search(q: str = "", genre: str = ""):
    if not q and not genre:
        return {"tracks": []}
    
    if genre:
        # Specialized genre fetch
        return {"tracks": catalog_service.get_tracks_by_genre(genre)}
        
    return {"tracks": catalog_service.search_tracks(q)}
