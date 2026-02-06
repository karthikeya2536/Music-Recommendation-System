import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Disc, ListMusic, BarChart3, RotateCcw, Flame, Play, Mic2 } from 'lucide-react';
import { useAuthStore } from '../store';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';
import { getAllAlbums, getAllArtists, MOCK_TRACKS } from '../lib/data';

const TABS = [
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'liked', label: 'Liked Songs', icon: Heart },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'artists', label: 'Artists', icon: Mic2 },
  { id: 'history', label: 'History', icon: Clock },
];

import { PageTransition } from '../components/ui/PageTransition';
import { usePlayerStore } from '../store';

export default function Library() {
  const { isAuthenticated, user, library } = useAuthStore();
  const { playTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = React.useState('playlists');
  const [albums, setAlbums] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
     // Load dynamic data
     // Optimization: Load only first 100 to avoid freezing UI
     const allAlbums = getAllAlbums().slice(0, 100);
     const allArtists = getAllArtists().slice(0, 100);
     setAlbums(allAlbums);
     setArtists(allArtists);
  }, []);

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

  // Helper to get random image for album/artist
  const getCover = (id: number) => `https://picsum.photos/id/${(id % 50) + 150}/300/300`;

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
                  <div className="text-3xl font-bold text-white mb-2">Pop</div>
                  <div className="text-sonic-accent text-xs">Based on activity</div>
              </div>

              <div className="bg-gradient-to-br from-sonic-800 to-sonic-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Disc size={80} />
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Collection Size</h3>
                  <div className="text-3xl font-bold text-white mb-2">{library.liked.length + library.playlists.length}</div>
                  <div className="text-gray-500 text-xs">Items saved</div>
              </div>
          </div>
        </div>
        
        {/* Tabs */}
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
          {/* PLAYLISTS VIEW */}
          {activeTab === 'playlists' && (
            <>
                {library.playlists.length === 0 ? (
                     <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                        <ListMusic size={48} className="mb-4 opacity-50" />
                        <p>No playlists yet.</p>
                        <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition-colors">Create New</button>
                     </div>
                ) : (
                    library.playlists.map((playlist: any, i: number) => (
                        <CardContainer key={playlist.id || i} className="inter-var w-full">
                            <CardBody className="bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors">
                                <CardItem translateZ="50" className="w-full">
                                <div className="aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full">
                                    <img src={playlist.coverUrl || getCover(i)} alt="Playlist" className="w-full h-full object-cover" />
                                </div>
                                </CardItem>
                                <CardItem translateZ="40" className="font-bold truncate text-white w-full">
                                {playlist.title}
                                </CardItem>
                                <CardItem translateZ="30" className="text-sm text-gray-400 mt-1">
                                {playlist.tracks?.length || 0} tracks
                                </CardItem>
                            </CardBody>
                        </CardContainer>
                    ))
                )}
            </>
          )}

          {/* LIKED SONGS VIEW */}
          {activeTab === 'liked' && (
             <>
                {library.liked.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                         <Heart size={48} className="mx-auto mb-4 opacity-50" />
                         <p>No liked songs yet.</p>
                         <p className="text-xs mt-2">Tap the heart icon on any song to save it here.</p>
                    </div>
                ) : (
                    library.liked.map((trackId: string) => {
                         const track = MOCK_TRACKS.find(t => t.id === trackId);
                         if (!track) return null;
                         return (
                            <CardContainer key={track.id} className="inter-var w-full cursor-pointer">
                                <CardBody className="bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors">
                                    <div onClick={() => playTrack(track)}>
                                        <CardItem translateZ="50" className="w-full">
                                        <div className="aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full relative">
                                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                 <Play fill="white" className="text-white" />
                                             </div>
                                        </div>
                                        </CardItem>
                                        <CardItem translateZ="40" className="font-bold truncate text-white w-full">
                                        {track.title}
                                        </CardItem>
                                        <CardItem translateZ="30" className="text-sm text-gray-400 mt-1">
                                        {track.artist}
                                        </CardItem>
                                    </div>
                                </CardBody>
                            </CardContainer>
                         );
                    })
                )}
             </>
          )}

          {/* ALBUMS VIEW */}
          {activeTab === 'albums' && albums.map((album, i) => (
             <CardContainer key={i} className="inter-var w-full">
                <CardBody className="bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors cursor-pointer">
                    <CardItem translateZ="50" className="w-full">
                    <div className="aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full">
                         {/* Placeholder for album art until we implement proper album art mapping */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                            <Disc size={40} className="text-white/20" />
                        </div>
                    </div>
                    </CardItem>
                    <CardItem translateZ="40" className="font-bold truncate text-white w-full">
                    {album}
                    </CardItem>
                    <CardItem translateZ="30" className="text-sm text-gray-400 mt-1">
                    Album
                    </CardItem>
                </CardBody>
            </CardContainer>
          ))}

          {/* ARTISTS VIEW */}
          {activeTab === 'artists' && artists.map((artist, i) => (
             <CardContainer key={i} className="inter-var w-full">
                <CardBody className="bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors cursor-pointer">
                    <CardItem translateZ="50" className="w-full">
                    <div className="aspect-square bg-sonic-800 rounded-full mb-4 shadow-lg overflow-hidden w-full border-2 border-white/5">
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                            <Mic2 size={40} className="text-white/20" />
                        </div>
                    </div>
                    </CardItem>
                    <CardItem translateZ="40" className="font-bold truncate text-white w-full text-center">
                    {artist}
                    </CardItem>
                </CardBody>
            </CardContainer>
          ))}
          
           {(activeTab === 'history') && (
               <div className="col-span-full text-center py-20 text-gray-500">
                   <p>No history yet.</p>
               </div>
           )}

        </motion.div>
      </div>
    </PageTransition>
  );
}

const TrendingUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);