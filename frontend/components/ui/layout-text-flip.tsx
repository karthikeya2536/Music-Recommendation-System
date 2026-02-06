
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const LayoutTextFlip = ({
  words,
  text,
  duration = 3000,
  className,
  textClassName,
}: {
  words: string[];
  text?: string;
  duration?: number;
  className?: string;
  textClassName?: string;
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words, duration]);

  // Find the longest word to set a fixed width for the container
  // This prevents layout shifts when the word changes
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-x-4", className)}>
      {text && <span>{text}</span>}
      <div className="relative inline-flex items-center justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={words[index]}
            initial={{ y: 20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className={cn("absolute inset-0 flex items-center justify-start whitespace-nowrap", textClassName)}
          >
            {words[index]}
          </motion.div>
        </AnimatePresence>
        
        {/* Invisible spacer to maintain container height/width based on longest word */}
        <div 
           className={cn("opacity-0 invisible select-none whitespace-nowrap", textClassName)}
           aria-hidden="true"
        >
           {longestWord}
        </div>
      </div>
    </div>
  );
};
