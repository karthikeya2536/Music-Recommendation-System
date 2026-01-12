
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart, ChevronDown, Mic2 } from 'lucide-react';
import { usePlayerStore, useAuthStore } from '../store';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { AudioVisualizer } from './ui/audio-visualizer';



import { AuroraBackground } from './player/AuroraBackground';
import { AlbumArt } from './player/AlbumArt';
import { ProgressControl } from './player/ProgressControl';

// ... (keep imports)

// ... (keep generateLyrics)

export default function Player() {
  const { 
    currentTrack, playbackState, togglePlay, volume, setVolume, 
    progress, setProgress, setCurrentTime, nextTrack, prevTrack, currentTime
  } = usePlayerStore();
  
  const { addToHistory, toggleLike, library, isAuthenticated } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);



  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
       if (audioRef.current.src !== currentTrack.audioUrl) {
         audioRef.current.src = currentTrack.audioUrl;
         if (playbackState === 'playing') audioRef.current.play().catch(console.error);
         if (isAuthenticated) addToHistory(currentTrack);
       } else {
           if (playbackState === 'playing' && audioRef.current.paused) audioRef.current.play().catch(console.error);
           else if (playbackState === 'paused' && !audioRef.current.paused) audioRef.current.pause();
       }
    }
  }, [currentTrack, playbackState, isAuthenticated]);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
        setProgress(audioRef.current.currentTime / audioRef.current.duration);
        setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = val * audioRef.current.duration;
      setProgress(val);
    }
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) setIsExpanded(false);
  };



  if (!currentTrack) return null;

  const isLiked = library.liked.includes(currentTrack.id);

  return (
    <>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={nextTrack} preload="auto" />

      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0, height: isExpanded ? '100%' : 'auto' }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
        drag={isExpanded ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        className={`fixed z-[100] overflow-hidden ${isExpanded ? 'inset-0 h-[100dvh]' : 'bottom-0 left-0 right-0 h-20 md:h-24'}`}
      >
        {/* === Full Screen Player === */}
        {isExpanded && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full bg-black/90 flex flex-col font-sans">
              
              <AuroraBackground />

              {/* Glass Container for Content */}
              <div className="relative z-10 flex flex-col h-full p-6 md:p-10 max-w-md mx-auto w-full">
                  
                  {/* 2. Player Card (Glassmorphism) */}
                  <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2">
                     <div className="w-full h-auto bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-4 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-0 md:gap-1 relative">
                        
                        {/* Glossy gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[2.5rem]" />

                        {/* Top: Header (Inside Card) */}
                        <div className="w-full flex items-center justify-between relative z-20 mb-2 px-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); toggleExpand(); }} 
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white/80"
                             >
                                <ChevronDown size={20} />
                             </button>
                             <span className="text-xs font-semibold text-white/50 tracking-widest uppercase">Now Playing</span>
                             <div className="w-9" /> {/* Spacer */}
                        </div>

                        {/* Album Art */}
                        <div className="relative z-10">
                            <AlbumArt 
                               coverUrl={currentTrack.coverUrl} 
                               title={currentTrack.title} 
                               isPlaying={playbackState === 'playing'}
                            />
                        </div>

                        {/* Middle: Info */}
                        <div className="relative z-10 text-center space-y-0.5 w-full px-4 pt-2">
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">{currentTrack.title}</h2>
                            <p className="text-base text-white/60 font-medium truncate">{currentTrack.artist}</p>
                        </div>

                        {/* Middle: Progress */}
                        <div className="relative z-10 w-full px-2 mt-2">
                           <ProgressControl 
                              currentTime={currentTime} 
                              duration={currentTrack.duration} 
                              progress={progress} 
                              isPlaying={playbackState === 'playing'} 
                              onSeek={handleSeek} 
                           />
                        </div>

                        {/* Bottom: Controls */}
                        <div className="relative z-10 w-full flex items-center justify-between px-2 pb-1 mt-2">
                             {/* Like Button */}
                             <button onClick={() => toggleLike(currentTrack.id)} className="transition-transform active:scale-95">
                                <Heart size={22} className={isLiked ? "fill-sonic-accent text-sonic-accent" : "text-white/40 hover:text-white"} />
                             </button>
                             
                             {/* Playback Controls */}
                             <div className="flex items-center gap-4 md:gap-6">
                                <button onClick={prevTrack} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><SkipBack size={24} fill="currentColor" /></button>
                                
                                <button 
                                   onClick={togglePlay} 
                                   className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 border border-white/20"
                                >
                                   {playbackState === 'playing' ? <Pause size={24} fill="white" className="text-white" /> : <Play size={24} fill="white" className="text-white ml-1" />}
                                </button>
                                
                                <button onClick={nextTrack} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><SkipForward size={24} fill="currentColor" /></button>
                             </div>

                             {/* Repeat Button */}
                             <button className="text-white/30 hover:text-white transition-colors"><Repeat size={20} /></button>
                        </div>
                     </div>
                  </div>
                  
                  {/* 6. Footer (Empty for now) */}
                  <div className="flex-none pb-4" />

              </div>
           </motion.div>
        )}

        {/* === Mini Player === */}
        {!isExpanded && (
           <div 
              className="h-full px-4 md:px-8 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between cursor-pointer hover:bg-black/90 transition-colors relative z-[101]"
              onClick={toggleExpand}
           >
              <div className="flex items-center gap-4 overflow-hidden">
                 <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-lg ${playbackState === 'playing' ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                    <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="Art" />
                 </div>
                 <div className="overflow-hidden">
                    <h4 className="text-white font-bold truncate md:text-lg">{currentTrack.title}</h4>
                    <p className="text-white/60 text-xs md:text-sm truncate">{currentTrack.artist}</p>
                 </div>
              </div>
              <div className="flex items-center gap-5">
                 <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                    {playbackState === 'playing' ? <Pause size={18} fill="black" className="text-black" /> : <Play size={18} fill="black" className="text-black ml-0.5" />}
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); nextTrack(); }} className="text-white/80 hover:text-white"><SkipForward size={26} /></button>
              </div>
              <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-sonic-accent to-blue-500" style={{ width: `${(progress || 0) * 100}%` }} />
           </div>
        )}
      </motion.div>
    </>
  );
}