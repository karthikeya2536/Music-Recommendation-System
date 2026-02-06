from fastapi import APIRouter
from backend.api.v1.endpoints import tracks, recommend, library, interactions

api_router = APIRouter()

api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(recommend.router, prefix="/recommend", tags=["recommendations"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(interactions.router, prefix="/api", tags=["interactions"]) # /api/track -> /api/v1/api/track? confusing.
# Original was /api/track. So here we probably want to map it carefully.
# let's just use prefix /interactions or keep interactions root.
# The endpoint wrapper inside interactions.py uses @router.post("/track"). 
# So if we map prefix="/interactions", it becomes "/interactions/track".
# Let's adjust interactions.py or here. 
# Original: /api/track. New: /api/v1/interactions/track is better.
