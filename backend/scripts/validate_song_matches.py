import csv
import json
import os
import requests
import html
import time
from typing import List, Dict, Optional

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(BASE_DIR), "songs.csv")
API_BASE = "http://127.0.0.1:3000/api/songs"
REPORT_PATH = "metadata_validation_report.json"

# Manually verified IDs from the migration script
VERIFIED_IDS = {
    "YQsucjrt": "YQsucjrt", # Theme Of Kalki
    "DYh1AFst": "Oog5_PCO", # Bhairava Anthem
    "UBfWIaEr": "UBfWIaEr", # Bujji Theme
    "2QkN1i_c": "2QkN1i_c"  # Ta Takkara
}

def normalize_string(s: str) -> str:
    """Normalize string for comparison."""
    if not s: return ""
    s = html.unescape(s)
    s = s.lower()
    # Remove common suffixes and special characters
    suffixes = ["(from", "original motion", "soundtrack", "official", "video", "lyrics"]
    for suffix in suffixes:
        if suffix in s:
            s = s.split(suffix)[0]
    return "".join(c for c in s if c.isalnum()).strip()

def validate_songs():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV not found at {CSV_PATH}")
        return

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Starting validation for {len(rows)} songs...")
    
    mismatches = []
    checked_count = 0
    match_count = 0
    skipped_no_saavn = 0
    skipped_bad_id = 0

    for i, row in enumerate(rows):
        song_id = row.get("id", "")
        if not song_id or song_id == "#NAME?":
            skipped_bad_id += 1
            continue
            
        csv_url = row.get("url", "")
        if "saavncdn.com" not in csv_url:
            skipped_no_saavn += 1
            continue
            
        checked_count += 1
        lookup_id = VERIFIED_IDS.get(song_id, song_id)
        csv_title = row.get("title", "")
        csv_artist = row.get("artist", "")
        
        if checked_count % 50 == 0:
            print(f"[{i}/{len(rows)}] Checked: {checked_count}, Mismatches: {len(mismatches)}, Skipped: {skipped_no_saavn + skipped_bad_id}")
            
        try:
            url = f"{API_BASE}/{lookup_id}"
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                print(f"    [Error] ID {lookup_id} returned {response.status_code} for {csv_title}")
                continue
                
            data = response.json()
            results = data.get("data", [])
            if not results:
                print(f"    [Error] ID {lookup_id} returned empty results for {csv_title}")
                continue
                
            api_song = results[0]
            api_title = api_song.get("name", "")
            
            # API can have primary artists or a simple string
            api_artists_data = api_song.get("artists", {}).get("primary", [])
            if isinstance(api_artists_data, list):
                api_artist_str = ", ".join([a.get("name", "") for a in api_artists_data])
            else:
                api_artist_str = str(api_artists_data)

            # Verification logic
            norm_csv_title = normalize_string(csv_title)
            norm_api_title = normalize_string(api_title)
            
            # Use partial matching (title match or one is subset of other)
            title_match = norm_csv_title in norm_api_title or norm_api_title in norm_csv_title
            
            if title_match:
                match_count += 1
            else:
                mismatch = {
                    "id": song_id,
                    "lookup_id": lookup_id,
                    "csv_title": csv_title,
                    "api_title": api_title,
                    "csv_artist": csv_artist,
                    "api_artist": api_artist_str
                }
                mismatches.append(mismatch)
                print(f"  [MISMATCH] {csv_title} != {api_title}")

        except Exception as e:
            print(f"    [Exception] {str(e)} for {csv_title}")
            
        # Very small delay to be safe
        time.sleep(0.01)

    # Final Report
    report = {
        "summary": {
            "total_in_csv": len(rows),
            "checked_saavn_songs": checked_count,
            "correct_matches": match_count,
            "mismatches_found": len(mismatches),
            "skipped_no_saavn": skipped_no_saavn,
            "skipped_bad_id": skipped_bad_id
        },
        "mismatches": mismatches
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\nValidation complete.")
    print(f"Correct: {match_count}")
    print(f"Mismatches: {len(mismatches)}")
    print(f"Report saved to {REPORT_PATH}")

if __name__ == "__main__":
    validate_songs()
