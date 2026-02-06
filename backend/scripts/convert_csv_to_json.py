import csv
import json
import os
import hashlib

# Determine paths relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(BASE_DIR), "songs.csv") # Assuming songs.csv is in root
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, "dataset.json")

def generate_id(title, artist):
    """Generates a consistent ID based on title and artist."""
    raw = f"{title}-{artist}".encode('utf-8')
    return hashlib.md5(raw).hexdigest()[:8]

def convert_csv_to_json():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading from: {CSV_PATH}")
    
    unique_tracks = {}
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Basic cleaning
            title = row.get('title', '').strip()
            artist = row.get('artist', '').strip()
            
            if not title or not artist:
                continue
                
            # Handle ID: use existing if valid, else generate
            track_id = row.get('id', '').strip()
            if not track_id or track_id == '#NAME?' or track_id in unique_tracks:
                track_id = generate_id(title, artist)
            
            # Map fields
            new_track = {
                "id": track_id,
                "title": title,
                "artist": artist,
                "album": row.get('album', '').strip(),
                "coverUrl": row.get('image', '').strip(),
                "audioUrl": row.get('url', '').strip(),
                "duration": int(float(row.get('duration', 0) or 0)), # Handle strings like "211.0"
                "year": int(float(row.get('year', 0) or 0)),
                "genre": row.get('genre', '').strip(),
                "lyrics": [] # Default empty
            }
            
            # Deduplicate by ID (which is robust due to fallback generation)
            if track_id not in unique_tracks:
                unique_tracks[track_id] = new_track
    
    tracks_list = list(unique_tracks.values())
    
    print(f"Processed {len(tracks_list)} unique tracks.")
    
    with open(JSON_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(tracks_list, f, indent=2)
        
    print(f"Successfully wrote to: {JSON_OUTPUT_PATH}")

if __name__ == "__main__":
    convert_csv_to_json()
