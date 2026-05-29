import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    PROJECT_NAME: str = "SonicStream API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    FIREBASE_CREDENTIALS_PATH: str = os.path.join("backend", "serviceAccountKey.json")

    # ML Models
    MODEL_PATH_HNN: str = os.path.join("recommendation_engine", "hnn_model.pth")
    MODEL_PATH_MF: str = os.path.join("recommendation_engine", "mf_model.pth")
    EMBEDDINGS_PATH: str = os.path.join("recommendation_engine", "final_embeddings.pt")
    MODEL_REGISTRY_PATH: str = os.path.join("recommendation_engine", "model_registry.json")

    # Security and abuse controls
    ADMIN_UIDS: str = ""
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_READ_MAX: int = 180
    RATE_LIMIT_WRITE_MAX: int = 60
    RATE_LIMIT_BUCKET_MAX_KEYS: int = 10000

    # Catalog performance
    CATALOG_CACHE_TTL_SECONDS: int = 20
    CATALOG_CACHE_MAX_KEYS: int = 256

    @property
    def ABS_EMBEDDINGS_PATH(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, self.EMBEDDINGS_PATH)

    @property
    def ABS_CREDENTIALS_PATH(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, self.FIREBASE_CREDENTIALS_PATH)

    @property
    def ADMIN_UIDS_SET(self) -> set[str]:
        return {uid.strip() for uid in self.ADMIN_UIDS.split(",") if uid.strip()}

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings():
    return Settings()
