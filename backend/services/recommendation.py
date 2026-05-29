import json
import os
from typing import Dict, List, Optional

import torch

from backend.core.config import get_settings
from backend.id_mapper import get_user_idx
from backend.services.model_registry import get_active_artifact_paths, get_registry_status

settings = get_settings()

def _dataset_path() -> str:
    registry_artifacts = get_active_artifact_paths()
    registry_dataset = registry_artifacts.get('dataset')
    if registry_dataset and os.path.exists(registry_dataset):
        return registry_dataset

    backend_dataset = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset.json')
    if os.path.exists(backend_dataset):
        return backend_dataset

    root_dataset = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'dataset.json',
    )
    return root_dataset

def _embeddings_path() -> str:
    registry_artifacts = get_active_artifact_paths()
    registry_embeddings = registry_artifacts.get('embeddings')
    if registry_embeddings:
        return registry_embeddings
    return settings.ABS_EMBEDDINGS_PATH

class RecommendationService:
    def __init__(self):
        self.user_emb = None
        self.song_emb = None
        self.songs_metadata = {}
        self.loaded = False

    def _load_model(self):
        try:
            embeddings_path = _embeddings_path()
            print(f'Loading embeddings from {embeddings_path}')
            if not os.path.exists(embeddings_path):
                print('Embeddings file not found. Recommendation service will return empty.')
                return

            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            emb_data = torch.load(embeddings_path, map_location=device)

            self.user_emb = emb_data['user_embeddings'].to(device)
            self.song_emb = emb_data['song_embeddings'].to(device)

            dataset_path = _dataset_path()
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as file:
                    self.songs_metadata = json.load(file)
            else:
                print('Dataset json not found!')

            self.loaded = True
            print('Recommendation model loaded successfully.')

        except Exception as exc:
            print(f'Error loading recommendation model: {exc}')

    def ensure_loaded(self):
        if not self.loaded:
            self._load_model()

    def get_recommendations(self, user_id: str, top_k: int = 10) -> List[Dict]:
        self.ensure_loaded()

        if not self.loaded:
            return []

        u_idx = get_user_idx(user_id, create=False)
        if u_idx is None:
            print(f'Cold start for user {user_id}. Returning randomized variety.')
            if not self.songs_metadata:
                return []

            import random

            pool_size = min(50, len(self.songs_metadata))
            indices = random.sample(range(len(self.songs_metadata)), pool_size)

            results = []
            for idx in indices:
                song = self.songs_metadata[idx]
                results.append(
                    {
                        'id': song.get('id'),
                        'title': song.get('title'),
                        'artist': song.get('artist'),
                        'coverUrl': song.get('image_url') or song.get('coverUrl', ''),
                        'audioUrl': song.get('audio_url') or song.get('audioUrl'),
                    }
                )

            random.shuffle(results)
            return results[:top_k]

        if u_idx >= self.user_emb.shape[0]:
            print(
                f'User index {u_idx} out of bounds for model '
                f'(trained on {self.user_emb.shape[0]})'
            )
            return self.get_recommendations('cold-start-fallback', top_k)

        try:
            u_vec = self.user_emb[u_idx]
            scores = torch.matmul(self.song_emb, u_vec)
            _, top_indices = torch.topk(scores, top_k * 2)

            results = []
            for idx_tensor in top_indices:
                idx = idx_tensor.item()
                if 0 <= idx < len(self.songs_metadata):
                    song = self.songs_metadata[idx]
                    results.append(
                        {
                            'id': song.get('id'),
                            'title': song.get('title'),
                            'artist': song.get('artist'),
                            'coverUrl': song.get('image_url') or song.get('coverUrl', ''),
                            'audioUrl': song.get('audio_url') or song.get('audioUrl'),
                        }
                    )

            import random

            random.shuffle(results)
            return results[:top_k]
        except Exception as exc:
            print(f'Inference error: {exc}')
            return []


_recommendation_service: Optional[RecommendationService] = None

def get_recommendation_service() -> RecommendationService:
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service

def get_recommendation_artifact_status() -> Dict[str, bool | str | dict]:
    dataset_path = _dataset_path()
    embeddings_path = _embeddings_path()
    registry = get_registry_status()

    return {
        'embeddings_exists': os.path.exists(embeddings_path),
        'dataset_exists': os.path.exists(dataset_path),
        'embeddings_path': embeddings_path,
        'dataset_path': dataset_path,
        'registry': registry,
        'service_initialized': _recommendation_service is not None,
        'service_loaded': _recommendation_service.loaded if _recommendation_service else False,
    }
