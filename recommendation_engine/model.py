import torch
import torch.nn as nn
import torch.nn.functional as F

class HeteroGNN(nn.Module):
    def __init__(self, num_users, num_songs, num_artists, hidden_dim=64):
        super().__init__()
        
        # --- 1. Base Embeddings (Node Features) ---
        self.user_emb = nn.Embedding(num_users, hidden_dim)
        self.song_emb = nn.Embedding(num_songs, hidden_dim)
        self.artist_emb = nn.Embedding(num_artists, hidden_dim)
        
        # --- 2. Transformation Layers (Message Passing Weights) ---
        # Transform Artist info before aggregating to Song
        self.W_artist_song = nn.Linear(hidden_dim, hidden_dim)
        
        # Transform Song info before aggregating to User
        self.W_song_user = nn.Linear(hidden_dim, hidden_dim)
        
        # Self-loops refinement (combine own embedding with neighbors)
        self.W_u_update = nn.Linear(hidden_dim * 2, hidden_dim)
        self.W_s_update = nn.Linear(hidden_dim * 2, hidden_dim)
        
        # Init weights
        nn.init.xavier_normal_(self.user_emb.weight)
        nn.init.xavier_normal_(self.song_emb.weight)
        nn.init.xavier_normal_(self.artist_emb.weight)

    def forward(self, user_song_adj, song_artist_adj):
        """
        Perform Message Passing Steps manually without sparse libraries.
        This is a 'Full Batch' forward pass logic for demo purposes.
        For massive scale, we would use mini-batch neighbor sampling.
        """
        
        # --- Step 0: Initial Embeddings ---
        h_u = self.user_emb.weight     # [NumUsers, Dim]
        h_s = self.song_emb.weight     # [NumSongs, Dim]
        h_a = self.artist_emb.weight   # [NumArtists, Dim]
        
        # --- Step 1: Artist -> Song Aggregation ---
        # "Songs represent their creators"
        # We need to compute mean(Artist Neighbors) for each song.
        # Since standard PyTorch scatter_reduce isn't always available/stable without extra libs,
        # we'll approximate or use a simple loop/index_add for this specific dataset size.
        
        # Create a buffer for aggregated artist info
        aggr_artist = torch.zeros_like(h_s)
        
        # Edges: [2, E_sa] -> (song_idx, artist_idx)
        song_indices = song_artist_adj[0]
        artist_indices = song_artist_adj[1]
        
        # Gather artist features per edge
        edge_artist_feats = h_a[artist_indices] # [E_sa, Dim]
        
        # Sum into songs (Scatter Add)
        # index_add_ is provided in core PyTorch
        aggr_artist.index_add_(0, song_indices, edge_artist_feats)
        
        # Normalize (divide by degree) - Optional, simplified here to just Sum or we can track counts
        # For this demo, Sum is fine as most songs have 1 artist.
        
        # Update Song Embeddings
        # h_s_new = W_update( [h_s || W_msg(aggr_artist)] )
        msg_artist = F.relu(self.W_artist_song(aggr_artist))
        h_s_new = self.W_s_update(torch.cat([h_s, msg_artist], dim=1))
        h_s_new = F.normalize(h_s_new, p=2, dim=1) # Normalize to stable sphere

        # --- Step 2: Song -> User Aggregation ---
        # "Users represent what they listen to"
        aggr_song = torch.zeros_like(h_u)
        
        # Edges: [2, E_us] -> (user_idx, song_idx)
        user_indices = user_song_adj[0]
        song_indices_us = user_song_adj[1]
        
        # Gather *UPDATED* song features
        edge_song_feats = h_s_new[song_indices_us]
        
        # Sum into users
        aggr_song.index_add_(0, user_indices, edge_song_feats)
        
        # Update User Embeddings
        msg_song = F.relu(self.W_song_user(aggr_song))
        h_u_new = self.W_u_update(torch.cat([h_u, msg_song], dim=1))
        h_u_new = F.normalize(h_u_new, p=2, dim=1)
        
        return h_u_new, h_s_new

    def predict_pair(self, u_emb, s_emb, u_idx, s_idx):
        # Retrieve final embeddings
        u_e = u_emb[u_idx]
        s_e = s_emb[s_idx]
        # Dot product
        return (u_e * s_e).sum(dim=1)
