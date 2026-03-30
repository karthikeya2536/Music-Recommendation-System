import { Track } from '../types';
import { apiUrl, fetchWithAuth } from './api';

const FALLBACK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Simulation',
    artist: 'Demo Artist',
    album: 'SonicStream',
    coverUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 300,
    year: 2024,
    genre: 'Electronic',
  },
];

export const MOCK_TRACKS: Track[] = [];

export const fetchTrending = async (limit: number = 20): Promise<Track[]> => {
  try {
    const res = await fetch(apiUrl(`/tracks/trending?limit=${limit}`));
    if (!res.ok) throw new Error('Failed to fetch trending');
    const data = await res.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Fetch trending failed', error);
    return FALLBACK_TRACKS;
  }
};

export const fetchNewReleases = async (limit: number = 20): Promise<Track[]> => {
  try {
    const res = await fetch(apiUrl(`/tracks/new?limit=${limit}`));
    if (!res.ok) throw new Error('Failed to fetch new');
    const data = await res.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Fetch new failed', error);
    return FALLBACK_TRACKS;
  }
};

export const searchTracks = async (query: string): Promise<Track[]> => {
  if (!query) return [];
  try {
    const res = await fetch(apiUrl(`/tracks/search?q=${encodeURIComponent(query)}`));
    const data = await res.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Search failed', error);
    return [];
  }
};

export const getRecommendations = async (userId: string): Promise<Track[]> => {
  try {
    const res = await fetchWithAuth(`/recommend/${userId}`);
    const data = await res.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Recommendations failed', error);
    return [];
  }
};

export const getAllArtists = (): string[] => {
  return [];
};

export const getAllAlbums = (): string[] => {
  return [];
};

export const MOCK_PLAYLISTS = [{ id: 'p1', title: 'Top Hits', coverUrl: '', tracks: [] }];
