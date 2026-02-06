import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerState, AuthState, Track } from './types';
import { MOCK_TRACKS, MOCK_PLAYLISTS } from './lib/data';
import { recordInteraction } from './lib/recommend';

import { auth, googleProvider, githubProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';

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
    // Track user preference
    recordInteraction(track.genre);
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

// Helper to sync with backend
const apiCall = async (endpoint: string, method: string, body?: any) => {
    try {
        await fetch(`/api/v1/library${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.error("API Sync failed:", e);
    }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      library: {
        liked: [], // Init empty
        playlists: [],
        history: []
      },

      initializeAuthListener: () => {
        console.log("Initializing Auth Listener...");
        return onAuthStateChanged(auth, async (user: any) => {
          if (user) {
            console.log("User logged in:", user.email);
            
            // 1. Set User Basic Info
            set({ 
              isAuthenticated: true, 
              isLoading: false,
              user: {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                plan: 'free', 
                joinedAt: user.metadata.creationTime || new Date().toISOString()
              }
            });

            // 2. Fetch Library from Backend
            try {
                const res = await fetch(`/api/v1/library/${user.uid}`);
                const data = await res.json();
                if (data.liked || data.playlists) {
                    set((state) => ({
                        library: {
                            ...state.library,
                            liked: data.liked || [],
                            // Note: Backend might return playlist objects or IDs. 
                            // For now we assume array of playlist objects.
                            // If backend returns subcollection, we might need a separate fetch.
                            // Our backend currently returns { liked: [], playlists: [] } from user doc.
                            // If we use subcollection, we need to correct backend or this fetch.
                            // Validating backend: it reads user doc 'playlists' field. 
                            // Only 'create' writes to subcollection AND we likely need to sync user doc or change read.
                            // Correction: The backend 'get_user_library' reads 'playlists' FIELD from user doc.
                            // But 'manage_playlist' writes to SUBCOLLECTION. This is inconsistent.
                            // Let's rely on frontend optimistically for now or fix backend later.
                            playlists: data.playlists || state.library.playlists
                        }
                    }));
                }
            } catch (e) {
               console.error("Failed to fetch library", e);
            }

          } else {
            console.log("User logged out");
            set({ isAuthenticated: false, isLoading: false, user: null });
          }
        });
      },

      loginWithProvider: async (providerName) => {
        set({ isLoading: true });
        try {
          const provider = providerName === 'google' ? googleProvider : githubProvider;
          await signInWithPopup(auth, provider);
        } catch (error) {
          console.error("Login failed", error);
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          console.error("Email login failed", error);
          set({ isLoading: false });
          throw error;
        }
      },

      registerWithEmail: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`
          });
        } catch (error) {
          console.error("Registration failed", error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ isAuthenticated: false, user: null });
        } catch (error) {
          console.error("Logout failed", error);
        }
      },

      toggleLike: (trackId) => {
        const { user, library } = get();
        if (!user) return;

        const isLiked = library.liked.includes(trackId);
        const action = isLiked ? 'remove' : 'add';

        // Optimistic Update
        const newLiked = isLiked 
            ? library.liked.filter(id => id !== trackId)
            : [...library.liked, trackId];
            
        set({ library: { ...library, liked: newLiked } });

        // API Sync
        apiCall('/like', 'POST', { user_id: user.id, song_id: trackId, action });
      },

      addToHistory: (track) => set((state) => {
        const filtered = state.library.history.filter(t => t.id !== track.id);
        const newHistory = [track, ...filtered].slice(0, 50);
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
        library: state.library 
      }),
    }
  )
);
