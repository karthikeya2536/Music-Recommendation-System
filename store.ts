import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerState, AuthState, Track } from './types';
import { MOCK_TRACKS, MOCK_PLAYLISTS } from './lib/data';

// Mock tracks for the queue logic
const MOCK_QUEUE: Track[] = MOCK_TRACKS;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playbackState: 'paused',
  queue: MOCK_QUEUE,
  volume: 0.7,
  progress: 0,
  currentTime: 0,

  playTrack: (track) => {
    set({ currentTrack: track, playbackState: 'playing' });
  },
  
  togglePlay: () => set((state) => ({ 
    playbackState: state.playbackState === 'playing' ? 'paused' : 'playing' 
  })),
  
  setVolume: (volume) => set({ volume }),
  
  setProgress: (progress) => set({ progress }),

  setCurrentTime: (currentTime) => set({ currentTime }),
  
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    const idx = queue.findIndex(t => t.id === currentTrack.id);
    if (idx < queue.length - 1) {
      set({ currentTrack: queue[idx + 1], playbackState: 'playing' });
    } else {
      set({ playbackState: 'paused', progress: 0 });
    }
  },
  
  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    const idx = queue.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) {
      set({ currentTrack: queue[idx - 1], playbackState: 'playing' });
    }
  },

  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      library: {
        liked: ['1', '5', '8'], // Mock initial liked IDs
        playlists: MOCK_PLAYLISTS,
        history: []
      },

      login: async (provider) => {
        set({ isLoading: true });
        // Simulate network delay for OAuth
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        set({ 
          isAuthenticated: true, 
          isLoading: false,
          user: { 
            id: 'u_123456', 
            name: 'Alex Sonic', 
            email: 'alex@sonicstream.app',
            avatar: 'https://picsum.photos/id/64/200/200',
            plan: 'premium',
            joinedAt: new Date().toISOString()
          } 
        });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
        // Optional: clear library or keep it cached
      },

      toggleLike: (trackId) => set((state) => {
        const liked = state.library.liked.includes(trackId)
          ? state.library.liked.filter(id => id !== trackId)
          : [...state.library.liked, trackId];
        return { library: { ...state.library, liked } };
      }),

      addToHistory: (track) => set((state) => {
        // Prevent duplicates at the top of the list
        const filtered = state.library.history.filter(t => t.id !== track.id);
        const newHistory = [track, ...filtered].slice(0, 50); // Keep last 50
        return { library: { ...state.library, history: newHistory } };
      }),
      
      createPlaylist: (title) => set((state) => ({
        library: {
          ...state.library,
          playlists: [
            ...state.library.playlists,
            {
              id: `p_${Date.now()}`,
              title,
              coverUrl: `https://picsum.photos/seed/${Date.now()}/300/300`,
              tracks: []
            }
          ]
        }
      }))
    }),
    {
      name: 'sonicstream-auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        user: state.user,
        library: state.library 
      }),
    }
  )
);
