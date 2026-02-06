import React, { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, Play, TrendingUp, Hash, Mic2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store';
import { Track } from '../types';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';
import { MOCK_TRACKS, getAllArtists, searchTracks } from '../lib/data';
import { PageTransition } from '../components/ui/PageTransition';

import { useSearchParams } from 'react-router-dom';

const TRENDING_SEARCHES = ['Devi Sri Prasad', 'Thaman S', 'Sid Sriram', 'Anirudh', 'Keeravani'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [artists, setArtists] = useState<string[]>([]);

  // Sync state with URL if URL changes (e.g. back button)
  useEffect(() => {
     setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const genre = searchParams.get('genre');

  // Update URL when query changes
  const updateQuery = (newQuery: string) => {
      setQuery(newQuery);
      if (newQuery) {
          setSearchParams({ q: newQuery });
      } else {
          setSearchParams({});
      }
  };
  const { playTrack } = usePlayerStore();
  
  // ... (Keep artists shuffle) ...

  // API Search State
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search/Fetch Effect
  useEffect(() => {
    const performSearch = async () => {
        if (!query && !genre) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Updated fetch logic to handle genre
            let tracks = [];
            if (genre) {
                // Determine if we need to call explicit genre API or just use search with param
                // Our data.ts only has searchTracks(query). Let's modify data.ts or just call fetch manually here?
                // Better to update data.ts to support genre, but for now:
                const res = await fetch(`/api/v1/tracks/search?genre=${encodeURIComponent(genre)}`);
                const data = await res.json();
                tracks = data.tracks || [];
            } else {
                tracks = await searchTracks(query);
            }
            setResults(tracks);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const timeoutId = setTimeout(performSearch, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [query, genre]);

  // Fallback to results or empty
  const filtered = results;

  // Colors for artist cards
  const BG_COLORS = [
    'from-red-600 to-red-900', 'from-blue-600 to-blue-900', 'from-green-600 to-green-900',
    'from-yellow-600 to-yellow-900', 'from-purple-600 to-purple-900', 'from-pink-600 to-pink-900',
    'from-indigo-600 to-indigo-900', 'from-teal-600 to-teal-900'
  ];

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
              placeholder="Result... (Songs, Artists, Albums)" 
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
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
                          onClick={() => updateQuery(tag)}
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
              <div 
                key={track.id}
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
              </div>
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
                      <Mic2 size={20} className="text-gray-400" />
                      Browse Artists
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {artists.map((artist, i) => (
                          <motion.div
                              key={artist}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="h-40 w-full cursor-pointer"
                              onClick={() => updateQuery(artist)}
                          >
                              <CardContainer className="inter-var w-full h-full">
                                  <CardBody className={`bg-gradient-to-br ${BG_COLORS[i % BG_COLORS.length]} relative group/card border-white/[0.1] w-full h-full rounded-2xl p-4 border transition-colors flex flex-col justify-between overflow-hidden`}>
                                  <div className="absolute inset-0 bg-black/20 group-hover/card:bg-transparent transition-colors" />
                                  <CardItem translateZ="30" className="font-bold text-lg text-white relative z-10 break-words line-clamp-2">
                                      {artist}
                                  </CardItem>
                                  <CardItem translateZ="50" className="self-end rotate-12 relative z-10 opacity-80">
                                      <Mic2 size={40} className="text-white/30" />
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
