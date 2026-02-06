import firebase_admin
from firebase_admin import credentials, firestore
import csv
import os
import sys

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__)) # sonicstream/
CSV_PATH = os.path.join(BASE_DIR, 'songs.csv')
CRED_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

def seed_database():
    # Init Firebase
    if not firebase_admin._apps:
        if os.path.exists(CRED_PATH):
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        else:
            print(f"Error: {CRED_PATH} not found.")
            return

    db = firestore.client()
    
    # Load CSV
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found.")
        return

    tracks = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map CSV fields to Firestore Schema
            track = {
                "id": row['id'],
                "title": row['title'],
                "artist": row['artist'],
                "album": row['album'],
                "coverUrl": row['image'],
                "audioUrl": row['url'],
                "duration": float(row['duration']) if row['duration'] else 0,
                "year": int(row['year']) if row['year'] else 0,
                "lyrics": [] # Default empty
            }
            tracks.append(track)
        
    print(f"Found {len(tracks)} tracks from songs.csv. Starting upload...")
    
    batch = db.batch()
    count = 0
    total = 0
    
    for track in tracks:
        # Create a document reference
        doc_ref = db.collection('tracks').document(str(track['id']))
        batch.set(doc_ref, track)
        
        count += 1
        total += 1
        
        # Commit batches of 400
        if count >= 400:
            batch.commit()
            print(f"Uploaded {total} tracks...")
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
        
    print(f"Success! Uploaded {total} tracks to Firestore.")

if __name__ == "__main__":
    seed_database()
