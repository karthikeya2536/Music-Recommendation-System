from typing import List, Dict, Tuple, Any
from firebase_admin import firestore
from backend.db.firestore import get_db
import time


class CatalogService:
    """Catalog service with a small in-process cache used by tests and metrics.

    Tests expect the service to expose _now (hookable), _query_* methods that
    can be monkey-patched, and a get_cache_stats() reporting hits/misses.
    """

    def __init__(self, cache_ttl_seconds: float = 20.0):
        self._cache_ttl = cache_ttl_seconds
        # cache key -> (timestamp, value)
        self._cache: Dict[Tuple[str, int], Tuple[float, Any]] = {}
        self._hits = 0
        self._misses = 0

    # Hook for tests to override time
    def _now(self) -> float:
        return time.time()

    def _make_cache_key(self, name: str, limit: int) -> Tuple[str, int]:
        return (name, int(limit))

    def _get_from_cache(self, key: Tuple[str, int]):
        entry = self._cache.get(key)
        if not entry:
            return None
        ts, value = entry
        if (self._now() - ts) > self._cache_ttl:
            # expired
            self._cache.pop(key, None)
            return None
        return value

    def _set_cache(self, key: Tuple[str, int], value: Any):
        self._cache[key] = (self._now(), value)

    def get_cache_stats(self) -> Dict[str, int]:
        return {'entries': len(self._cache), 'hits': self._hits, 'misses': self._misses}

    # Query helper hooks (tests may replace these)
    def _query_trending_tracks(self, limit: int) -> List[Dict]:
        db = get_db()
        if not db:
            return []
        try:
            docs = list(db.collection('tracks').limit(300).stream())
            results = [d.to_dict() for d in docs]
            import random
            random.shuffle(results)
            return results[:limit]
        except Exception:
            return []

    def _query_new_releases(self, limit: int) -> List[Dict]:
        db = get_db()
        if not db:
            return []
        try:
            query = db.collection('tracks').order_by('year', direction=firestore.Query.DESCENDING).limit(300)
            docs = list(query.stream())
            results = [d.to_dict() for d in docs]
            import random
            random.shuffle(results)
            return results[:limit]
        except Exception:
            # fallback to simple list
            docs = list(db.collection('tracks').limit(300).stream())
            results = [d.to_dict() for d in docs]
            import random
            random.shuffle(results)
            return results[:limit]

    # Public methods use caching
    def get_trending_tracks(self, limit: int = 20) -> List[Dict]:
        key = self._make_cache_key('trending', limit)
        cached = self._get_from_cache(key)
        if cached is not None:
            self._hits += 1
            return cached

        self._misses += 1
        results = self._query_trending_tracks(limit)
        self._set_cache(key, results)
        return results

    def get_new_releases(self, limit: int = 20) -> List[Dict]:
        key = self._make_cache_key('new', limit)
        cached = self._get_from_cache(key)
        if cached is not None:
            self._hits += 1
            return cached

        self._misses += 1
        results = self._query_new_releases(limit)
        self._set_cache(key, results)
        return results

    def get_tracks_by_genre(self, genre: str, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db or not genre:
            return []
        try:
            query = db.collection('tracks').where('genre', '==', genre).limit(limit)
            docs = query.stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            print(f"Error fetching genre {genre}: {e}")
            return []

    def search_tracks(self, query: str, limit: int = 20) -> List[Dict]:
        db = get_db()
        if not db or not query:
            return []
        try:
            q_title = query.title()
            docs = db.collection('tracks')\
                     .where('title', '>=', q_title)\
                     .where('title', '<=', q_title + '\uf8ff')\
                     .limit(limit)\
                     .stream()
            results = [d.to_dict() for d in docs]
            return results
        except Exception as e:
            print(f"Error searching tracks: {e}")
            return []


catalog_service = CatalogService()
