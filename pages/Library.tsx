import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Disc, ListMusic, BarChart3, RotateCcw, Flame, Play } from 'lucide-react';
import { useAuthStore } from '../store';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';

const TABS = [
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'liked', label: 'Liked Songs', icon: Heart },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'history', label: 'History', icon: Clock },
];

import { PageTransition } from '../components/ui/PageTransition';

export default function Library() {
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState('playlists');
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center flex-col gap-6 px-4 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
             <ListMusic size={40} className="text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold">Log in to view your library</h2>
          <p className="text-gray-400 max-w-md">Save tracks, create playlists, and follow artists to build your collection.</p>
          <button 
            onClick={() => navigate('/auth/login')}
            className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            Log in
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-28 px-8 pb-32">
          
        {/* Listening Stats Overview */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
              <img src={user?.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-sonic-accent" />
              <div>
                  <h1 className="text-2xl font-bold">Hi, {user?.name}</h1>
                  <p className="text-gray-400 text-sm">Here's your weekly breakdown</p>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-sonic-800 to-sonic-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BarChart3 size={80} />
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Minutes Listened</h3>
                  <div className="text-3xl font-bold text-white mb-2">1,248</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                      <TrendingUpIcon /> +12% vs last week
                  </div>
              </div>
              
              <div className="bg-gradient-to-br from-sonic-800 to-sonic-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Flame size={80} />
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Top Genre</h3>
                  <div className="text-3xl font-bold text-white mb-2">Synthwave</div>
                  <div className="text-sonic-accent text-xs">42% of your activity</div>
              </div>

              <div className="bg-gradient-to-br from-sonic-800 to-sonic-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Disc size={80} />
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Collection Size</h3>
                  <div className="text-3xl font-bold text-white mb-2">842</div>
                  <div className="text-gray-500 text-xs">Tracks saved</div>
              </div>
          </div>
        </div>
        
        {/* Recent Spins / Quick Access */}
        <div className="mb-10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <RotateCcw size={18} className="text-gray-400" /> 
               Jump Back In
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex-shrink-0 w-24 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-sonic-accent transition-all relative">
                            <img src={`https://picsum.photos/id/${100+i}/200/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Recent" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={20} fill="white" className="text-white" />
                            </div>
                        </div>
                        <span className="text-xs text-center text-gray-400 group-hover:text-white truncate w-full">Deep Focus Mix</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-8 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon size={18} />
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-sonic-accent"
                  />
                )}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12"
        >
          {/* Mock Content */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <CardContainer className="inter-var w-full">
                  <CardBody className="bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors">
                    <CardItem translateZ="50" className="w-full">
                      <div className="aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full">
                          <img 
                          src={`https://picsum.photos/id/${150 + i}/300/300`} 
                          alt="Playlist" 
                          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" 
                          />
                      </div>
                    </CardItem>
                    <CardItem translateZ="40" className="font-bold truncate text-white w-full">
                      My Playlist #{i + 1}
                    </CardItem>
                    <CardItem translateZ="30" className="text-sm text-gray-400 mt-1">
                      By {user?.name}
                    </CardItem>
                  </CardBody>
              </CardContainer>
            </div>
          ))}
          
          {/* Add New Card */}
          <div className="h-full pt-4"> 
              <div className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-sonic-accent hover:text-sonic-accent transition-colors cursor-pointer aspect-[3/4] h-[330px]">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-sonic-accent/20">
                      <ListMusic size={24} />
                  </div>
                  <span className="font-medium">Create Playlist</span>
              </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

const TrendingUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);