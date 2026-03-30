import csv
import json
import os
import time
import requests
from typing import Optional, List, Dict

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(BASE_DIR), "songs.csv")
# API endpoints
SEARCH_ENDPOINTS = [
    "http://127.0.0.1:3000/api/search/songs"
]
SONG_ENDPOINTS = [
    "http://127.0.0.1:3000/api/songs"
]

# Manually verified IDs for Kalki tracks (Telugu versions)
VERIFIED_IDS = {
    "YQsucjrt": "YQsucjrt", # Theme Of Kalki
    "DYh1AFst": "Oog5_PCO", # Bhairava Anthem (Verified ID is Oog5_PCO)
    "UBfWIaEr": "UBfWIaEr", # Bujji Theme
    "2QkN1i_c": "2QkN1i_c"  # Ta Takkara
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

import html

def clean_query(title: str, artist: str = "") -> str:
    # Unescape HTML entities like &quot;
    title = html.unescape(title)
    # Remove common suffixes that confuse search
    clean_title = title.split('(From')[0].split('(Original')[0].split('(')[0].strip()
    # Take first artist only if available
    clean_artist = ""
    if artist:
        clean_artist = artist.replace(',', ' ').split(' ')[0]
    return f"{clean_title} {clean_artist}".strip()

def fetch_by_id(song_id: str) -> Optional[str]:
    # Some IDs in CSV might be malformed or placeholder
    if not song_id or len(song_id) < 4 or "#" in song_id:
        return None
        
    for base_url in SONG_ENDPOINTS:
        try:
            # Use path parameter for JioSaavn API v2 style lookups
            url = f"{base_url}/{song_id}"
            response = requests.get(url, headers=HEADERS, timeout=10)
            if response.status_code != 200:
                print(f"    - ID lookup failed with status {response.status_code}")
                continue
            
            data = response.json()
            # The API returns {"success": true, "data": [...] }
            results = data.get("data", [])
            if not results:
                print(f"    - ID lookup returned success but empty data")
                continue
            
            # Use the first song in the data array
            song = results[0]
            download_urls = song.get("downloadUrl")
            if not download_urls:
                print(f"    - ID lookup found song but no downloadUrl")
                continue

            if isinstance(download_urls, list):
                high_quality = next((item["url"] for item in reversed(download_urls) if item.get("quality") == "320kbps"), None)
                return high_quality or download_urls[-1]["url"]
            elif isinstance(download_urls, str):
                return download_urls
        except Exception as e:
            print(f"    - ID lookup exception: {str(e)}")
            continue
    return None

def fetch_real_url(title: str, artist: str) -> Optional[str]:
    queries = [
        f"{title} {artist}".strip(),
        clean_query(title, artist),
        title.split('(From')[0].split('(')[0].strip()
    ]
    
    for query in queries:
        print(f"  Searching for: {query}...")
        for base_url in SEARCH_ENDPOINTS:
            try:
                params = {"query": query, "limit": 1}
                response = requests.get(base_url, params=params, headers=HEADERS, timeout=10)
                if response.status_code != 200: continue
                    
                data = response.json()
                results = data.get("data", {}).get("results", []) or data.get("results", [])
                if not results: continue
                
                song = results[0]
                download_urls = song.get("downloadUrl")
                if not download_urls: continue

                if isinstance(download_urls, list):
                    high_quality = next((link["link"] for link in reversed(download_urls) if link.get("quality") == "320kbps"), None)
                    return high_quality or download_urls[-1]["link"]
                elif isinstance(download_urls, str):
                    return download_urls
            except:
                continue
    return None

def migrate_songs(limit: int = 1000):
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV not found at {CSV_PATH}")
        return

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        rows = list(reader)

    print(f"Starting migration for up to {limit} songs...")
    
    updated_count = 0
    for row in rows:
        if updated_count >= limit:
            break
            
        # Skip if already a Saavn URL
        if "saavncdn.com" in row.get("url", ""):
            continue

        song_id = row.get("id", "")
        lookup_id = VERIFIED_IDS.get(song_id, song_id)
        title = row.get("title", "")
        artist = row.get("artist", "")
        
        print(f"Processing: {title} (ID: {song_id})...")
        
        # 1. Try direct ID lookup
        real_url = fetch_by_id(lookup_id)
        
        # 2. Fallback to search if lookup fails
        if not real_url:
            real_url = fetch_real_url(title, artist)
        
        if real_url:
            print(f"  + SUCCESS: Found URL")
            row["url"] = real_url
            updated_count += 1
            
            # Save INCREMENTALLY to prevent loss
            with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
        else:
            print(f"  - FAILED: Could not find URL")
        
        # Very small delay
        time.sleep(0.1)

    print(f"Migration phase complete. Updated {updated_count} songs.")

if __name__ == "__main__":
    # Run full migration
    migrate_songs(limit=1000)
