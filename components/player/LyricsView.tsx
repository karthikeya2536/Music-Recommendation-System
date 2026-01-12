
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LyricsViewProps {
  lyrics: { time: number; text: string }[];
  currentTime: number;
  onLineClick: (time: number) => void;
}

export const LyricsView = React.memo<LyricsViewProps>(({ lyrics, currentTime, onLineClick }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Optimized index finding: only look around the previous index if possible, but for now simple findIndex is fast enough for <100 lines
  const activeIndex = lyrics.findIndex((line, i) => {
    const nextLineTime = lyrics[i + 1]?.time || Infinity;
    return currentTime >= line.time && currentTime < nextLineTime;
  });

  useEffect(() => {
    if (listRef.current && activeIndex !== -1) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        // Use 'smooth' scroll but with a debounce or check if already visible could be better, 
        // strictly following "smooth" can sometimes cause lag if called too often.
        // However, this effect only runs when `activeIndex` changes, not every frame.
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  return (
     <motion.div 
        key="lyrics"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="h-full w-full overflow-y-auto no-scrollbar mask-gradient-y text-center flex flex-col items-center px-4"
     >
        <div className="min-h-[40vh]" /> {/* Top Spacer */}
        <div ref={listRef} className="space-y-8 md:space-y-12 pb-10 max-w-2xl mx-auto">
            {lyrics.map((line, i) => (
               <p key={i} 
                  onClick={() => onLineClick(line.time)}
                  className={`transition-all duration-700 ease-out cursor-pointer origin-center will-change-transform
                     ${i === activeIndex 
                        ? 'text-3xl md:text-5xl font-extrabold text-white scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : 'text-lg md:text-3xl font-medium text-white/30 blur-[1.5px] scale-95 hover:text-white/70 hover:blur-0 hover:scale-100'}`}
               >
                  {line.text}
               </p>
            ))}
        </div>
        <div className="min-h-[40vh]" /> {/* Bottom Spacer */}
     </motion.div>
  );
}, (prev, next) => {
    // Custom comparison for performance optimization
    // We only want to re-render if the lyrics ARRAY changes (rare) 
    // OR if the Calculated activeIndex changes.
    // We do NOT want to re-render on every millisecond of currentTime change if the index hasn't changed.
    
    // Calculate new index
    const prevIndex = prev.lyrics.findIndex((line, i) => {
        const nextTime = prev.lyrics[i + 1]?.time || Infinity;
        return prev.currentTime >= line.time && prev.currentTime < nextTime;
    });
    
    const nextIndex = next.lyrics.findIndex((line, i) => {
        const nextTime = next.lyrics[i + 1]?.time || Infinity;
        return next.currentTime >= line.time && next.currentTime < nextTime;
    });

    return prev.lyrics === next.lyrics && prevIndex === nextIndex;
});
