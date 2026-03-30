from threading import Lock

import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.core.config import get_settings
from backend.db.firestore import init_db

security = HTTPBearer(auto_error=False)
settings = get_settings()

_auth_counter_lock = Lock()
_auth_failure_counters: dict[str, int] = {
    'missing_token': 0,
    'firebase_unavailable': 0,
    'invalid_token': 0,
    'missing_uid_claim': 0,
    'uid_mismatch': 0,
    'admin_not_configured': 0,
    'admin_denied': 0,
}


def _count_auth_failure(reason: str):
    with _auth_counter_lock:
        _auth_failure_counters[reason] = _auth_failure_counters.get(reason, 0) + 1


def get_auth_failure_counters() -> dict[str, int]:
    with _auth_counter_lock:
        return dict(_auth_failure_counters)


def _ensure_firebase_initialized() -> None:
    if firebase_admin._apps:
        return
    init_db()
    if not firebase_admin._apps:
        _count_auth_failure('firebase_unavailable')
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Authentication service is not configured',
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials or credentials.scheme.lower() != 'bearer':
        _count_auth_failure('missing_token')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Missing bearer token',
        )

    _ensure_firebase_initialized()

    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
    except Exception:
        _count_auth_failure('invalid_token')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired token',
        )

    uid = decoded.get('uid')
    if not uid:
        _count_auth_failure('missing_uid_claim')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token missing uid claim',
        )
    return decoded


def require_user_match(user_id: str, user: dict = Depends(get_current_user)) -> dict:
    if user.get('uid') != user_id:
        _count_auth_failure('uid_mismatch')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Forbidden for this user',
        )
    return user


def require_admin_user(user: dict = Depends(get_current_user)) -> dict:
    admin_uids = settings.ADMIN_UIDS_SET
    if not admin_uids:
        _count_auth_failure('admin_not_configured')
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Admin access is not configured',
        )

    if user.get('uid') not in admin_uids:
        _count_auth_failure('admin_denied')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin access required',
        )
    return user
