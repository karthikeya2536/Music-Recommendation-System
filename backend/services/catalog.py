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
            # Fetch a larger pool (50) and shuffle them to ensure variety
            docs = list(db.collection('tracks').limit(50).stream())
            results = [d.to_dict() for d in docs]
            
            import random
            random.shuffle(results)
            
            return results[:limit]
        except Exception as e:
            print(f"Error fetching trending: {e}")
            return []

    def get_new_releases(self, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db:
            return []
        try:
            # Sort by year descending and fetch a pool of 50
            query = db.collection('tracks').order_by('year', direction=firestore.Query.DESCENDING).limit(50)
            docs = list(query.stream())
            results = [d.to_dict() for d in docs]
            
            import random
            random.shuffle(results)
            
            return results[:limit]
        except Exception as e:
            print(f"Error fetching new releases (trying fallback): {e}")
            # Fallback
            docs = list(db.collection('tracks').limit(50).stream())
            results = [d.to_dict() for d in docs]
            
            import random
            random.shuffle(results)
            
            return results[:limit]

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
