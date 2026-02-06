import torch

def load_graph_data(data_path="graph_data.pt"):
    print(f"Loading graph data from {data_path}...")
    try:
        raw_data = torch.load(data_path)
    except FileNotFoundError:
        print("Error: graph_data.pt not found. Run simulate_data.py first.")
        return None

    # Prepare adjacency indices for message passing
    # Edge Index: [2, num_edges]
    # We need to efficiently query neighbors. 
    
    # 1. User -> Song (Listens)
    user_song_edges = raw_data['edge_index_user_song']
    
    # 2. Song -> Artist (Created By)
    song_artist_edges = raw_data['edge_index_song_artist']

    print(f"Graph Stats:")
    print(f"- Users: {raw_data['num_users']}")
    print(f"- Songs: {raw_data['num_songs']}")
    print(f"- Artists: {raw_data['num_artists']}")
    print(f"- User-Song Edges: {user_song_edges.shape[1]}")
    print(f"- Song-Artist Edges: {song_artist_edges.shape[1]}")

    return {
        'num_users': raw_data['num_users'],
        'num_songs': raw_data['num_songs'],
        'num_artists': raw_data['num_artists'],
        'user_song_edges': user_song_edges,
        'song_artist_edges': song_artist_edges
    }

if __name__ == "__main__":
    load_graph_data()
