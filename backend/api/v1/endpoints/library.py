from fastapi import APIRouter, HTTPException, Body
from firebase_admin import firestore
from backend.db.firestore import get_db

router = APIRouter()

@router.get("/{user_id}")
def get_user_library(user_id: str):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()
    
    if not doc.exists:
         # Create default profile
         user_ref.set({
             'liked_songs': [],
             'playlists': []
         }, merge=True)
         return {'liked': [], 'playlists': []}
    
    data = doc.to_dict()
    return {
        'liked': data.get('liked_songs', []),
        'playlists': data.get('playlists', [])
    }

@router.post("/like")
def toggle_like(payload: dict = Body(...)):
    """
    { "user_id": "...", "song_id": "...", "action": "add" | "remove" }
    """
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    uid = payload.get('user_id')
    sid = payload.get('song_id')
    action = payload.get('action') # 'add' or 'remove'
    
    user_ref = db.collection('users').document(uid)
    
    if action == 'add':
        user_ref.update({
            'liked_songs': firestore.ArrayUnion([sid])
        })
    elif action == 'remove':
        user_ref.update({
            'liked_songs': firestore.ArrayRemove([sid])
        })
        
    return {"status": "success", "song_id": sid, "action": action}

@router.post("/playlist")
def manage_playlist(payload: dict = Body(...)):
    """
    { "user_id": "...", "playlist": { "id": "p_123", "title": "My Mix", "tracks": [] } }
    """
    import time
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    uid = payload.get('user_id')
    playlist = payload.get('playlist') 
    
    if not uid or not playlist:
        raise HTTPException(status_code=400, detail="Missing data")
        
    # MVP: Save to subcollection
    playlist_id = playlist.get('id')
    if not playlist_id:
        playlist_id = f"p_{int(time.time())}"
        playlist['id'] = playlist_id
        
    db.collection('users').document(uid).collection('playlists').document(playlist_id).set(playlist)
    
    return {"status": "saved", "playlist": playlist}
