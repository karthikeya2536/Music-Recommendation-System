import torch
import json
import os

# --- Config ---
EMBEDDINGS_PATH = "final_embeddings.pt"
DATASET_PATH = "../dataset.json" # Relative
OUTPUT_PATH = "../frontend/public/recommendations.json"
TOP_K = 20
DEMO_USER_ID = 0

def generate_recommendations():
    print("Loading data...")
    # 1. Load Embeddings
    emb_data = torch.load(EMBEDDINGS_PATH)
    user_emb = emb_data['user_embeddings']
    song_emb = emb_data['song_embeddings']
    
    # 2. Load Metadata
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        songs_metadata = json.load(f)
        
    print(f"Generating recommendations for User {DEMO_USER_ID}...")
    
    # 3. Compute Scores
    # User Vector: [Dim]
    u_vec = user_emb[DEMO_USER_ID] 
    
    # Scores: [NumSongs]
    scores = torch.matmul(song_emb, u_vec)
    
    # 4. Rank
    top_scores, top_indices = torch.topk(scores, TOP_K)
    
    # 5. Format Output
    recommended_songs = []
    for idx_tensor in top_indices:
        idx = idx_tensor.item()
        # Map Index -> Song Metadata
        # We assume dataset.json order matched 0..N indices used in training
        # (which is true because simulate_data.py used strict enumeration)
        song = songs_metadata[idx]
        recommended_songs.append(song)
        
    # 6. Save to Frontend
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(recommended_songs, f, indent=2)
        
    print(f"Saved {len(recommended_songs)} recommendations to {OUTPUT_PATH}")
    print("Example Recs:")
    for s in recommended_songs[:3]:
        print(f"- {s['title']} ({s['artist']})")

if __name__ == "__main__":
    generate_recommendations()
