"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 flex h-full w-full items-end justify-center overflow-hidden bg-sonic-900 pointer-events-none",
        className
      )}
    >
      <div className="absolute inset-0 m-auto h-[100%] w-[100%] bg-sonic-900">
          <div className="absolute h-full w-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,0.15),rgba(255,255,255,0))]" />
          <div className="absolute h-full w-full bg-[radial-gradient(circle_farthest-side,rgba(110,65,255,0.15),rgba(255,255,255,0))]" />
      </div>
      <svg
        className="absolute z-0 h-full w-full opacity-[0.4]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          d="M0,1000 C300,900 400,500 500,0 C600,500 700,900 1000,1000"
          stroke="url(#gradient)"
          strokeWidth="2"
          fill="none"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
          d="M0,1000 C200,800 500,500 500,0 C500,500 800,800 1000,1000"
          stroke="url(#gradient-2)"
          strokeWidth="2"
          fill="none"
        />
         <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2,
          }}
          d="M100,1000 C300,700 500,600 500,0 C500,600 700,700 900,1000"
          stroke="url(#gradient-3)"
          strokeWidth="1.5"
          fill="none"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
           <linearGradient id="gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
