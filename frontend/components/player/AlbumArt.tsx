
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
       className="w-full h-full"
    >
       <div className="relative w-full h-full rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 overflow-hidden group-hover:scale-105 transition-transform duration-700">
           <img 
              src={coverUrl} 
              alt={title}
              className="w-full h-full object-cover"
           />
           {/* Glossy Overlay */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
       </div>
    </motion.div>
  );
});
