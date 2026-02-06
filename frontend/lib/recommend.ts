
// Simple weighted preference system using LocalStorage

interface UserPreferences {
  [genre: string]: number;
}

const STORAGE_KEY = 'sonicstream_preferences';

export const recordInteraction = (genre?: string) => {
  if (!genre) return;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
    
    // Decay old scores slightly to keep it fresh? (Optional, skipping for MVP)
    // Increment score
    prefs[genre] = (prefs[genre] || 0) + 1;
    
    console.log(`[Recommender] Upvoted genre: ${genre}. New Score: ${prefs[genre]}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("Failed to save preferences", e);
  }
};

export const getPreferredGenres = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const prefs: UserPreferences = JSON.parse(raw);
    
    // Sort genres by score descending
    return Object.entries(prefs)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([genre]) => genre);
  } catch (e) {
    return [];
  }
};

export const getAffinityScore = (genre?: string): number => {
    if (!genre) return 0;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
        return prefs[genre] || 0;
    } catch {
        return 0;
    }
};
