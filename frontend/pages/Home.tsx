import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Wind, Zap, Brain, Sparkles, Mic2, Star } from 'lucide-react';
import { usePlayerStore, useAuthStore } from '../store';
import { Track } from '../types';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';
import { HeroParallax } from '../components/ui/hero-parallax';
import { InfiniteMovingCards } from '../components/ui/infinite-moving-cards';

import { MOCK_TRACKS, fetchTrending, fetchNewReleases, getRecommendations } from '../lib/data';
import { getAffinityScore } from '../lib/recommend';
import { HeroSkeleton, TrackSkeleton } from '../components/ui/Skeleton';

const MOODS = [
  { name: 'Melody', color: 'from-blue-500 to-cyan-400', icon: Wind },
  { name: 'Mass', color: 'from-red-500 to-orange-400', icon: Zap },
  { name: 'Love', color: 'from-purple-500 to-pink-400', icon: Sparkles },
  { name: 'Folk', color: 'from-yellow-400 to-orange-500', icon: Mic2 },
];

const TESTIMONIALS = [
  { quote: "The sound quality is unmatched.", name: "Alex", title: "Audiophile" },
  { quote: "Finally a music app that looks as good as it sounds.", name: "Sarah", title: "Designer" },
  { quote: "The 3D experience is mind-blowing.", name: "Mike", title: "Developer" },
  { quote: "Discovery mode found my new favorite band.", name: "Jessica", title: "Music Lover" },
  { quote: "Sonicstream changed how I listen to music.", name: "David", title: "Producer" },
];

const TrackCard = React.memo(({ track, index }: { track: Track; index: number }) => {
  const { playTrack, currentTrack, playbackState } = usePlayerStore();
  const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';

  return (
    <div className="flex-shrink-0 relative z-30">
      <div 
        onClick={(e) => {
           console.log("Track clicked:", track.title);
           playTrack(track);
        }}
        className="cursor-pointer"
      >
        <CardContainer className="inter-var w-64 h-full">
          <CardBody className="bg-white/5 relative group/card dark:hover:shadow-2xl dark:hover:shadow-sonic-accent/[0.1] border-white/[0.1] w-full h-full rounded-xl p-4 border hover:border-sonic-accent/50 transition-colors flex flex-col">
            <CardItem
              translateZ="50"
              className="w-full relative"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="h-full w-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
                  <div className="w-12 h-12 bg-sonic-accent rounded-full flex items-center justify-center shadow-lg shadow-sonic-accent/40">
                    <Play size={20} fill="white" className="text-white ml-1" />
                  </div>
                </div>
              </div>
            </CardItem>
            <div className="mt-4 flex-1">
              <CardItem
                translateZ="30"
                className={`font-semibold text-lg truncate w-full ${isPlayingThis ? 'text-sonic-accent' : 'text-white'}`}
              >
                {track.title}
              </CardItem>
              <CardItem
                as="p"
                translateZ="20"
                className="text-sm text-gray-400 truncate w-full mt-1"
              >
                {track.artist}
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>
      </div>
    </div>
  );
});

