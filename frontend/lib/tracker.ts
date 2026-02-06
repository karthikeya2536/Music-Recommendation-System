export const trackListen = async (
    trackId: string, 
    userId: string, 
    durationListened: number, 
    totalDuration: number
) => {
    // Basic validation
    if (durationListened < 2) return; // Ignore accidental clicks < 2s

    const percent = totalDuration > 0 ? durationListened / totalDuration : 0;
    const isComplete = percent > 0.9;

    const payload = {
        user_id: userId,
        song_id: trackId,
        timestamp: Date.now(),
        duration_listened: durationListened,
        total_duration: totalDuration,
        percent_listened: percent,
        is_complete: isComplete
    };

    console.log("[Tracker] Sending interaction:", payload);

    try {
        // Use navigator.sendBeacon for reliable sending on unload/change
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const success = navigator.sendBeacon('/api/track', blob);
        
        if (!success) {
             // Fallback to fetch
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    } catch (e) {
        console.error("[Tracker] Failed to record interaction", e);
    }
};
