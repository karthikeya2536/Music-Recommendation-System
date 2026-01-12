
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { usePlayerStore } from "../../store";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { InfiniteMovingCards } from "./infinite-moving-cards";
import { Link } from "react-router-dom";
import { LayoutTextFlip } from "./layout-text-flip";

export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
    artist?: string;
    audioUrl?: string;
    lyrics?: { time: number; text: string }[];
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [25, 0]),
    springConfig
  );
  // Set initial opacity to 0.4 as requested to balance visibility and readability
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.4, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  
  // Start negative to move cards to top, ensuring they cover the header area
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-50, 400]), 
    springConfig
  );

  return (
    <div
      ref={ref}
      className="h-[140vh] md:h-[200vh] py-0 pb-10 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="w-[200%] -ml-[50%] relative z-20"
      >
        <div className="mb-8 w-full">
          <InfiniteMovingCards
            items={firstRow}
            direction="right"
            speed="slow"
            className="w-full"
            noMask={true}
            renderItem={(product) => <ProductCard product={product} />}
          />
        </div>
        <div className="mb-8 w-full">
          <InfiniteMovingCards
            items={secondRow}
            direction="left"
            speed="slow"
            className="w-full"
            noMask={true}
            renderItem={(product) => <ProductCard product={product} />}
          />
        </div>
        <div className="mb-8 w-full">
          <InfiniteMovingCards
            items={thirdRow}
            direction="right"
            speed="slow"
            className="w-full"
            noMask={true}
            renderItem={(product) => <ProductCard product={product} />}
          />
        </div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="absolute top-0 left-0 w-full z-50 pointer-events-none py-24 md:py-32 px-6 md:px-16">
      <div className="pointer-events-auto flex flex-col items-start text-left w-full max-w-[1800px]">
        {/* Title Group */}
        <div className="mb-8 w-full relative z-20">
             <LayoutTextFlip
                text="Welcome to"
                words={["Sonicstream", "High Fidelity", "The Future", "Immersion"]}
                className="text-4xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-tight flex-col items-start md:flex-row md:items-center"
                textClassName="px-4 py-2 md:px-6 md:py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl text-sonic-accent shadow-[0_0_30px_rgba(139,92,246,0.3)] bg-gradient-to-r from-sonic-accent/10 to-purple-500/10"
             />
        </div>

        {/* Simple Text Description */}
        <div className="max-w-2xl relative z-20">
             <p className="text-lg md:text-xl text-neutral-300 leading-8 font-medium tracking-wide mb-12 drop-shadow-lg max-w-xl">
                Experience the next evolution of sound. A high-fidelity streaming platform where immersive 3D visuals meet crystal-clear audio.
            </p>
            
            <div className="flex items-center gap-6">
               <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
               <h3 className="text-xl md:text-3xl font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]">
                  Emerge into Future
               </h3>
            </div>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = ({
  product,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
    artist?: string;
    audioUrl?: string;
    lyrics?: { time: number; text: string }[];
  };
}) => {
  const { playTrack } = usePlayerStore();
  
  if (!product) return null;

  // Generate a consistent ID for layout animation
  const slug = product.title.replace(/\s+/g, '-').toLowerCase();

  const handlePlay = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     playTrack({
        id: `hero-${slug}`,
        title: product.title,
        artist: product.artist || "Featured Artist",
        album: "Sonic Highlights",
        coverUrl: product.thumbnail,
        audioUrl: product.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 240,
        lyrics: product.lyrics
     });
  };

  return (
    <Link 
      to={`/album/${slug}`}
      // Decreased card size slightly: mobile h-48/w-14rem, desktop h-80/w-24rem
      className="group/product h-48 w-[14rem] md:h-80 md:w-[24rem] relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer mr-8 block bg-sonic-800"
    >
      <img
        src={product.thumbnail}
        className="object-cover object-left-top absolute h-full w-full inset-0 brightness-[0.4] group-hover/product:brightness-100 transition-all duration-500"
        alt={product.title}
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/product:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
         <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={handlePlay}
             className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20 transform translate-y-4 group-hover/product:translate-y-0 transition-transform duration-300"
         >
             <Play fill="white" className="text-white ml-1 w-8 h-8" />
         </motion.button>
      </div>
      <div className="absolute bottom-4 left-4 opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <h2 className="text-white font-bold text-xl md:text-2xl drop-shadow-md">
          {product.title}
        </h2>
        <p className="text-gray-300 text-sm font-medium">{product.artist || "Unknown Artist"}</p>
      </div>
    </Link>
  );
};