const NewReleaseCard = React.memo(({ track, index }: { track: Track; index: number }) => {
    const { playTrack } = usePlayerStore();
    
    return (
      <div 
          className="group relative aspect-video w-[350px] md:w-[450px] rounded-xl overflow-hidden cursor-pointer flex-shrink-0 z-30"
          onClick={() => playTrack(track)}
      >
          <img src={track.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={track.title}/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-xl font-bold">{track.title}</h4>
              <p className="text-gray-400">{track.artist}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
               <div className="w-16 h-16 bg-sonic-accent/90 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl transform scale-50 group-hover:scale-100 transition-all">
                  <Play fill="white" size={24} className="ml-1" />
               </div>
          </div>
      </div>
    );
});

import { PageTransition } from '../components/ui/PageTransition';

import { StickyScroll } from '../components/ui/sticky-scroll-reveal';

const STICKY_CONTENT = [
  {
    title: "Collaborative Playlists",
    description:
      "Build the perfect vibe together. Invite friends to add tracks, vote on the queue, and discover music as a group in real-time. No more passing the aux cord.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white p-8">
         <div className="text-center">
            <div className="flex -space-x-4 justify-center mb-6">
               {[1,2,3,4].map(i => (
                  <img key={i} src={`https://picsum.photos/id/${100+i}/100/100`} className="w-12 h-12 rounded-full border-4 border-emerald-500" alt="User" />
               ))}
               <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-black/40 text-white flex items-center justify-center font-bold text-xs">+5</div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Party Mode Active</h3>
            <p className="opacity-90">5 contributors • 42 tracks</p>
         </div>
      </div>
    ),
  },
  {
    title: "Live Sessions",
    description:
      "Stream your mix to the world. Go live with a single click and let your followers tune in to your listening session. Chat, react, and vibe together.",
    content: (
      <div className="h-full w-full flex items-center justify-center text-white bg-gradient-to-br from-purple-500 to-indigo-500 overflow-hidden relative">
         <div className="absolute inset-0 bg-black/20" />
         <div className="relative z-10 flex flex-col items-center">
             <div className="animate-pulse absolute inset-0 bg-red-500/20 rounded-full blur-3xl scale-150" />
             <div className="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" /> LIVE
             </div>
             <img src="https://picsum.photos/id/338/200/200" className="w-32 h-32 rounded-full border-4 border-red-500 shadow-2xl mb-4" alt="Live User" />
             <h3 className="text-xl font-bold">DJ Sonic</h3>
             <p className="text-purple-200">1.2k listeners</p>
         </div>
      </div>
    ),
  },
  {
    title: "High-Fidelity Audio",
    description:
      "Experience music as the artist intended. With our lossless audio engine, you'll hear every detail, from the deepest bass to the crispest highs. Support for FLAC and ALAC.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-end justify-center gap-1 opacity-50 px-8 pb-8">
              {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-full bg-white rounded-t-sm animate-pulse" 
                    style={{ 
                        height: `${Math.random() * 80 + 20}%`,
                        animationDelay: `${i * 0.05}s`
                    }} 
                  />
              ))}
          </div>
          <div className="text-center relative z-10">
              <h3 className="text-5xl font-black mb-2 tracking-tighter">Hi-Fi</h3>
              <p className="font-mono text-xl opacity-90">LOSSLESS 24-BIT</p>
          </div>
      </div>
    ),
  },
  {
    title: "Smart Recommendations",
    description:
      "AI that knows your taste better than you. Our neural engine analyzes your listening habits to curate daily mixes that you'll actually love. Say goodbye to skipping.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
        <img
          src="/images/smart-recommendations.png"
          className="h-full w-full object-cover"
          alt="A futuristic abstract AI music visualization"
        />
      </div>
    ),
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = React.useState<Track[]>([]);

  // Randomize content on mount (Hydration safe)
  const [randomizedContent, setRandomizedContent] = React.useState({
      parallax: [] as any[],
      trending: [] as Track[],
      newReleases: [] as Track[],
      spotlight: [] as Track[],
      featured: MOCK_TRACKS[0]
  });


  React.useEffect(() => {
    const loadContent = async () => {
       try {
           // Fetch Data
           const [trendingData, newReleaseData] = await Promise.all([
               fetchTrending(),
               fetchNewReleases()
           ]);
           
           // Fetch user recommendations if logged in
           let recs: Track[] = [];
           if (user?.id) {
               recs = await getRecommendations(user.id);
           }
           if (recs.length > 0) setRecommendations(recs);

           // Construct UI structure
           // Since we don't have massive mock data anymore, we reuse fetched data for display
           // to ensure the UI looks populated even if DB is small.
           const displayPool = [...trendingData, ...newReleaseData];
           const safePool = displayPool.length > 5 ? displayPool : [...displayPool, ...displayPool, ...displayPool]; // repetition if small

           setRandomizedContent({
               parallax: safePool.slice(0, 15).map((t, index) => ({
                   title: t.title,
                   link: `/track/${t.id}`,
                   thumbnail: t.coverUrl,
                   artist: t.artist,
                   audioUrl: t.audioUrl,
                   lyrics: t.lyrics || ""
               })),
               trending: trendingData,
               newReleases: newReleaseData,
               spotlight: safePool.slice(0, 5),
               featured: safePool[0] || trendingData[0]
           });

       } catch (e) {
           console.error("Failed to load home content", e);
       }
    };
    
    loadContent();
  }, [user]);

  if (randomizedContent.parallax.length === 0) {
      return (
        <div className="min-h-screen bg-transparent pt-24 space-y-16">
            <HeroSkeleton />
            <div className="px-8 flex gap-8 overflow-hidden">
                 {[1,2,3,4,5].map(i => <TrackSkeleton key={i} />)}
            </div>
        </div>
      );
  }

  const { parallax, trending, newReleases, spotlight, featured } = randomizedContent;

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        
        {/* Hero Parallax with Infinite Cards */}
        <HeroParallax products={parallax} />

        {/* Main Content - Adjusted spacing to prevent overlap */}
        <div className="relative z-10 space-y-24 pb-20 mt-10">
          
          {/* Sonic Moods */}
          <section className="px-8 max-w-7xl mx-auto">
             <h3 className="text-2xl font-bold text-white mb-8 text-center uppercase tracking-widest opacity-80">Vibe Check</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {MOODS.map((mood, i) => (
                  <motion.div
                    key={mood.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group cursor-pointer"
                    onClick={() => navigate(`/search?genre=${mood.name}`)}
                  >
                     <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                     <div className="relative h-32 bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-white/30 transition-all">
                        <mood.icon className="text-white" size={32} />
                        <span className="font-bold text-lg">{mood.name}</span>
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>

          {/* Trending Section - Infinite Scroll */}
          <section className="max-w-[100vw] overflow-hidden">
            <div className="px-8 max-w-[1920px] mx-auto flex items-center justify-between mb-8">
               <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                 Trending Now
                 <div className="h-1.5 w-24 bg-gradient-to-r from-sonic-accent to-transparent rounded-full mt-1" />
               </h3>
               <button className="text-sm text-gray-400 hover:text-white transition-colors">View All</button>
            </div>
            
            <div className="relative w-full">
              <InfiniteMovingCards
                items={trending}
                direction="right"
                speed="slow"
                renderItem={(track) => (
                  <div className="mx-4">
                    <TrackCard track={track} index={0} />
                  </div>
                )}
              />
            </div>
          </section>

          {/* Featured Single Block */}
          <section className="px-8 max-w-7xl mx-auto">
               <div className="relative rounded-3xl overflow-hidden bg-sonic-800 border border-white/10 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-[url('https://picsum.photos/id/56/1200/600')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  
                  <div className="relative z-20 p-12 flex flex-col md:flex-row items-center gap-12">
                     <div className="w-full md:w-1/2 space-y-6">
                        <div className="inline-block px-3 py-1 bg-sonic-accent/20 text-sonic-accent rounded-full text-xs font-bold tracking-wider border border-sonic-accent/20">
                           EDITOR'S PICK
                        </div>
                        <h2 className="text-5xl font-bold leading-tight">
                           {featured.title}
                        </h2>
                        <p className="text-xl text-gray-300">
                           Experience the sound of the future with {featured.artist}. 
                           A sonic journey that transcends boundaries.
                        </p>
                        <button 
                           onClick={() => playTrack(featured)}
                           className="px-8 py-4 bg-white text-black rounded-full font-bold flex items-center gap-3 hover:bg-gray-200 transition-all hover:scale-105"
                        >
                           <Play fill="currentColor" size={20} />
                           Play Now
                        </button>
                     </div>
                  </div>
               </div>
          </section>

          {/* Artist Spotlight */}
          <section className="px-8 max-w-7xl mx-auto">
             <h3 className="text-3xl font-bold text-white mb-8">Artist Spotlight</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative h-[400px] rounded-3xl overflow-hidden group">
                   <img 
                      src="https://picsum.photos/id/338/800/600" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt="Featured Artist"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                   <div className="absolute bottom-0 left-0 p-8">
                      <div className="flex items-center gap-2 text-sonic-accent mb-2">
                         <Star size={16} fill="currentColor" />
                         <span className="text-sm font-bold tracking-wider">RISING STAR</span>
                      </div>
                      <h2 className="text-4xl font-bold mb-4">Luna Echo</h2>
                      <p className="text-gray-300 max-w-lg mb-6">Redefining ambient pop with ethereal vocals and deep, resonating basslines.</p>
                      <button className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white text-white hover:text-black transition-all">
                         View Profile
                      </button>
                   </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
                   <div>
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                         <Mic2 size={18} className="text-sonic-accent" />
                         Top Tracks
                      </h4>
                      <div className="space-y-4">
                         {spotlight.map((track, n) => (
                            <div 
                               key={track.id} 
                               onClick={() => playTrack(track)}
                               className="flex items-center gap-3 group/track cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                            >
                               <div className="text-gray-500 font-mono w-4">{n + 1}</div>
                               <img src={track.coverUrl} className="w-10 h-10 rounded object-cover" alt="Track" />
                               <div className="flex-1 overflow-hidden">
                                  <div className="font-medium text-sm group-hover/track:text-sonic-accent transition-colors truncate">{track.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{Math.floor(Math.random() * 50) / 10 + 1}M Plays</div>
                               </div>
                               <Play size={14} className="opacity-0 group-hover/track:opacity-100" />
                            </div>
                         ))}
                      </div>
                   </div>
                   <button className="w-full py-3 mt-4 text-sm font-bold text-center border-t border-white/10 hover:text-sonic-accent transition-colors">
                      See Discography
                   </button>
                </div>
             </div>
          </section>

          {/* New Releases - Infinite Scroll */}
          <section className="max-w-[100vw] overflow-hidden">
               <div className="px-8 max-w-[1920px] mx-auto mb-8">
                   <h3 className="text-3xl font-bold text-white">New Releases</h3>
               </div>
               <div className="relative w-full">
                  <InfiniteMovingCards
                    items={newReleases}
                    direction="right"
                    speed="slow"
                    renderItem={(track) => (
                      <div className="mx-4">
                        <NewReleaseCard track={track} index={0} />
                      </div>
                    )}
                  />
              </div>
          </section>

          {/* Made For You Section - AI Recommendations (PRIORITIZED) */}
          <section className="max-w-[100vw] overflow-hidden">
            <div className="px-8 max-w-[1920px] mx-auto">
              <h3 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center gap-3">
                  Made For {user ? user.name : 'You'}
                  <span className="text-xs bg-white text-black px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(255,255,255,0.5)]">AI Mix</span>
              </h3>
            </div>
            <div className="relative w-full">
               <InfiniteMovingCards
                  items={recommendations.length > 0 ? recommendations : trending}
                  direction="right"
                  speed="slow"
                  renderItem={(track) => (
                      <div className="mx-4">
                        <TrackCard track={track} index={0} />
                      </div>
                  )}
               />
            </div>
          </section>

          {/* Sticky Scroll Platform Features */}
          <div className="w-full overflow-hidden pb-10">
              <div className="flex items-center justify-center gap-6 mb-16">
                 <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-transparent to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                 <h3 className="text-2xl md:text-4xl font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white drop-shadow-[0_0_15px_rgba(167,139,250,0.5)] text-center">
                    Platform Features
                 </h3>
                 <div className="h-1 w-16 md:w-24 bg-gradient-to-l from-transparent to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
              </div>
              <div className="w-3/4 mx-auto">
                  <StickyScroll content={STICKY_CONTENT} />
              </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default Home;
