"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { site } from "@/lib/site";

// three.js only loads in the browser, and only for this section.
const ParticleMorph = dynamic(() => import("./particle-morph").then((m) => m.ParticleMorph), { ssr: false });

const chapters = [
  { title: `One campus, thousands of graduates`, body: `${site.universityShort} alumni now work across Bangladesh and around the world.` },
  { title: "It starts with you, the student", body: "Your department, your batch, and a lot of questions about what comes next." },
  { title: "Setu is the bridge", body: "Message any senior directly. No introductions, no waiting for a reply to a request." },
  { title: "And it leads to work", body: "Jobs posted by alumni, many with an offer to refer you." },
];

// Scroll positions where each shape is fully formed. Between them the particles fly.
const holds = [0.06, 0.34, 0.62, 0.9];

/** Pinned section: scrolling morphs a 3D particle cloud through four shapes while the caption changes. */
export function MorphStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(raw, { stiffness: 140, damping: 30, restDelta: 0.0005 });
  // Map scroll to shape index 0–3, holding on each shape for a while.
  const stage = useTransform(progress, [holds[0], holds[0] + 0.16, holds[1] + 0.12, holds[1] + 0.28, holds[2] + 0.12, holds[2] + 0.28], [0, 1, 1, 2, 2, 3]);

  return (
    <section ref={ref} className="relative h-[440vh]" aria-label="From student to first job">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,var(--color-sky),transparent_65%)]" />
        <ParticleMorph stage={stage} className="absolute inset-0 md:left-[30%]" />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-16 md:justify-center md:px-6 md:pb-0">
          <div className="relative h-56 max-w-md md:h-80">
            {chapters.map((c, i) => (
              <Chapter key={c.title} index={i} stage={stage} {...c} />
            ))}
          </div>
          <div className="mt-6 flex gap-2" aria-hidden>
            {chapters.map((c, i) => (
              <Dot key={c.title} index={i} stage={stage} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chapter({ index, stage, title, body }: { index: number; stage: MotionValue<number>; title: string; body: string }) {
  const opacity = useTransform(stage, [index - 0.5, index - 0.15, index + 0.15, index + 0.5], [0, 1, 1, 0]);
  const y = useTransform(stage, [index - 0.5, index, index + 0.5], [30, 0, -30]);
  const blur = useTransform(opacity, (o) => `blur(${(1 - o) * 8}px)`);
  return (
    <motion.div style={{ opacity, y, filter: blur }} className="absolute inset-x-0 bottom-0 md:bottom-auto md:top-0">
      <p className="text-sm font-semibold text-ulab">{String(index + 1).padStart(2, "0")} / 04</p>
      <h2 className="mt-2 text-4xl font-semibold leading-[1.05] md:text-6xl">{title}</h2>
      <p className="mt-3 text-lg text-ink-soft">{body}</p>
    </motion.div>
  );
}

function Dot({ index, stage }: { index: number; stage: MotionValue<number> }) {
  const width = useTransform(stage, [index - 0.6, index, index + 0.6], [8, 32, 8]);
  const opacity = useTransform(stage, [index - 0.6, index, index + 0.6], [0.35, 1, 0.35]);
  return <motion.span style={{ width, opacity }} className="h-2 rounded-full bg-gradient-to-r from-ulab to-gold" />;
}
