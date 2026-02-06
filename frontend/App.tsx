import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ThreeBackground from './components/ThreeBackground';
import { TopNavigation } from './components/Navigation';
import Player from './components/Player';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Load Pages for Performance (Code Splitting)
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const Library = React.lazy(() => import('./pages/Library'));
const Login = React.lazy(() => import('./pages/Login'));
const Profile = React.lazy(() => import('./pages/Profile'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-12 h-12 border-4 border-sonic-accent/30 border-t-sonic-accent rounded-full animate-spin" />
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  // Don't show navigation on login page
  const showNav = location.pathname !== '/auth/login';

  return (
    <>
      {showNav && <TopNavigation />}
      
      <AnimatePresence mode="wait">
        <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
        </ErrorBoundary>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    import('./store').then(({ useAuthStore }) => {
      const unsubscribe = useAuthStore.getState().initializeAuthListener();
      return () => unsubscribe();
    });
  }, []);

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
        <ErrorBoundary>
            <Player />
        </ErrorBoundary>
        
      </div>
    </Router>
  );
}
