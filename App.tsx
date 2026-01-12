
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ThreeBackground from './components/ThreeBackground';
import { TopNavigation } from './components/Navigation';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';

function AnimatedRoutes() {
  const location = useLocation();
  
  // Don't show navigation on login page
  const showNav = location.pathname !== '/auth/login';

  return (
    <>
      {showNav && <TopNavigation />}
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          
          <Route path="/auth/login" element={<Login />} />
          
          <Route path="/library" element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen text-white overflow-hidden bg-sonic-900 font-sans selection:bg-sonic-accent/30 selection:text-white">
        
        {/* 3D Background Layer */}
        <ThreeBackground />
        
        {/* Main Content */}
        <div className="relative z-10 h-screen overflow-y-auto scroll-smooth">
          <main className="min-h-full">
            <AnimatedRoutes />
          </main>
        </div>

        {/* Global Player */}
        <Player />
        
      </div>
    </Router>
  );
}
