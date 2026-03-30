"use client";
import { motion } from "framer-motion";

// Typed motion components to fix framer-motion v11 className type issues
// In FM v11, motion.div loses the className prop type. This re-exports typed versions.
export const MotionDiv = motion.div as React.FC<
  React.HTMLAttributes<HTMLDivElement> &
    import("framer-motion").MotionProps & { layoutId?: string }
>;
export const MotionSpan = motion.span as React.FC<
  React.HTMLAttributes<HTMLSpanElement> & import("framer-motion").MotionProps
>;
