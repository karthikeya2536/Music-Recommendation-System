
import React from 'react';
import { motion } from 'framer-motion';

export const AuroraBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
        <motion.div 
           animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="absolute -top-[20%] -left-[20%] w-[70vw] h-[70vw] rounded-full mix-blend-screen" 
           style={{ 
             background: "radial-gradient(circle, rgba(147,51,234,0.25) 0%, rgba(147,51,234,0) 70%)",
             willChange: "transform"
           }}
        />
        <motion.div 
           animate={{ rotate: -360, scale: [1, 1.2, 1] }} 
           transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
           className="absolute top-[20%] -right-[20%] w-[80vw] h-[80vw] rounded-full mix-blend-screen" 
           style={{ 
             background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0) 70%)",
             willChange: "transform"
           }} 
        />
        <motion.div 
           animate={{ x: [-30, 30, -30], y: [-30, 30, -30] }} 
           transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
           className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen" 
           style={{ 
             background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(79,70,229,0) 70%)",
             willChange: "transform"
           }}
        />
        {/* Replaced heavy backdrop-blur with simple dark overlay for performance */}
        {/* Removed bg-black/60 to allow vibrancy */}
        <div className="absolute inset-0 bg-black/10" />
    </div>
  );
});
