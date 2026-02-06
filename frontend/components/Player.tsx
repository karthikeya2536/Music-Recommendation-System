import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart, ChevronDown, Mic2, Youtube, Sparkles, Loader2 } from 'lucide-react';
import { usePlayerStore, useAuthStore } from '../store';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AudioVisualizer } from './ui/audio-visualizer';
import { AuroraBackground } from './player/AuroraBackground';
import { trackListen } from '../lib/tracker';
import { AlbumArt } from './player/AlbumArt';
import { ProgressControl } from './player/ProgressControl';

// Helper to find Audio URL via JioSaavn
const CACHE_KEY = 'sonic_audio_cache_v1';

const fetchAudioUrl = async (query: string): Promise<string[]> => {
    // 1. Check Cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const cacheMap = JSON.parse(cached);
            if (cacheMap[query]) {
                console.log(`[Player] Cache Hit for: ${query}`);
                return cacheMap[query];
            }
        }
    } catch (e) {
        console.warn("Cache read failed", e);
    }

    // 2. Fetch from API (saavn.sumit.co)
    try {
        const targetUrl = `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`;
        console.log(`[Player] Searching API (Slow): ${targetUrl}`);
        const start = Date.now();
        
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        const duration = Date.now() - start;
        console.log(`[Player] Search completed in ${(duration/1000).toFixed(2)}s`);

        if (data.success && data.data && data.data.results && data.data.results.length > 0) {
            const song = data.data.results[0];
            const downloadUrls = song.downloadUrl;
            
            if (Array.isArray(downloadUrls) && downloadUrls.length > 0) {
               const urls = downloadUrls.map((d: any) => d.url).reverse().filter(Boolean);
               
               // 3. Update Cache
               try {
                   const cached = localStorage.getItem(CACHE_KEY);
                   const cacheMap = cached ? JSON.parse(cached) : {};
                   cacheMap[query] = urls;
                   // Simple limit: keep last 50? For now just unbound.
                   localStorage.setItem(CACHE_KEY, JSON.stringify(cacheMap));
               } catch (e) {
                   console.warn("Cache write failed (Quota?)", e);
               }

               return urls;
            }
        }
    } catch (e) {
        console.error("JioSaavn search failed", e);
    }
    return [];
};

