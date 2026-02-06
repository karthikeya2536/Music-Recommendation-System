import torch
import json
import os
from typing import List, Dict, Optional
from backend.core.config import get_settings
from backend.id_mapper import get_user_idx # We will fix this import or move the file later

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
            print(f"Loading embeddings from {settings.ABS_EMBEDDINGS_PATH}")
            if not os.path.exists(settings.ABS_EMBEDDINGS_PATH):
                print("Embeddings file not found. Recommendation service will return empty.")
                return

            # Check for CPU/GPU
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            emb_data = torch.load(settings.ABS_EMBEDDINGS_PATH, map_location=device)
            
            self.user_emb = emb_data['user_embeddings'].to(device)
            self.song_emb = emb_data['song_embeddings'].to(device)
            
            # Load metadata
            # Assuming dataset.json is in the root or known location matching indices
            # We use the dataset.json in 'backend' if available, or the root one.
            # config didn't specify dataset path, let's look in backend dir
            dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset.json")
            if not os.path.exists(dataset_path):
                # Validation fallback to root
                dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dataset.json")
            
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    self.songs_metadata = json.load(f)
            else:
                print("Dataset json not found!")
                
            self.loaded = True
            print("Recommendation model loaded successfully.")
            
        except Exception as e:
            print(f"Error loading recommendation model: {e}")

    def get_recommendations(self, user_id: str, top_k: int = 10) -> List[Dict]:
        if not self.loaded:
            return []
            
        # Get internal ID
        u_idx = get_user_idx(user_id, create=False)
        if u_idx is None:
            # Cold start: Return random or popular (logic could be expanded)
            # For now return empty or trigger specific cold start logic
            return []
            
        # Check if user index is within embedding range
        # Use shape check
        if u_idx >= self.user_emb.shape[0]:
            print(f"User index {u_idx} out of bounds for model (trained on {self.user_emb.shape[0]})")
            return []

        # Inference
        try:
            u_vec = self.user_emb[u_idx]
            scores = torch.matmul(self.song_emb, u_vec)
            top_scores, top_indices = torch.topk(scores, top_k)
            
            results = []
            for idx_tensor in top_indices:
                idx = idx_tensor.item()
                if 0 <= idx < len(self.songs_metadata):
                    song = self.songs_metadata[idx]
                    # Ensure minimal fields
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
