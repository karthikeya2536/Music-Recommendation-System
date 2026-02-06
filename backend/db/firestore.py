import firebase_admin
from firebase_admin import credentials, firestore
import os
from backend.core.config import get_settings

settings = get_settings()
_db_client = None

def get_db():
    global _db_client
    if _db_client is None:
        init_db()
    return _db_client

def init_db():
    global _db_client
    
    # Check if already initialized to avoid error
    if firebase_admin._apps:
        _db_client = firestore.client()
        return

    # First try reading from environment variable (for Vercel/Production)
    service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if service_account_json:
        try:
            import json
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _db_client = firestore.client()
            return
        except Exception as e:
            print(f"Error initializing from env var: {e}")

    cred_path = settings.ABS_CREDENTIALS_PATH
    
    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _db_client = firestore.client()
            print(f"Firestore initialized with {cred_path}")
        except Exception as e:
            print(f"Failed to initialize Firestore: {e}")
            _db_client = None
    else:
        print(f"WARNING: Service account key not found at {cred_path}")
        _db_client = None
