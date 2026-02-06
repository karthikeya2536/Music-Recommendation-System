from typing import List, Dict
from firebase_admin import firestore
from backend.db.firestore import get_db

class CatalogService:
    def __init__(self):
        pass
        
    def get_tracks_by_genre(self, genre: str, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db or not genre:
             return []
        try:
            # Assumes 'genre' field exists and uses equality
            # Case-insensitive if dataset is standardized, else exact match
            # "Melody", "Mass", "Love", "Folk"
            query = db.collection('tracks').where('genre', '==', genre).limit(limit)
            docs = query.stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            print(f"Error fetching genre {genre}: {e}")
            return []

    def get_trending_tracks(self, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db:
            return []
        try:
            # Optimistically fetch 'tracks' collection
            # In a real app we might have a specific 'trending' aggregation or field
            docs = db.collection('tracks').limit(limit).stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            print(f"Error fetching trending: {e}")
            return []

    def get_new_releases(self, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db:
            return []
        try:
            # Sort by year descending if available
            query = db.collection('tracks').order_by('year', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            print(f"Error fetching new releases (trying fallback): {e}")
            # Fallback
            docs = db.collection('tracks').limit(limit).stream()
            return [d.to_dict() for d in docs]

    def search_tracks(self, query: str, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db or not query:
            return []
            
        try:
            # Simple prefix search simulation 
            # Note: Firestore inequalities ranges are sensitive to case
            q_title = query.title() 
            
            docs = db.collection('tracks')\
                     .where('title', '>=', q_title)\
                     .where('title', '<=', q_title + '\uf8ff')\
                     .limit(limit)\
                     .stream()
            
            results = [d.to_dict() for d in docs]
            
            # Simple deduplication or fallback logic could go here
            return results
        except Exception as e:
            print(f"Error searching tracks: {e}")
            return []

catalog_service = CatalogService()
