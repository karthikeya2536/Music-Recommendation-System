
// Helper to fetch real audio URLs from free public APIs

interface SaavnSong {
    id: string;
    name: string;
    url: string;
    downloadUrl: { quality: string; link: string }[] | string; // API structure varies
}

const API_ENDPOINTS = [
    'https://saavn.dev/api/search/songs',
    'https://saavn.me/search/songs'
];

export async function fetchRealAudioUrl(query: string): Promise<string | null> {
    const encodedQuery = encodeURIComponent(query);
    
    for (const baseUrl of API_ENDPOINTS) {
        try {
            const res = await fetch(`${baseUrl}?query=${encodedQuery}&limit=1`);
            if (!res.ok) continue;
            
            const data = await res.json();
            
            // Handle different API response structures
            let song = null;
            if (data.data && data.data.results && data.data.results.length > 0) {
                // saavn.dev structure
                song = data.data.results[0];
            } else if (data.data && data.data.length > 0) {
                // saavn.me structure sometimes
                song = data.data[0];
            } else if (data.results && data.results.length > 0) {
                song = data.results[0];
            }

            if (song) {
                // Try to find 320kbps or fallback to best available
                return extractDownloadUrl(song);
            }
        } catch (e) {
            console.warn(`Failed to fetch from ${baseUrl}`, e);
        }
    }
    
    return null;
}

function extractDownloadUrl(song: any): string | null {
    if (!song.downloadUrl) return null;

    // Type A: downloadUrl is an array of objects { quality, link }
    if (Array.isArray(song.downloadUrl)) {
        // Sort by quality (320kbps > 160kbps > ...)
        // Usually the last one is highest quality or check 'quality' field
        const sorted = [...song.downloadUrl].reverse(); 
        return sorted[0]?.link || sorted[0]?.url || null;
    }
    
    // Type B: downloadUrl is a string (rare but possible in some wrappers)
    if (typeof song.downloadUrl === 'string') {
        return song.downloadUrl;
    }

    return null;
}
