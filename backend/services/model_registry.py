import json
import os
from typing import Any, Dict, Optional

from backend.core.config import get_settings

settings = get_settings()


def _default_registry_path() -> str:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, 'recommendation_engine', 'model_registry.json')


def registry_path() -> str:
    configured = settings.MODEL_REGISTRY_PATH.strip()
    if configured:
        if os.path.isabs(configured):
            return configured
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, configured)
    return _default_registry_path()


def load_registry() -> Dict[str, Any]:
    path = registry_path()
    if not os.path.exists(path):
        return {}

    try:
        with open(path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception:
        return {}


def get_active_model_id(registry: Optional[Dict[str, Any]] = None) -> Optional[str]:
    data = registry if registry is not None else load_registry()
    active = data.get('active_model')
    return active if isinstance(active, str) and active.strip() else None


def get_active_model_record(registry: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    data = registry if registry is not None else load_registry()
    active_id = get_active_model_id(data)
    models = data.get('models', {}) if isinstance(data.get('models', {}), dict) else {}
    if active_id and active_id in models and isinstance(models[active_id], dict):
        return models[active_id]
    return {}


def _resolve_artifact(value: str) -> str:
    if os.path.isabs(value):
        return value
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, value)


def get_active_artifact_paths() -> Dict[str, str]:
    record = get_active_model_record()
    artifacts = record.get('artifacts', {}) if isinstance(record.get('artifacts', {}), dict) else {}

    result: Dict[str, str] = {}
    for key in ('embeddings', 'hnn_model', 'mf_model', 'dataset'):
        raw = artifacts.get(key)
        if isinstance(raw, str) and raw.strip():
            result[key] = _resolve_artifact(raw)
    return result


def get_registry_status() -> Dict[str, Any]:
    data = load_registry()
    path = registry_path()

    active_id = get_active_model_id(data)
    active_record = get_active_model_record(data)
    artifacts = get_active_artifact_paths()

    artifact_exists = {
        key: os.path.exists(value) for key, value in artifacts.items()
    }

    has_required = all(k in artifacts for k in ('embeddings', 'dataset'))
    valid = bool(data) and bool(active_id) and bool(active_record) and has_required and all(artifact_exists.values())

    return {
        'path': path,
        'exists': os.path.exists(path),
        'active_model': active_id,
        'has_active_record': bool(active_record),
        'artifact_paths': artifacts,
        'artifact_exists': artifact_exists,
        'valid': valid,
    }
