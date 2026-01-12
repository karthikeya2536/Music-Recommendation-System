
import React from 'react';
import { motion } from 'framer-motion';

interface AlbumArtProps {
  coverUrl: string;
  title: string;
  isPlaying?: boolean;
}

export const AlbumArt = React.memo<AlbumArtProps>(({ coverUrl, title, isPlaying = false }) => {
  return (
    <motion.div
       key="art"
       initial={{ opacity: 0, scale: 0.9 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 0.9 }}
       className="relative flex items-center justify-center p-8 active:scale-95 transition-transform duration-500"
    >
       {/* Glass Bezel Ring */}
       <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
       
       <div className={`relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 overflow-hidden border-4 border-black/20 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}>
           <img 
              src={coverUrl} 
              alt={title}
              className="w-full h-full object-cover"
           />
           {/* Vinyl shine effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
       </div>
       
       {/* Reflection/Glow underneath */}
       <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/40 blur-xl rounded-full" />
    </motion.div>
  );
});
