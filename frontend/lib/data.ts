import { Track } from '../types';
import { useAuthStore } from '../store';

// We keep a small local fallback just in case, but we try to avoid loading the huge JSON
const FALLBACK_TRACKS: Track[] = [
    {
        id: "1",
        title: "Simulation",
        artist: "Demo Artist",
        album: "SonicStream",
        coverUrl: "https://picsum.photos/200",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 300,
        year: 2024,
        genre: "Electronic"
    }
];

export const MOCK_TRACKS: Track[] = [];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const fetchTrending = async (limit: number = 20): Promise<Track[]> => {
    try {
        const res = await fetch(`${API_BASE}/tracks/trending?limit=${limit}`);
        if (!res.ok) throw new Error("Failed to fetch trending");
        const data = await res.json();
        return data.tracks || [];
    } catch (e) {
        console.error("Fetch trending failed", e);
        return FALLBACK_TRACKS;
    }
}

export const fetchNewReleases = async (limit: number = 20): Promise<Track[]> => {
    try {
        const res = await fetch(`${API_BASE}/tracks/new?limit=${limit}`);
         if (!res.ok) throw new Error("Failed to fetch new");
        const data = await res.json();
        return data.tracks || [];
    } catch (e) {
        console.error("Fetch new failed", e);
        return FALLBACK_TRACKS;
    }
}

export const searchTracks = async (query: string): Promise<Track[]> => {
    if (!query) return [];
    try {
        const res = await fetch(`${API_BASE}/tracks/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data.tracks || [];
    } catch (e) {
        console.error("Search failed", e);
        return [];
    }
}

export const getRecommendations = async (userId: string): Promise<Track[]> => {
    try {
        const res = await fetch(`${API_BASE}/recommend/${userId}`);
        const data = await res.json();
        return data.recommendations || [];
    } catch (e) {
        console.error("Recommendations failed", e);
        return [];
    }
}

// Helper: Get Artists (This should probably be an autocomplete API in real world)
// For now, we return empty or implement a specific 'artists' endpoint if needed.
export const getAllArtists = (): string[] => {
    return [];
};

export const getAllAlbums = (): string[] => {
    return [];
};

export const MOCK_PLAYLISTS = [
    { id: 'p1', title: 'Top Hits', coverUrl: 'https://picsum.photos/id/1/200/200', tracks: [] },
];

