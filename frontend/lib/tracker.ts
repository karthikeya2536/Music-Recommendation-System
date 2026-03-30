import { fetchWithAuth } from './api';

export const trackListen = async (
  trackId: string,
  durationListened: number,
  totalDuration: number
) => {
  if (durationListened < 2) return;

  const percent = totalDuration > 0 ? durationListened / totalDuration : 0;
  const isComplete = percent > 0.9;

  const payload = {
    song_id: trackId,
    timestamp: Date.now(),
    duration_listened: durationListened,
    total_duration: totalDuration,
    percent_listened: percent,
    is_complete: isComplete,
  };

  console.log('[Tracker] Sending interaction:', payload);

  try {
    await fetchWithAuth('/interactions/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[Tracker] Failed to record interaction', error);
  }
};
