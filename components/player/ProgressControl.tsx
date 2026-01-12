
import React from 'react';
import { AudioVisualizer } from '../ui/audio-visualizer';

interface ProgressControlProps {
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProgressControl = React.memo<ProgressControlProps>(({ 
  currentTime, duration, progress, isPlaying, onSeek 
}) => {
  return (
     <div className="w-full space-y-2">
         {/* Visualizer & Scrubber Container */}
         <div className="relative h-20 w-full flex items-center justify-center group">
            <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity group-hover:opacity-100">
               <AudioVisualizer 
                  isPlaying={isPlaying} 
                  barCount={100} 
                  height={60} 
                  mode="full" 
                  intensity={1.2} 
               />
            </div>
            
            {/* The Scrubber (Overlay) - Invisible but interactive */}
            <input 
               type="range" min={0} max={1} step={0.001} value={progress || 0} onChange={onSeek}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
         </div>

         {/* Time Labels */}
         <div className="flex justify-between text-xs font-bold text-white/50 tracking-wider px-2">
            <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
         </div>
     </div>
  );
});
