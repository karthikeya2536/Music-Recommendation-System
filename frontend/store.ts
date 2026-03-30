import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerState, AuthState } from './types';
import { recordInteraction } from './lib/recommend';

import { auth, googleProvider, githubProvider } from './lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { fetchWithAuth } from './lib/api';

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playbackState: 'paused',
  queue: [],
  volume: 0.7,
  progress: 0,
  currentTime: 0,

  playTrack: (track) => {
    recordInteraction(track.genre);
    const { queue } = get();
    const exists = queue.some((t) => t.id === track.id);
    if (!exists) {
      set({ queue: [...queue, track] });
    }
    set({ currentTrack: track, playbackState: 'playing' });
  },

  togglePlay: () =>
    set((state) => ({
      playbackState: state.playbackState === 'playing' ? 'paused' : 'playing',
    })),

  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTime) => set({ currentTime }),

  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx < queue.length - 1) {
      set({ currentTrack: queue[idx + 1], playbackState: 'playing' });
    } else {
      set({ playbackState: 'paused', progress: 0 });
    }
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) {
      set({ currentTrack: queue[idx - 1], playbackState: 'playing' });
    }
  },

  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
}));

const apiCall = async (endpoint: string, method: string, body?: any) => {
  try {
    await fetchWithAuth(`/library${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('API Sync failed:', error);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      library: {
        liked: [],
        playlists: [],
        history: [],
      },

      initializeAuthListener: () => {
        console.log('Initializing Auth Listener...');
        return onAuthStateChanged(auth, async (user: any) => {
          if (user) {
            console.log('User logged in:', user.email);

            set({
              isAuthenticated: true,
              isLoading: false,
              user: {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                avatar:
                  user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                plan: 'free',
                joinedAt: user.metadata.creationTime || new Date().toISOString(),
              },
            });

            try {
              const res = await fetchWithAuth(`/library/${user.uid}`);
              const data = await res.json();
              if (data.liked || data.playlists) {
                set((state) => ({
                  library: {
                    ...state.library,
                    liked: data.liked || [],
                    playlists: data.playlists || state.library.playlists,
                  },
                }));
              }
            } catch (error) {
              console.error('Failed to fetch library', error);
            }
          } else {
            console.log('User logged out');
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
          console.error('Login failed', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          console.error('Email login failed', error);
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
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`,
          });
        } catch (error) {
          console.error('Registration failed', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ isAuthenticated: false, user: null });
        } catch (error) {
          console.error('Logout failed', error);
        }
      },

      toggleLike: (trackId) => {
        const { user, library } = get();
        if (!user) return;

        const isLiked = library.liked.includes(trackId);
        const action = isLiked ? 'remove' : 'add';

        const newLiked = isLiked
          ? library.liked.filter((id) => id !== trackId)
          : [...library.liked, trackId];

        set({ library: { ...library, liked: newLiked } });

        apiCall('/like', 'POST', { song_id: trackId, action });
      },

      addToHistory: (track) =>
        set((state) => {
          const filtered = state.library.history.filter((t) => t.id !== track.id);
          const newHistory = [track, ...filtered].slice(0, 50);
          return { library: { ...state.library, history: newHistory } };
        }),

      createPlaylist: (title) => {
        const { user, library } = get();
        const newPlaylist = {
          id: `p_${Date.now()}`,
          title,
          coverUrl: '',
          tracks: [],
        };

        set({
          library: {
            ...library,
            playlists: [...library.playlists, newPlaylist],
          },
        });

        if (user) {
          apiCall('/playlist', 'POST', { playlist: newPlaylist });
        }
      },

      clearHistory: () =>
        set((state) => ({
          library: { ...state.library, history: [] },
        })),

      updateAvatar: (url) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar: url } : null,
        })),
    }),
    {
      name: 'sonicstream-auth-storage',
      partialize: (state) => ({
        library: state.library,
      }),
    }
  )
);
