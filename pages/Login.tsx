import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music2, Github, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

function FloatingShape() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere args={[1, 32, 32]} scale={1.8}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

import { PageTransition } from '../components/ui/PageTransition';

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  
  const handleLogin = async (provider: string) => {
    await login(provider);
    navigate(from, { replace: true });
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-sonic-900">
        
        {/* Ambient Background */}
        <div className="absolute inset-0 z-0">
          <Canvas>
             <ambientLight intensity={0.5} />
             <directionalLight position={[10, 10, 5]} intensity={1} />
             <FloatingShape />
          </Canvas>
        </div>

        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-500/20"
        >
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-tr from-sonic-accent to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sonic-accent/30">
                <Music2 className="text-white" size={32} />
             </div>
             <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
             <p className="text-gray-400">Enter the sonic dimension.</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleLogin('google')}
              disabled={isLoading}
              className="w-full h-14 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
            >
               {isLoading ? (
                  <Loader2 className="animate-spin" />
               ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
               )}
            </button>

            <button 
               onClick={() => handleLogin('github')}
               disabled={isLoading}
               className="w-full h-14 bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/20 border border-white/5 transition-colors disabled:opacity-70"
            >
               <Github size={20} />
               <span>Continue with GitHub</span>
            </button>

            <div className="relative py-4">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-white/10"></div>
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-transparent text-gray-500 bg-[#0a0a0a]">Or continue with email</span>
               </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin('email'); }} className="space-y-4">
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-sonic-accent focus:ring-1 focus:ring-sonic-accent transition-all"
                  />
               </div>
               <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-sonic-accent text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sonic-accentHover shadow-lg shadow-sonic-accent/20 transition-all disabled:opacity-70"
               >
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
               </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
             By clicking continue, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}