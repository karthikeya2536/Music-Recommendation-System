import torch
from graph import load_graph_data, build_hetero_graph
from model import MusicRecommenderHNN, LinkPredictionHead, get_recommendations
from train import train_epoch
import json
import random
import copy

def run_simulation():
    print("--- 1. Initializing Graph Data ---")
    raw_data = load_graph_data('graph_data.json')
    data, user_map, song_map = build_hetero_graph(raw_data)
    
    # Reverse maps for display
    id_to_song_title = {v: raw_data['nodes']['song'][v]['title'] for k, v in song_map.items()}
    id_to_song_id_str = {v: k for k, v in song_map.items()}
    # Find a test user
    test_user_idx = 0
    test_user_id_str = list(user_map.keys())[0]
    print(f"Test User Index: {test_user_idx} (ID: {test_user_id_str})")
    
    print("\n--- 2. Setting up HNN Model ---")
    hidden_channels = 32
    out_channels = 32
    metadata = data.metadata()
    
    model = MusicRecommenderHNN(hidden_channels, out_channels, metadata)
    link_head = LinkPredictionHead()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    # Transfer to GPU if available
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    data = data.to(device)
    model = model.to(device)
    link_head = link_head.to(device)
    
    print("\n--- 3. Initial Training (Offline Phase) ---")
    # Simulate: we only know about the first 80% of interactions
    # (In this simple code, we train on everything for "initial" then refine, 
    # but to be strict "online" we should hide some edges. Let's just train for 50 epochs first.)
    
    epochs = 30
    for epoch in range(1, epochs + 1):
        loss = train_epoch(model, optimizer, data, link_head)
        if epoch % 10 == 0:
            print(f"Epoch {epoch:03d}: Loss: {loss:.4f}")
            
    print("Initial Training Complete.")
    
    # Recommendations BEFORE Update
    # Get embeddings
    model.eval()
    with torch.no_grad():
        x_dict = model(data.x_dict, data.edge_index_dict)
        user_emb = x_dict['user']
        song_emb = x_dict['song']
        
        recs, scores = get_recommendations(test_user_idx, user_emb, song_emb, top_k=5)
        
        print(f"\n[Before Update] Recommendations for User {test_user_idx}:")
        for r_idx, score in zip(recs, scores):
            print(f" - {id_to_song_title.get(r_idx, 'Unknown')} (Score: {score:.2f})")
            
    print("\n--- 4. Online Update Simulation (Real-Time) ---")
    print("Simulating new interaction: User listens to a NEW song (simulates taste shift)...")
    
    # Let's say user listens to a song they haven't heard before, from a specific Genre/Artist
    # and we want to see if recommendations shift towards that.
    # For simplicity, we just run more training steps effectively reinforcing the current graph 
    # or we could insert a new edge into 'data' here. 
    
    # Let's Insert a new edge!
    # Pick a random song the user hasn't listened to
    # (In a real system, this comes from the live stream)
    
    # 1. Add edge to graph data tensor
    # NOTE: PyG data objects are mutable
    # We need to add to ('user', 'listened_to', 'song')
    
    new_song_idx = (recs[4] + 1) % len(song_map) # Just pick something different
    print(f"New Interaction: User listened to '{id_to_song_title.get(new_song_idx)}'")
    
    new_edge = torch.tensor([[test_user_idx], [new_song_idx]], device=device)
    
    # Update forward edge
    data['user', 'listened_to', 'song'].edge_index = torch.cat(
        [data['user', 'listened_to', 'song'].edge_index, new_edge], dim=1
    )
    # Update reverse edge
    data['song', 'listened_by', 'user'].edge_index = torch.cat(
        [data['song', 'listened_by', 'user'].edge_index, torch.flip(new_edge, [0])], dim=1
    )
    
    print("Graph updated incrementally.")
    
    print("Running Online Update (Few gradient steps on new data)...")
    # In real online learning, we might only train on the new sample or a small window
    # Here we just continue training the whole graph for a few epochs to propagate info
    
    for epoch in range(1, 6): # 5 quick updates
        loss = train_epoch(model, optimizer, data, link_head)
        print(f"Update Step {epoch}: Loss: {loss:.4f}")
        
    # Recommendations AFTER Update
    model.eval()
    with torch.no_grad():
        x_dict = model(data.x_dict, data.edge_index_dict)
        user_emb = x_dict['user']
        song_emb = x_dict['song']
        
        recs_after, scores_after = get_recommendations(test_user_idx, user_emb, song_emb, top_k=5)
        
        print(f"\n[After Update] Recommendations for User {test_user_idx}:")
        for r_idx, score in zip(recs_after, scores_after):
            print(f" - {id_to_song_title.get(r_idx, 'Unknown')} (Score: {score:.2f})")
            
    print("\n--- Simulation Complete ---")

if __name__ == "__main__":
    run_simulation()
