
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  lyrics?: { time: number; text: string }[];
}

export interface Playlist {
  id: string;
  title: string;
  coverUrl: string;
  tracks: Track[];
  description?: string;
  creator?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'free' | 'premium';
  joinedAt: string;
}

export type PlaybackState = 'playing' | 'paused' | 'loading';

export interface PlayerState {
  currentTrack: Track | null;
  playbackState: PlaybackState;
  queue: Track[];
  volume: number;
  progress: number; // 0 to 1
  currentTime: number;
  
  // Actions
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (track: Track) => void;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  library: {
    liked: string[]; // Track IDs
    playlists: Playlist[];
    history: Track[];
  };
  login: (provider: string) => Promise<void>;
  logout: () => void;
  toggleLike: (trackId: string) => void;
  addToHistory: (track: Track) => void;
  createPlaylist: (title: string) => void;
}
