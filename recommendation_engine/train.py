import torch
import torch.nn as nn
import torch.optim as optim
from graph import load_graph_data
from model import HeteroGNN
import time
import random

# --- Config ---
EMBEDDING_DIM = 64
LR = 0.001
EPOCHS = 50
BATCH_SIZE = 1024  # Large batch for BPR
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def train():
    print(f"Training on {DEVICE}...")
    
    # 1. Load Data
    data = load_graph_data()
    if not data: return

    num_users = data['num_users']
    num_songs = data['num_songs']
    num_artists = data['num_artists']
    
    # Adjacency Lists (for Message Passing)
    user_song_adj = data['user_song_edges'].to(DEVICE)     # [2, E_us]
    song_artist_adj = data['song_artist_edges'].to(DEVICE) # [2, E_sa]

    # Training Edges (Positive Samples)
    # We use the same edges for message passing AND training for this transductive demo.
    # In rigorous setups, you'd split edges.
    train_pos_u = user_song_adj[0]
    train_pos_s = user_song_adj[1]
    num_edges = train_pos_u.shape[0]

    # 2. Model & Opt
    model = HeteroGNN(num_users, num_songs, num_artists, EMBEDDING_DIM).to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=LR)
    
    # 3. Training Loop
    model.train()
    
    for epoch in range(EPOCHS):
        total_loss = 0
        
        # Shuffle training edges
        perm = torch.randperm(num_edges)
        train_pos_u = train_pos_u[perm]
        train_pos_s = train_pos_s[perm]
        
        # 1. Forward Pass (Get UPDATED embeddings via Message Passing)
        # We do this once per epoch (Full Batch GNN) or per large batch
        # For this dataset size, Full Batch is fast and stable.
        u_emb_final, s_emb_final = model(user_song_adj, song_artist_adj)
        
        # 2. Mini-batching for BPR Loss
        for i in range(0, num_edges, BATCH_SIZE):
            batch_u_idx = train_pos_u[i:i+BATCH_SIZE]
            batch_pos_s_idx = train_pos_s[i:i+BATCH_SIZE]
            current_batch_size = len(batch_u_idx)
            
            # Negative Sampling
            batch_neg_s_idx = torch.randint(0, num_songs, (current_batch_size,), device=DEVICE)
            
            # Look up embeddings
            u_e = u_emb_final[batch_u_idx]
            pos_s_e = s_emb_final[batch_pos_s_idx]
            neg_s_e = s_emb_final[batch_neg_s_idx]
            
            # Compute Scores (Dot Product)
            pos_scores = (u_e * pos_s_e).sum(dim=1)
            neg_scores = (u_e * neg_s_e).sum(dim=1)
            
            # BPR Loss: -ln(sigmoid(pos - neg))
            loss = -torch.log(torch.sigmoid(pos_scores - neg_scores) + 1e-10).mean()
            
            optimizer.zero_grad()
            loss.backward(retain_graph=True) # Retain graph because u_emb_final depends on graph
            optimizer.step()
            
            total_loss += loss.item()

            # Detach to save memory if doing multi-step (not strictly needed for BPR here but good practice)
            # But since we re-compute forward pass next epoch, we are fine.

        if (epoch+1) % 5 == 0:
            print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {total_loss:.4f}")

    # 4. Save Model & Embeddings
    torch.save(model.state_dict(), "hnn_model.pth")
    print("\nModel saved to hnn_model.pth")
    
    # Save Final Embeddings for Inference
    model.eval()
    with torch.no_grad():
        final_u, final_s = model(user_song_adj, song_artist_adj)
        torch.save({
            'user_embeddings': final_u.cpu(),
            'song_embeddings': final_s.cpu()
        }, "final_embeddings.pt")
        print("Final embeddings saved to final_embeddings.pt")

if __name__ == "__main__":
    train()
