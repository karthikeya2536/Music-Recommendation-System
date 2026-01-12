import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { usePlayerStore } from '../store';

// Fix: Add missing IntrinsicElements types for React Three Fiber to resolve JSX errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      ambientLight: any;
    }
  }
}

function Stars(props: any) {
  // Fix: Initialize useRef with null to satisfy strict argument requirements
  const ref = useRef<any>(null);
  
  const sphere = useMemo(() => {
    const count = 5000;
    const radius = 1.5;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.cbrt(Math.random()) * radius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      points[i * 3] = x;
      points[i * 3 + 1] = y;
      points[i * 3 + 2] = z;
    }
    return points;
  }, []);
  
  const isPlaying = usePlayerStore((state) => state.playbackState === 'playing');

  useFrame((state, delta) => {
    if (ref.current) {
      // Rotate slowly normally, faster when playing
      const speed = isPlaying ? 0.4 : 0.1;
      ref.current.rotation.x -= delta * speed * 0.5;
      ref.current.rotation.y -= delta * speed * 0.7;
      
      // Pulse effect
      if (isPlaying) {
         const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
         ref.current.scale.set(scale, scale, scale);
      } else {
        ref.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#8b5cf6"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-sonic-900">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
        <ambientLight intensity={0.5} />
      </Canvas>
      {/* Vignette & Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-sonic-900 via-transparent to-sonic-900 opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-sonic-900/50 via-transparent to-sonic-900/50" />
    </div>
  );
}