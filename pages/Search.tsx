
import React, { useState } from 'react';
import { Search as SearchIcon, Play, TrendingUp, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store';
import { Track } from '../types';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';

const MOCK_RESULTS: Track[] = [
    { 
        id: 's1', 
        title: 'Midnight City', 
        artist: 'M83', 
        album: 'Hurry Up', 
        coverUrl: 'https://picsum.photos/id/10/300/300', 
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
        duration: 372,
        lyrics: [
            { time: 10, text: "Waiting in a car" },
            { time: 20, text: "Waiting for a ride in the dark" },
            { time: 30, text: "Drinking in the lights" }
        ]
    },
    { 
        id: 's2', 
        title: 'Starboy', 
        artist: 'The Weeknd', 
        album: 'Starboy', 
        coverUrl: 'https://picsum.photos/id/20/300/300', 
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
        duration: 230,
        lyrics: [
            { time: 5, text: "I'm tryna put you in the worst mood" },
            { time: 12, text: "P1 cleaner than your church shoes" },
            { time: 18, text: "Look what you've done" },
            { time: 24, text: "I'm a starboy" }
        ]
    },
    { 
        id: 's3', 
        title: 'Get Lucky', 
        artist: 'Daft Punk', 
        album: 'RAM', 
        coverUrl: 'https://picsum.photos/id/30/300/300', 
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 
        duration: 248,
        lyrics: [
            { time: 15, text: "Like the legend of the phoenix" },
            { time: 25, text: "All ends with beginnings" },
            { time: 35, text: "What keeps the planet spinning" },
            { time: 45, text: "The force from the beginning" }
        ]
    },
];

const TRENDING_SEARCHES = ['Lo-Fi Beats', 'Cyberpunk', 'Workout Mix', 'Jazz Classics', 'Rainy Day', 'Podcast'];

const GENRES = [
    { name: 'Rock', color: 'from-red-600 to-red-900' },
    { name: 'Pop', color: 'from-pink-500 to-rose-900' },
    { name: 'Electronic', color: 'from-blue-600 to-indigo-900' },
    { name: 'Jazz', color: 'from-yellow-600 to-amber-900' },
    { name: 'Hip-Hop', color: 'from-orange-600 to-orange-900' },
    { name: 'Classical', color: 'from-teal-600 to-emerald-900' },
    { name: 'Focus', color: 'from-cyan-600 to-blue-900' },
    { name: 'Workout', color: 'from-green-600 to-lime-900' },
    { name: 'Indie', color: 'from-purple-600 to-violet-900' },
    { name: 'Metal', color: 'from-gray-700 to-black' },
    { name: 'Soul', color: 'from-rose-600 to-pink-900' },
    { name: 'Ambient', color: 'from-indigo-600 to-blue-900' },
];

import { PageTransition } from '../components/ui/PageTransition';

export default function Search() {
  const [query, setQuery] = useState('');
  const { playTrack } = usePlayerStore();

  const filtered = MOCK_RESULTS.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.artist.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen pt-28 px-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
          >
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
              type="text" 
              placeholder="What do you want to listen to?" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sonic-accent focus:bg-white/10 transition-all shadow-xl"
              autoFocus
            />
          </motion.div>

          {!query && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center gap-3 mb-12"
              >
                  <div className="flex items-center gap-2 text-sonic-accent text-sm font-bold mr-2">
                      <TrendingUp size={16} />
                      <span>TRENDING</span>
                  </div>
                  {TRENDING_SEARCHES.map((tag, i) => (
                      <button 
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:border-sonic-accent/50 hover:text-white transition-all"
                      >
                          {tag}
                      </button>
                  ))}
              </motion.div>
          )}

          <div className="space-y-4">
            {query && (
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Top Results</h3>
            )}
            {filtered.map((track, i) => (
              <motion.div 
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => playTrack(track)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="relative w-16 h-16">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-md" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play fill="white" size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-lg">{track.title}</h4>
                  <p className="text-gray-400">{track.artist} • {track.album}</p>
                </div>
                <div className="text-gray-500 font-mono text-sm">
                  {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>
            ))}
            {query && filtered.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>
          
          {!query && (
            <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Hash size={20} className="text-gray-400" />
                      Browse All
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {GENRES.map((genre, i) => (
                          <motion.div
                              key={genre.name}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="h-full aspect-square"
                          >
                              <CardContainer className="inter-var w-full h-full">
                                  <CardBody className={`bg-gradient-to-br ${genre.color} relative group/card border-white/[0.1] w-full h-full rounded-2xl p-4 border transition-colors flex flex-col justify-between overflow-hidden`}>
                                  <div className="absolute inset-0 bg-black/20 group-hover/card:bg-transparent transition-colors" />
                                  <CardItem translateZ="30" className="font-bold text-lg text-white relative z-10">
                                      {genre.name}
                                  </CardItem>
                                  <CardItem translateZ="50" className="self-end rotate-12 relative z-10 opacity-80">
                                      <Hash size={40} className="text-white/30" />
                                  </CardItem>
                                  </CardBody>
                              </CardContainer>
                          </motion.div>
                      ))}
                  </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
