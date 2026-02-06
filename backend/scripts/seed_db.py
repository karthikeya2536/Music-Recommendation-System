import json
import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

DATASET_PATH = os.path.join(BASE_DIR, "dataset.json")
# Use the config value or hardcoded path relative to this script
CREDENTIALS_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

def seed_database():
    print(f"Checking for dataset at: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        print("Error: dataset.json not found!")
        return

    print(f"Checking for credentials at: {CREDENTIALS_PATH}")
    if not os.path.exists(CREDENTIALS_PATH):
        print("Error: serviceAccountKey.json not found! Please place it in the backend folder.")
        return

    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    # Load JSON
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        tracks = json.load(f)
        
    print(f"Found {len(tracks)} tracks to seed.")
    
    # Batch write (limit 500 per batch)
    batch = db.batch()
    count = 0
    total_batches = 0
    
    collection_ref = db.collection('tracks')
    
    for track in tracks:
        doc_ref = collection_ref.document(track['id'])
        batch.set(doc_ref, track)
        count += 1
        
        if count >= 490: # Commit batch
            batch.commit()
            print(f"Committed batch {total_batches + 1}")
            batch = db.batch()
            count = 0
            total_batches += 1
            
    if count > 0:
        batch.commit()
        print(f"Committed final batch {total_batches + 1}")
        
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
