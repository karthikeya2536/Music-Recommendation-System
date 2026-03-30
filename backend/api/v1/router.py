from fastapi import APIRouter
from backend.api.v1.endpoints import tracks, recommend, library, interactions

api_router = APIRouter()

api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(recommend.router, prefix="/recommend", tags=["recommendations"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
