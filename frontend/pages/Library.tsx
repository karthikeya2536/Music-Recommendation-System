import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Disc, ListMusic, BarChart3, RotateCcw, Flame, Play, Mic2 } from 'lucide-react';
import { useAuthStore } from '../store';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';

const TABS = [
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'liked', label: 'Liked Songs', icon: Heart },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'artists', label: 'Artists', icon: Mic2 },
  { id: 'history', label: 'History', icon: Clock },
];

import { PageTransition } from '../components/ui/PageTransition';
import { usePlayerStore } from '../store';
import { MotionDiv } from '../lib/motion';
import ImageWithFallback from '../components/ImageWithFallback';

export default function Library() {
  const { isAuthenticated, user, library } = useAuthStore();
  const { playTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = React.useState('playlists');
  const [albums, setAlbums] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
     // Extract unique albums and artists from user's history
     const allUserTracks = [...library.history];

     const uniqueAlbums = Array.from(new Set(allUserTracks.map(t => t.album).filter(Boolean)));
     const uniqueArtists = Array.from(new Set(allUserTracks.map(t => t.artist).filter(Boolean)));
     
     setAlbums(uniqueAlbums as string[]);
     setArtists(uniqueArtists as string[]);
  }, [library]);

  // Fetch liked song details when liked IDs change
  useEffect(() => {
      const fetchLiked = async () => {
          // Try to find liked songs in history first
          const found: any[] = [];
          const missing: string[] = [];
          for (const id of library.liked) {
              const histTrack = library.history.find(t => t.id === id);
              if (histTrack) {
                  found.push(histTrack);
              } else {
                  missing.push(id);
              }
          }
          // For missing ones, try searching by ID (best effort)
          // In production this should be a dedicated endpoint
          setLikedTracks(found);
      };
      fetchLiked();
  }, [library.liked, library.history]);

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

  // Calculate stats
  const totalSeconds = library.history.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  const genreCounts: Record<string, number> = {};
  library.history.forEach(t => {
      if (t.genre) {
          genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
      }
  });
  let topGenre = "Unknown";
  let maxCount = 0;
  Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
          maxCount = count;
          topGenre = genre;
      }
  });

  return (
    <PageTransition>
      <div className="min-h-screen pt-28 px-8 pb-32">
          
        {/* Listening Stats Overview */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
              <ImageWithFallback src={user?.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-sonic-accent" />
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
                  <div className="text-3xl font-bold text-white mb-2">{totalMinutes.toLocaleString()}</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                      <TrendingUpIcon /> Keeping track
                  </div>
              </div>
              
              <div className="bg-gradient-to-br from-sonic-800 to-sonic-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Flame size={80} />
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Top Genre</h3>
                  <div className="text-3xl font-bold text-white mb-2">{topGenre}</div>
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
              >\n                <Icon size={18} />\n                {tab.label}\n                {isActive && (\n                  <MotionDiv \n                    layoutId=\"activeTab\"\n                    className=\"absolute bottom-[-17px] left-0 right-0 h-0.5 bg-sonic-accent\"\n                  />\n                )}\n              </button>\n            );\n          })}\n        </div>\n\n        <MotionDiv\n          key={activeTab}\n          initial={{ opacity: 0, y: 10 }}\n          animate={{ opacity: 1, y: 0 }}\n          exit={{ opacity: 0, y: -10 }}\n          transition={{ duration: 0.2 }}\n          className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12\"\n        >\n          {/* PLAYLISTS VIEW */}\n          {activeTab === 'playlists' && (\n            <>\n                {library.playlists.length === 0 ? (\n                     <div className=\"col-span-full flex flex-col items-center justify-center text-gray-500 py-20\">\n                        <ListMusic size={48} className=\"mb-4 opacity-50\" />\n                        <p>No playlists yet.</p>\n                        <button className=\"mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition-colors\">Create New</button>\n                     </div>\n                ) : (\n                    library.playlists.map((playlist: any, i: number) => (\n                        <CardContainer key={playlist.id || i} className=\"inter-var w-full\">\n                            <CardBody className=\"bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors\">\n                                <CardItem translateZ=\"50\" className=\"w-full\">\n                                <div className=\"aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full relative\">\n                                    {playlist.coverUrl ? (\n                                        <ImageWithFallback src={playlist.coverUrl} alt=\"Playlist\" className=\"w-full h-full object-cover\" />\n                                    ) : (\n                                        <div className=\"w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center\">\n                                            <ListMusic size={40} className=\"text-white/50\" />\n                                        </div>\n                                    )}\n                                </div>\n                                </CardItem>\n                                <CardItem translateZ=\"40\" className=\"font-bold truncate text-white w-full\">\n                                {playlist.title}\n                                </CardItem>\n                                <CardItem translateZ=\"30\" className=\"text-sm text-gray-400 mt-1\">\n                                {playlist.tracks?.length || 0} tracks\n                                </CardItem>\n                            </CardBody>\n                        </CardContainer>\n                    ))\n                )}\n            </>\n          )}\n\n          {/* LIKED SONGS VIEW */}\n          {activeTab === 'liked' && (\n             <>\n                {likedTracks.length === 0 ? (\n                    <div className=\"col-span-full text-center py-20 text-gray-500\">\n                         <Heart size={48} className=\"mx-auto mb-4 opacity-50\" />\n                         <p>No liked songs yet.</p>\n                         <p className=\"text-xs mt-2\">Tap the heart icon on any song to save it here.</p>\n                    </div>\n                ) : (\n                    likedTracks.map((track: any) => {\n                         return (\n                            <CardContainer key={track.id} className=\"inter-var w-full cursor-pointer\">\n                                <CardBody className=\"bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors\">\n                                    <div onClick={() => playTrack(track)}>\n                                        <CardItem translateZ=\"50\" className=\"w-full\">\n                                        <div className=\"aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full relative\">\n                                            {track.coverUrl ? (\n                                                <ImageWithFallback src={track.coverUrl} alt={track.title} className=\"w-full h-full object-cover\" />\n                                            ) : (\n                                                <div className=\"w-full h-full bg-gradient-to-br from-pink-600 to-red-600 flex items-center justify-center\">\n                                                    <Heart size={40} className=\"text-white/50\" />\n                                                </div>\n                                            )}\n                                             <div className=\"absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity\">\n                                                 <Play fill=\"white\" className=\"text-white\" />\n                                             </div>\n                                        </div>\n                                        </CardItem>\n                                        <CardItem translateZ=\"40\" className=\"font-bold truncate text-white w-full\">\n                                        {track.title}\n                                        </CardItem>\n                                        <CardItem translateZ=\"30\" className=\"text-sm text-gray-400 mt-1\">\n                                        {track.artist}\n                                        </CardItem>\n                                    </div>\n                                </CardBody>\n                            </CardContainer>\n                         );\n                    })\n                )}\n             </>\n          )}\n\n          {/* ALBUMS VIEW */}\n          {activeTab === 'albums' && albums.map((album, i) => (\n             <CardContainer key={i} className=\"inter-var w-full\">\n                <CardBody className=\"bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors cursor-pointer\">\n                    <CardItem translateZ=\"50\" className=\"w-full\">\n                    <div className=\"aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full\">\n                         {/* Placeholder for album art until we implement proper album art mapping */}\n                        <div className=\"w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center\">\n                            <Disc size={40} className=\"text-white/20\" />\n                        </div>\n                    </div>\n                    </CardItem>\n                    <CardItem translateZ=\"40\" className=\"font-bold truncate text-white w-full\">\n                    {album}\n                    </CardItem>\n                    <CardItem translateZ=\"30\" className=\"text-sm text-gray-400 mt-1\">\n                    Album\n                    </CardItem>\n                </CardBody>\n            </CardContainer>\n          ))}\n\n          {/* ARTISTS VIEW */}\n          {activeTab === 'artists' && artists.map((artist, i) => (\n             <CardContainer key={i} className=\"inter-var w-full\">\n                <CardBody className=\"bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors cursor-pointer\">\n                    <CardItem translateZ=\"50\" className=\"w-full\">\n                    <div className=\"aspect-square bg-sonic-800 rounded-full mb-4 shadow-lg overflow-hidden w-full border-2 border-white/5\">\n                        <div className=\"w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center\">\n                            <Mic2 size={40} className=\"text-white/20\" />\n                        </div>\n                    </div>\n                    </CardItem>\n                    <CardItem translateZ=\"40\" className=\"font-bold truncate text-white w-full text-center\">\n                    {artist}\n                    </CardItem>\n                </CardBody>\n            </CardContainer>\n          ))}\n          \n           {(activeTab === 'history') && (\n               <>\n                   {library.history.length === 0 ? (\n                       <div className=\"col-span-full text-center py-20 text-gray-500\">\n                           <Clock size={48} className=\"mx-auto mb-4 opacity-50\" />\n                           <p>No history yet.</p>\n                           <p className=\"text-xs mt-2\">Start playing music to build your history.</p>\n                       </div>\n                   ) : (\n                       library.history.map((track: any, i: number) => (\n                           <CardContainer key={`${track.id}-${i}`} className=\"inter-var w-full cursor-pointer\">\n                               <CardBody className=\"bg-white/5 relative group/card border-white/[0.1] w-full h-auto rounded-xl p-4 border hover:border-sonic-accent/30 transition-colors\">\n                                   <div onClick={() => playTrack(track)}>\n                                       <CardItem translateZ=\"50\" className=\"w-full\">\n                                       <div className=\"aspect-square bg-sonic-800 rounded-lg mb-4 shadow-lg overflow-hidden w-full relative\">\n                                           {track.coverUrl ? (\n                                               <ImageWithFallback src={track.coverUrl} alt={track.title} className=\"w-full h-full object-cover\" />\n                                           ) : (\n                                               <div className=\"w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center\">\n                                                   <Clock size={40} className=\"text-white/20\" />\n                                               </div>\n                                           )}\n                                            <div className=\"absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity\">\n                                                <Play fill=\"white\" className=\"text-white\" />\n                                            </div>\n                                       </div>\n                                       </CardItem>\n                                       <CardItem translateZ=\"40\" className=\"font-bold truncate text-white w-full\">\n                                       {track.title}\n                                       </CardItem>\n                                       <CardItem translateZ=\"30\" className=\"text-sm text-gray-400 mt-1\">\n                                       {track.artist}\n                                       </CardItem>\n                                   </div>\n                               </CardBody>\n                           </CardContainer>\n                       ))\n                   )}\n               </>\n           )}\n\n        </MotionDiv>\n      </div>\n    </PageTransition>\n  );\n}\n\nconst TrendingUpIcon = () => (\n    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><polyline points=\"23 6 13.5 15.5 8.5 10.5 1 18\"></polyline><polyline points=\"17 6 23 6 23 12\"></polyline></svg>\n);\n