
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  intensity?: number;
  mode?: 'mini' | 'full';
}

export const AudioVisualizer = React.memo<AudioVisualizerProps>(({
  isPlaying,
  barCount = 60, // Increased default for finer look
  height = 50,
  intensity = 0.5,
  mode = 'mini'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = mode === 'full' ? (canvas.parentElement?.clientWidth || 300) : barCount * 6;
    
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${height}px`;
    canvas.width = displayWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Create Gradient (Violet -> Pink -> Orange/Rose) matching the vibrant UI
    const gradient = ctx.createLinearGradient(0, 0, displayWidth, 0);
    gradient.addColorStop(0, '#a78bfa');   // Violet-400
    gradient.addColorStop(0.5, '#ec4899'); // Pink-500
    gradient.addColorStop(1, '#f43f5e');   // Rose-500

    let animationFrameId: number;
    let offset = 0;
    let currentHeights = new Array(barCount).fill(4);

    const animate = () => {
      ctx.clearRect(0, 0, displayWidth, height);
      
      if (isPlaying) offset += 0.15;
      
      const barWidth = displayWidth / barCount;
      const gap = Math.max(1, barWidth * 0.3); // 30% gap
      const actualBarWidth = barWidth - gap;
      const center = barCount / 2;

      for (let i = 0; i < barCount; i++) {
        let targetHeight = 4;
        
        if (isPlaying) {
             const dist = Math.abs(i - center);
             const normDist = 1 - (dist / center); // 1 at center, 0 at edges
             
             // More organic waveform math
             const wave1 = Math.sin(i * 0.4 + offset);
             const wave2 = Math.cos(i * 0.25 - offset * 1.5);
             const noise = Math.sin(i * 0.8 + offset * 3) * 0.3;
             
             // Combine waves
             const base = (Math.abs(wave1 * wave2) + Math.abs(noise)) * 0.5 + 0.1;
             
             // Bell curve envelope for that "track" look
             const envelope = Math.pow(normDist, 1.5); 
             
             const dynamic = base * intensity * envelope;
             
             // Random subtle jitter for realism
             const jitter = Math.random() * 0.1;

             targetHeight = Math.max(4, (dynamic + jitter) * height);
        }

        currentHeights[i] += (targetHeight - currentHeights[i]) * 0.15; // Smooth lerp

        const h = currentHeights[i];
        const x = i * barWidth + (gap / 2);
        
        // Center vertically like a true waveform
        const y = (height - h) / 2;
        
        ctx.fillStyle = gradient;
        
        // Fully rounded pills
        const radius = actualBarWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, h, radius);
        ctx.fill();
        
        // Reflection opacity (optional, for extra "glass" vibe)
        // ctx.globalAlpha = 0.3;
        // ctx.fill();
        // ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, barCount, height, intensity, mode]);

  return (
    <canvas ref={canvasRef} className="block" />
  );
});
