import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "SonicStream API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    FIREBASE_CREDENTIALS_PATH: str = os.path.join("backend", "serviceAccountKey.json")
    
    # ML Models
    # Base dir is calculated relative to this file? 
    # Let's make paths relative to project root usually.
    # But BaseSettings reads env vars. 
    # Let's define specific properties or compute them after.
    
    MODEL_PATH_HNN: str = os.path.join("recommendation_engine", "hnn_model.pth")
    MODEL_PATH_MF: str = os.path.join("recommendation_engine", "mf_model.pth")
    EMBEDDINGS_PATH: str = os.path.join("recommendation_engine", "final_embeddings.pt")

    @property
    def ABS_EMBEDDINGS_PATH(self) -> str:
        # Assuming we run from root, or we use __file__ to find root
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, self.EMBEDDINGS_PATH)

    @property
    def ABS_CREDENTIALS_PATH(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, self.FIREBASE_CREDENTIALS_PATH)


    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
