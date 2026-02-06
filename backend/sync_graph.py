import torch
import firebase_admin
from firebase_admin import credentials, firestore
import os
import os
import sys

# Try package import first, then fallback to local
try:
    from backend.id_mapper import get_user_idx
except ImportError:
    try:
        from id_mapper import get_user_idx
    except ImportError:
        # Fallback for when running from root without module context
        sys.path.append(os.path.dirname(__file__)) 
        from id_mapper import get_user_idx

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__)) # sonicstream/
REC_DIR = os.path.join(BASE_DIR, "recommendation_engine")
GRAPH_PATH = os.path.join(REC_DIR, "graph_data.pt")
DATASET_PATH = os.path.join(REC_DIR, "dataset.json") # or ../dataset.json

# Init Firebase (if not already)
def get_db():
    if not firebase_admin._apps:
        cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            print("No serviceAccountKey.json found. Skipping sync.")
            return None
    return firestore.client()

def sync_interactions_to_graph():
    print("Syncing interactions from Firestore to Graph...")
    
    # 1. Load existing graph
    if not os.path.exists(GRAPH_PATH):
        print("Graph file not found. Run simulation first.")
        return

    graph_data = torch.load(GRAPH_PATH)
    
    # Original Edges
    # [2, E]
    user_song_edges = graph_data['edge_index_user_song']
    
    # 2. Fetch new interactions
    db = get_db()
    if not db: return

    interactions_ref = db.collection('interactions')
    # Optimization: Filter by timestamp > last_sync? For now, fetch all.
    docs = interactions_ref.stream()
    
    new_edges_u = []
    new_edges_s = []
    
    count = 0
    for doc in docs:
        data = doc.to_dict()
        uid_str = data.get('user_id')
        song_id_str = data.get('song_id') # Usually "10", "55", etc. from dataset
        
        # Check if valid listen
        if data.get('duration_listened', 0) < 10:
            continue
            
        # Map User
        u_idx = get_user_idx(uid_str, create=True)
        
        # Map Song (Assumes song_id matches dataset index for MVP)
        # In real app, we need a song_id_mapper too if IDs are strings like "s_123"
        # Our dataset.json has numeric IDs mostly or we parse them.
        try:
            s_idx = int(song_id_str)
        except:
             # If song_id is 's_10', strip
             try:
                s_idx = int(str(song_id_str).replace('s_', ''))
             except:
                continue

        new_edges_u.append(u_idx)
        new_edges_s.append(s_idx)
        count += 1
        
    print(f"Found {count} valid new interactions.")
    
    if count == 0:
        return

    # 3. Merge Edges
    # Convert to Tensor
    new_u_tensor = torch.tensor(new_edges_u, dtype=torch.long)
    new_s_tensor = torch.tensor(new_edges_s, dtype=torch.long)
    
    # Stack [ [u...], [s...] ]
    new_edges_stack = torch.stack([new_u_tensor, new_s_tensor], dim=0)
    
    # Concatenate with existing
    updated_edges = torch.cat([user_song_edges, new_edges_stack], dim=1)
    
    # Update Graph Data
    graph_data['edge_index_user_song'] = updated_edges
    
    # Update num_users if needed
    # We might need to resize if new users > old num_users
    # For GNN logic, we just need embeddings to exist.
    # The 'num_users' in graph_data is just metadata usually.
    # But we should update it.
    from id_mapper import load_mapping
    mapping = load_mapping()
    max_idx = mapping['next_idx']
    if max_idx > graph_data['num_users']:
        graph_data['num_users'] = max_idx
        print(f"Updated num_users to {max_idx}")

    # Save
    torch.save(graph_data, GRAPH_PATH)
    print("Graph updated and saved!")

if __name__ == "__main__":
    sync_interactions_to_graph()