export default function Player() {
  const { 
    currentTrack, playbackState, togglePlay, volume, setVolume, 
    progress, setProgress, setCurrentTime, nextTrack, prevTrack, currentTime,
    // We can add a setLoading action to store if we want global loading state, 
    // but local state is fine for now if we sync with playbackState
  } = usePlayerStore();
  
  const { addToHistory, toggleLike, library, isAuthenticated, user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Tracking Refs
  const listenedSeconds = useRef(0);
  const lastTrackId = useRef<string | null>(null);
  
  // Track listening duration (1s interactions)
  useEffect(() => {
      let interval: any;
      if (playbackState === 'playing') {
          interval = setInterval(() => {
              listenedSeconds.current += 1;
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [playbackState]);

  // Handle Track Change & Result Submission
  useEffect(() => {
      // 1. Submit Previous Track Data
      const submitPrevious = () => {
        if (lastTrackId.current && user?.id) {
            console.log(`[Player] Submitting stats for ${lastTrackId.current}: ${listenedSeconds.current}s`);
            // We need total duration. We can try to store it in a ref or just map it? 
            // Better to assume we have it via the Track object or just pass 0 if unknown, 
            // but we lose the 'currentTrack' reference to the OLD track here potentially.
            // Actually, we should capture the 'prevTrack' info.
            // Simplified: we rely on the fact that we can't easily get the old track's total duration 
            // unless we stored it. 
            // Let's rely on backend looking it up or store it in a ref.
        }
      };

      // Since we don't have the OLD track object here easily without extra state,
      // We will change the strategy: ONLY submit when we HAVE the old track info.
      // But React effects run AFTER the update.
      // Better strategy: Use a Ref to hold the CURRENT track object, and update it only after submitting.
  }, []);

  // Refined Tracking Effect
  const activeTrackRef = useRef(currentTrack);
  useEffect(() => {
      // Logic: This effect runs when currentTrack changes.
      // The 'activeTrackRef.current' holds the *previous* track (the one effectively ending).
      
      if (activeTrackRef.current && user?.id) {
          const prevTrack = activeTrackRef.current;
          const seconds = listenedSeconds.current;
          
          if (seconds > 0) {
              trackListen(prevTrack.id, user.id, seconds, prevTrack.duration);
          }
      }

      // Reset for new track
      activeTrackRef.current = currentTrack;
      listenedSeconds.current = 0;
      lastTrackId.current = currentTrack?.id || null;
      
  }, [currentTrack, user?.id]);
  
  // Playback State
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [candidateUrls, setCandidateUrls] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Derived State
  const isLiked = currentTrack ? library.liked.includes(currentTrack.id) : false;

  // Reset and Fetch Audio URL when track changes
  useEffect(() => {
      if (!currentTrack) return;

      let isMounted = true;
      const trackIdAtStart = currentTrack.id;

      console.log(`[Player] Track Changed: ${currentTrack.title}. Resetting...`);
      
      // IMMEDIATE RESET to prevent "Previous Song" ghosting
      setStreamUrl(null);
      setCandidateUrls([]);
      setCurrentUrlIndex(0);
      setIsEnhancing(true);
      setIsLoading(true);
      setIsExpanded(true); // Auto-Expand

      const loadAudio = async () => {
          // 1. Better Query Engineering
          // 1. Better Query Engineering
          // Robust cleanup: remove (...) content, split multiple artists
          const rawArtist = currentTrack.artist.replace(/\(.*\)/g, '').trim();
          const primaryArtist = rawArtist.split(/,|&|feat\.|ft\.|with/i)[0].trim();
          
          const cleanTitle = currentTrack.title.replace(/\(.*\)/g, '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
          
          // Strategy 1: Title + Primary Artist
          let query = `${cleanTitle} ${primaryArtist} Audio`;
          console.log(`[Player] Strategy 1: ${query}`);
          let urls = await fetchAudioUrl(query);

          // Strategy 2: Title + Album (if different from title)
          if (urls.length === 0 && currentTrack.album && currentTrack.album !== currentTrack.title) {
             const albumQuery = `${cleanTitle} ${currentTrack.album} Song`;
             console.log(`[Player] Strategy 2: ${albumQuery}`);
             urls = await fetchAudioUrl(albumQuery);
          }

          // Strategy 3: Just Title (Broad fallback)
          if (urls.length === 0) {
             console.warn("[Player] Strict search failed. Trying broad search...");
             urls = await fetchAudioUrl(`${cleanTitle} Song`);
          }

          // RACE CONDITION CHECK:
          // If the user clicked another song while we were fetching, ABORT.
          if (!isMounted || trackIdAtStart !== usePlayerStore.getState().currentTrack?.id) {
               console.log("[Player] Race condition detected. Ignoring stale result for:", currentTrack.title);
               return;
          }

          if (urls.length > 0) {
              console.log(`[Player] Found ${urls.length} candidate URLs for ${currentTrack.title}`);
              setCandidateUrls(urls);
              setStreamUrl(urls[0]); // Start with the first one
              setCurrentUrlIndex(0);
          } else {
              console.error("[Player] No audio found for this track.");
              setIsEnhancing(false);
              setIsLoading(false);
              // Optionally trigger next track or error state?
          }
      };

      loadAudio();

      return () => {
          isMounted = false;
      };
  }, [currentTrack?.id]);

  // Handle URL Fallback on Error
  const handleAudioError = (e: any) => {
      console.error("[Player] Native Audio Error:", e);
      
      if (candidateUrls.length > 0 && currentUrlIndex < candidateUrls.length - 1) {
          const nextIndex = currentUrlIndex + 1;
          console.log(`[Player] Retrying with candidate #${nextIndex}...`);
          setCurrentUrlIndex(nextIndex);
          setStreamUrl(candidateUrls[nextIndex]);
          // Don't stop loading yet, we are trying again
      } else {
          console.error("[Player] All candidate URLs failed.");
          setIsLoading(false);
          setIsEnhancing(false);
          togglePlay(); // Stop trying to play
      }
  };

  const handleCanPlay = () => {
      console.log("[Player] Audio Ready to Play");
      setIsLoading(false);
      setIsEnhancing(false);
      if (playbackState === 'playing' && audioRef.current) {
          audioRef.current.play().catch(e => console.error("Play failed:", e));
      }
  };

  // Sync Playback State
  useEffect(() => {
    if (audioRef.current) {
        if (playbackState === 'playing' && streamUrl && !isLoading) {
            audioRef.current.play().catch(e => {
                 console.warn("[Player] Play request failed (likely waiting for data):", e);
            });
        } else {
            audioRef.current.pause();
        }
    }
  }, [playbackState, streamUrl, isLoading]);

  // Sync Volume
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  // Helpers
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = val * audioRef.current.duration;
        setProgress(val);
    }
  };

  const openSearch = (e: React.MouseEvent) => {
      e.stopPropagation();
      const query = encodeURIComponent(`${currentTrack?.title} ${currentTrack?.artist} Audio`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) setIsExpanded(false);
  };

  if (!currentTrack) return null;

  return (
    <>
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '1px', height: '1px', overflow: 'hidden', opacity: 0, zIndex: -1, pointerEvents: 'none' }}>
        <audio
            ref={audioRef}
            src={streamUrl || undefined}
            controls={true}
            autoPlay={false} // Managed manually via useEffect
            onEnded={nextTrack}
            onTimeUpdate={() => {
                if (audioRef.current && audioRef.current.duration) {
                    setProgress(audioRef.current.currentTime / audioRef.current.duration);
                    setCurrentTime(audioRef.current.currentTime);
                }
            }}
            onCanPlay={handleCanPlay}
            onError={handleAudioError}
        />
      </div>

      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0, height: isExpanded ? '100%' : 'auto' }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
        drag={isExpanded ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        className={`fixed z-[100] ${isExpanded ? 'inset-0 h-[100dvh] overflow-hidden' : 'bottom-0 left-0 right-0 h-40 pointer-events-none'}`}
      >
        {/* === Full Screen Player === */}
        {isExpanded && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full bg-black/20 backdrop-blur-3xl flex flex-col font-sans">
              
              <AuroraBackground />

              {/* Glass Container for Content */}
              <div className="relative z-10 flex flex-col h-full items-center justify-center p-6 md:p-8">
                  
                  {/* 2. Ultra-Glass + Neumorphism Player Card */}
                  <div 
                      className="w-full max-w-sm h-auto aspect-[9/16] max-h-[85vh] bg-white/5 backdrop-blur-[40px] rounded-[3rem] border border-white/10 flex flex-col items-center justify-between p-6 relative overflow-hidden group"
                      style={{
                          boxShadow: "20px 20px 50px rgba(0,0,0,0.5), -10px -10px 30px rgba(255,255,255,0.05), inset 0 0 20px rgba(255,255,255,0.02)"
                      }}
                  >
                        
                        {/* Glossy gradient reflection */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none rounded-[3rem]" />
                        
                        {/* Top: Header */}
                        <div className="w-full flex items-center justify-between relative z-20 mt-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); toggleExpand(); }} 
                                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10 shadow-lg"
                             >
                                <ChevronDown size={24} />
                             </button>
                             
                             <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">Now Playing</span>
                                <span className="text-xs font-semibold text-white/90 drop-shadow-md flex items-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            Enhancing...
                                        </>
                                    ) : (
                                        "High Fidelity"
                                    )}
                                </span>
                             </div>

                             <button 
                                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10 shadow-lg"
                             >
                                <Sparkles size={20} className={streamUrl && !isLoading ? "text-cyan-300 animate-pulse" : "text-white/60"} />
                             </button>
                        </div>

                        {/* Mid: Album Art */}
                        <div className="relative w-64 h-64 md:w-72 md:h-72 my-4 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-700 ease-out">
                            <AlbumArt 
                               coverUrl={currentTrack.coverUrl} 
                               title={currentTrack.title} 
                               isPlaying={playbackState === 'playing' && !isLoading}
                            />
                            {/* Inner glow for art */}
                            <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/20 pointer-events-none" />
                            
                             {/* Loading Overlay */}
                             {isLoading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-30">
                                    <div className="bg-black/50 p-4 rounded-full backdrop-blur-md shadow-2xl border border-white/10">
                                       <Loader2 size={40} className="text-sonic-accent animate-spin" />
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Mid: Track Info */}
                        <div className="text-center w-full space-y-1 mb-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md truncate px-2">{currentTrack.title}</h2>
                            <h3 className="text-lg text-white/70 font-medium truncate">{currentTrack.artist}</h3>
                        </div>

                        {/* Mid: Progress Bar (Glass Style) */}
                        <div className="w-full px-2 mb-4">
                           <ProgressControl 
                               currentTime={currentTime} 
                               duration={currentTrack.duration} 
                               progress={progress} 
                               isPlaying={playbackState === 'playing'} 
                               onSeek={handleSeek} 
                           />
                        </div>

                         {/* Bottom: Glass + Neumorphic Controls */}
                        <div className="w-full flex items-center justify-between px-2 mb-4">
                             {/* Prev Bubble (Neumorphic) */}
                             <button 
                                onClick={prevTrack} 
                                className="w-16 h-16 rounded-full bg-[#1a1a1a]/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
                                style={{ boxShadow: "5px 5px 10px rgba(0,0,0,0.3), -5px -5px 10px rgba(255,255,255,0.05)" }}
                             >
                                <SkipBack size={28} fill="currentColor" className="opacity-80 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                             </button>
                             
                             {/* Play/Pause Main Bubble (Neumorphic Concave) */}
                             <button 
                                onClick={togglePlay} 
                                disabled={isLoading}
                                className={`w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 border border-white/10 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all relative overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{ boxShadow: "10px 10px 20px rgba(0,0,0,0.4), -10px -10px 20px rgba(255,255,255,0.1), inset 0 0 10px rgba(0,0,0,0.2)" }}
                             >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                {playbackState === 'playing' ? <Pause size={38} fill="white" className="relative z-10 drop-shadow-md" /> : <Play size={38} fill="white" className="relative z-10 ml-1 drop-shadow-md" />}
                             </button>
                             
                             {/* Next Bubble (Neumorphic) */}
                             <button 
                                onClick={nextTrack} 
                                className="w-16 h-16 rounded-full bg-[#1a1a1a]/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
                                style={{ boxShadow: "5px 5px 10px rgba(0,0,0,0.3), -5px -5px 10px rgba(255,255,255,0.05)" }}
                             >
                                <SkipForward size={28} fill="currentColor" className="opacity-80 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                             </button>
                        </div>
                        
                        {/* Footer: Actions */}
                        <div className="w-full flex items-center justify-center gap-8 text-white/50">
                            <button className="hover:text-white transition-colors"><Repeat size={20} /></button>
                            <button onClick={() => toggleLike(currentTrack.id)} className={`transition-all hover:scale-110 ${isLiked ? "text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" : "hover:text-pink-500"}`}>
                                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                            </button>
                            <button onClick={openSearch} className="hover:text-white transition-colors"><Youtube size={20} /></button>
                        </div>

                     </div>
                  </div>


           </motion.div>
        )}

        {/* === Mini Player (Floating Glass Pill / Water Drop) === */}
        {!isExpanded && (
           <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-[101] pointer-events-auto">
               <div 
                  className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full p-2 pl-3 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex items-center justify-between cursor-pointer hover:bg-white/15 transition-all group hover:scale-[1.02]"
                  onClick={toggleExpand}
                  style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)" }}
               >
                  <div className="flex items-center gap-4 overflow-hidden flex-1">
                     <div className={`relative w-12 h-12 rounded-full overflow-hidden shadow-lg border border-white/10 ${playbackState === 'playing' ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                        <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="Art" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 size={20} className="text-white animate-spin" />
                            </div>
                        )}
                     </div>
                     <div className="overflow-hidden flex-1 pr-4">
                         <h4 className="text-white font-bold truncate text-sm md:text-base">{currentTrack.title}</h4>
                         <p className="text-white/60 text-xs truncate">{currentTrack.artist}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 pr-2">
                     <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform" disabled={isLoading}>
                        {playbackState === 'playing' ? <Pause size={18} fill="black" className="text-black" /> : <Play size={18} fill="black" className="text-black ml-0.5" />}
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); nextTrack(); }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white">
                        <SkipForward size={22} fill="currentColor" />
                     </button>
                  </div>
                  
                  {/* Progress Ring / Bar embedded in border? For now simple bottom bar restricted to pill */}
                  <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/10 overflow-hidden rounded-full mb-[2px]">
                       <div className="h-full bg-gradient-to-r from-sonic-accent to-blue-500 rounded-full" style={{ width: `${(progress || 0) * 100}%` }} />
                  </div>
               </div>
           </div>
        )}
      </motion.div>
    </>
  );
}