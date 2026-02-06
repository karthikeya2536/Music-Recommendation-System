import numpy as np
import json
import os
from typing import List, Dict, Optional
from backend.core.config import get_settings
from backend.id_mapper import get_user_idx

settings = get_settings()

class RecommendationService:
    def __init__(self):
        self.user_emb = None
        self.song_emb = None
        self.songs_metadata = {}
        self.loaded = False
        self._load_model()

    def _load_model(self):
        try:
            import torch # Import locally only for loading the .pt file if needed
            print(f"Loading embeddings from {settings.ABS_EMBEDDINGS_PATH}")
            if not os.path.exists(settings.ABS_EMBEDDINGS_PATH):
                print("Embeddings file not found.")
                return

            emb_data = torch.load(settings.ABS_EMBEDDINGS_PATH, map_location='cpu')
            
            self.user_emb = emb_data['user_embeddings'].numpy()
            self.song_emb = emb_data['song_embeddings'].numpy()
            del emb_data
            
            dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset.json")
            if not os.path.exists(dataset_path):
                dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dataset.json")
            
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    self.songs_metadata = json.load(f)
            
            self.loaded = True
            print("Recommendation model (NumPy) loaded successfully.")
            
        except Exception as e:
            print(f"Error loading recommendation model: {e}")

    def get_recommendations(self, user_id: str, top_k: int = 10) -> List[Dict]:
        if not self.loaded or self.user_emb is None:
            return []
            
        u_idx = get_user_idx(user_id, create=False)
        if u_idx is None or u_idx >= self.user_emb.shape[0]:
            return []

        try:
            u_vec = self.user_emb[u_idx]
            scores = np.dot(self.song_emb, u_vec)
            top_indices = np.argsort(scores)[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if 0 <= idx < len(self.songs_metadata):
                    song = self.songs_metadata[idx]
                    results.append({
                        "id": song.get("id"),
                        "title": song.get("title"),
                        "artist": song.get("artist"),
                        "coverUrl": song.get("image_url") or song.get("coverUrl", "https://picsum.photos/200"),
                        "audioUrl": song.get("audio_url") or song.get("audioUrl")
                    })
            return results
        except Exception as e:
            print(f"Inference error: {e}")
            return []

recommendation_service = RecommendationService()
