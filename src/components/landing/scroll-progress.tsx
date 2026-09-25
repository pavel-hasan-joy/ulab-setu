"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin blue-to-gold bar along the top that fills as you scroll the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-ulab-light via-ulab to-gold"
    />
  );
}
