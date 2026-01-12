
import { Track } from '../types';

// --- Lyrics Lines ---
export const LYRICS_NEON = [
    { time: 5, text: "Neon lights are burning bright" },
    { time: 10, text: "Walking through the city night" },
    { time: 16, text: "Digital shadows on the wall" },
    { time: 22, text: "Can you hear the system call?" },
    { time: 30, text: "Grid lines pulsing in the street" },
    { time: 38, text: "Syncing to the cyber beat" },
    { time: 45, text: "We are the children of the code" },
    { time: 55, text: "Running down the data road" },
    { time: 65, text: "Electric dreams and laser beams" },
    { time: 75, text: "Nothing's ever what it seems" }
];

export const LYRICS_CHILL = [
    { time: 6, text: "Raindrops falling on the glass" },
    { time: 12, text: "Watching all the people pass" },
    { time: 18, text: "Coffee steam and gentle sound" },
    { time: 24, text: "Peace and quiet all around" },
    { time: 32, text: "Turn the page and drift away" },
    { time: 40, text: "Just another rainy day" },
    { time: 48, text: "Soft vibes only, let it flow" },
    { time: 56, text: "Nowhere that we need to go" }
];

export const LYRICS_EPIC = [
    { time: 10, text: "Mountains rising to the sky" },
    { time: 20, text: "Eagles daring us to fly" },
    { time: 30, text: "Thunder rolling in the deep" },
    { time: 40, text: "Promises we have to keep" },
    { time: 50, text: "The hero stands alone at last" },
    { time: 60, text: "Fighting shadows of the past" },
    { time: 70, text: "Victory is close at hand" },
    { time: 80, text: "Legend of the ancient land" }
];

// --- Mock Tracks ---
export const MOCK_TRACKS: Track[] = [
  // Electronic / Retrowave
  { 
    id: '1', 
    title: 'Midnight City', 
    artist: 'M83', 
    album: 'Hurry Up, We\'re Dreaming', 
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop', 
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
    duration: 240, 
    lyrics: LYRICS_NEON 
  },
  { 
    id: '2', 
    title: 'Starboy', 
    artist: 'The Weeknd', 
    album: 'Starboy', 
    coverUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1000&auto=format&fit=crop', 
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
    duration: 230, 
    lyrics: LYRICS_NEON 
  },
  {
    id: '3',
    title: 'Neon Nights',
    artist: 'Cyberwave',
    album: 'Future Nostalgia',
    coverUrl: 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 360,
    lyrics: LYRICS_NEON
  },
  {
      id: '4',
      title: 'Tech Noir',
      artist: 'Gunship',
      album: 'Gunship',
      coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duration: 275,
      lyrics: LYRICS_NEON
  },

  // Lo-Fi / Chill
  {
    id: '5',
    title: 'Deep Focus',
    artist: 'Mindfulness',
    album: 'Flow State',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 320,
    lyrics: LYRICS_CHILL
  },
  {
      id: '6',
      title: 'Rainy Day',
      artist: 'LoFi Girl',
      album: 'Study Beats',
      coverUrl: 'https://images.unsplash.com/photo-1515169067750-d51a73b55163?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      duration: 180,
      lyrics: LYRICS_CHILL
  },
  {
      id: '7',
      title: 'Coffee Shop Vibes',
      artist: 'Barista Beats',
      album: 'Morning Brew',
      coverUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      duration: 210,
      lyrics: LYRICS_CHILL
  },

  // Epic / Orchestral
  {
    id: '8',
    title: 'Ethereal',
    artist: 'Sky High',
    album: 'Atmosphere',
    coverUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 400,
    lyrics: LYRICS_EPIC
  },
  {
      id: '9',
      title: 'Victory',
      artist: 'Two Steps From Hell',
      album: 'Battlecry',
      coverUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
      duration: 320,
      lyrics: LYRICS_EPIC
  },
  {
      id: '10',
      title: 'Ascension',
      artist: 'Hans Zimmer',
      album: 'Interstellar OST',
      coverUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      duration: 450,
      lyrics: LYRICS_EPIC
  },
  
  // Pop / Upbeat
  {
      id: '11',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
      duration: 203,
      lyrics: LYRICS_NEON
  },
  {
      id: '12',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      coverUrl: 'https://images.unsplash.com/photo-1614613535808-3196a3e2e5f9?q=80&w=1000&auto=format&fit=crop',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
      duration: 200,
      lyrics: LYRICS_NEON
  }
];

export const MOCK_PLAYLISTS = [
    { id: 'p1', title: 'Driving Tunes', coverUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop', tracks: [MOCK_TRACKS[0], MOCK_TRACKS[1], MOCK_TRACKS[10], MOCK_TRACKS[11]] },
    { id: 'p2', title: 'Coding Focus', coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop', tracks: [MOCK_TRACKS[4], MOCK_TRACKS[5], MOCK_TRACKS[6]] },
    { id: 'p3', title: 'Epic Soundscapes', coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop', tracks: [MOCK_TRACKS[7], MOCK_TRACKS[8], MOCK_TRACKS[9]] }
];
