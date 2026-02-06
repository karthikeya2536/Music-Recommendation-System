import json
import random
import torch
import os
import numpy as np
from collections import defaultdict

# --- Configuration ---
DATASET_PATH = "../dataset.json" # Relative to recommendation_engine/
NUM_USERS = 100
MIN_INTERACTIONS = 5
MAX_INTERACTIONS = 50
ARTIST_AFFINITY_PROB = 0.7 # 70% chance to listen to preferred artist
RANDOM_SEED = 42

def load_data(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def simulate_graph_data():
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    print(f"Loading data from {DATASET_PATH}...")
    songs = load_data(DATASET_PATH)
    
    # 1. Mappings (ID -> Index)
    # We need to map string IDs to integer indices for PyTorch
    song_id_map = {s['id']: i for i, s in enumerate(songs)}
    
    unique_artists = sorted(list(set(s['artist'] for s in songs if s.get('artist'))))
    artist_id_map = {name: i for i, name in enumerate(unique_artists)}
    
    # Group songs by artist for simulation
    songs_by_artist = defaultdict(list)
    for s in songs:
        if s.get('artist'):
            songs_by_artist[s['artist']].append(s['id'])
            
    print(f"Stats: {len(songs)} Songs, {len(unique_artists)} Artists")

    # 2. Simulate Users
    user_interactions = [] # List of (user_idx, song_idx)
    user_preferences = {}  # user_idx -> [preferred_artist_names]

    print(f"Simulating {NUM_USERS} users...")
    for user_idx in range(NUM_USERS):
        # Assign 1-3 favorite artists
        num_favs = random.randint(1, 3)
        fav_artists = random.sample(unique_artists, num_favs)
        user_preferences[user_idx] = fav_artists
        
        # Determine number of listens
        num_listens = random.randint(MIN_INTERACTIONS, MAX_INTERACTIONS)
        
        listened_songs = set()
        
        for _ in range(num_listens):
            # Decide strategy: Pick from favorite artist OR random song
            if random.random() < ARTIST_AFFINITY_PROB:
                # Pick one of the fav artists
                chosen_artist = random.choice(fav_artists)
                # Pick a song by that artist
                artist_songs = songs_by_artist.get(chosen_artist, [])
                if artist_songs:
                    song_id = random.choice(artist_songs)
                else:
                    # Fallback if artist has no songs (shouldn't happen with logic above)
                    song_id = random.choice(songs)['id']
            else:
                # Random exploration
                song_id = random.choice(songs)['id']
            
            if song_id not in listened_songs:
                listened_songs.add(song_id)
                user_interactions.append((user_idx, song_id_map[song_id]))

    print(f"Generated {len(user_interactions)} interactions.")

    # 3. Create Edge Indices
    # User -> Song
    edge_index_user_song = torch.tensor(user_interactions, dtype=torch.long).t()
    
    # Song -> Artist
    song_artist_edges = []
    for s in songs:
        if s.get('artist') and s['artist'] in artist_id_map:
            s_idx = song_id_map[s['id']]
            a_idx = artist_id_map[s['artist']]
            song_artist_edges.append((s_idx, a_idx))
    
    edge_index_song_artist = torch.tensor(song_artist_edges, dtype=torch.long).t()

    # 4. Save Data
    data = {
        'num_users': NUM_USERS,
        'num_songs': len(songs),
        'num_artists': len(unique_artists),
        'song_id_map': song_id_map, # To map back to JSON
        'artist_id_map': artist_id_map,
        'user_preferences': user_preferences, # Ground truth for verification
        'edge_index_user_song': edge_index_user_song,
        'edge_index_song_artist': edge_index_song_artist
    }
    
    output_path = "graph_data.pt"
    torch.save(data, output_path)
    print(f"Graph data saved to {output_path}")

if __name__ == "__main__":
    simulate_graph_data()
