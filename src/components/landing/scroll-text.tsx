"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/** A statement whose words light up one by one as it scrolls through the viewport. */
export function ScrollText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  // Function transform keeps this on the JS path (see walk-story.tsx).
  const scrollYProgress = useTransform(raw, (v) => v);
  const words = text.split(" ");
  return (
    <p ref={ref} className="font-display text-3xl font-semibold leading-[1.2] md:text-5xl">
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity }} className="text-ink">{children} </motion.span>;
}
