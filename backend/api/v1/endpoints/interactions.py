from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from backend.db.firestore import get_db
# Import sync function logic or move it. 
# For now, let's assume we can import it from the root backend (as per sys.path in original)
# A better way is to move sync_graph to backend/services/sync.py, but for now we import relatively if possible.
# Ideally, we should refactor sync_graph to not be a script but a module.
try:
    from backend.sync_graph import sync_interactions_to_graph
except ImportError:
    # Fallback if running from root without package install
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from backend.sync_graph import sync_interactions_to_graph

router = APIRouter()

@router.post("/track")
def track_interaction(data: dict = Body(...)):
    """
    Receives interaction data:
    { "user_id": "u_123", "song_id": "s_55", ... }
    """
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        db.collection('interactions').add(data)
        return {"status": "recorded"}
    except Exception as e:
        print(f"Error saving interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_interactions_to_graph)
    return {"status": "Sync started"}
