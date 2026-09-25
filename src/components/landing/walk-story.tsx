"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { MentorWalk } from "../mentor-walk";

const steps = [
  { range: [0, 0.3], title: "Find someone who has been there", body: "Search alumni by department, company or batch." },
  { range: [0.3, 0.72], title: "Walk in together", body: "Ask your questions, share your CV, get a referral." },
  { range: [0.72, 1], title: "Your first job is in there", body: "Apply to jobs alumni post, with someone who knows the way." },
];

/**
 * A tall section whose inner frame stays pinned while you scroll.
 * Scroll position drives the walk: scroll down to move forward, up to go back.
 */
export function WalkStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // A spring keeps the scrub smooth, and (unlike raw scroll progress) isn't handed to the browser's
  // native scroll timeline, which mis-maps multi-step opacity ranges.
  const scrollYProgress = useSpring(raw, { stiffness: 180, damping: 32, restDelta: 0.0005 });

  return (
    <section ref={ref} className="relative h-[320vh]" aria-label="How a senior can guide you">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-paper via-sky/50 to-paper">
        <div className="mx-auto w-full max-w-6xl px-4 pt-20 md:px-6 md:pt-24">
          <div className="relative h-28 md:h-32">
            {steps.map((s, i) => (
              <Step key={s.title} index={i} progress={scrollYProgress} {...s} />
            ))}
          </div>
          <div className="mt-4 flex max-w-xs gap-2" aria-hidden>
            {steps.map((s) => (
              <Bar key={s.title} progress={scrollYProgress} range={s.range} />
            ))}
          </div>
        </div>
        <div className="mt-auto overflow-hidden">
          <MentorWalk progress={scrollYProgress} className="-ml-[45%] block h-auto w-[150%] max-w-none md:mx-auto md:w-full md:max-w-[1400px]" />
        </div>
      </div>
    </section>
  );
}

function Step({ index, title, body, range, progress }: { index: number; title: string; body: string; range: number[]; progress: MotionValue<number> }) {
  const [a, b] = range;
  const fade = 0.05;
  const opacity = useTransform(
    progress,
    index === 0 ? [b - fade, b] : index === steps.length - 1 ? [a - fade, a] : [a - fade, a, b - fade, b],
    index === 0 ? [1, 0] : index === steps.length - 1 ? [0, 1] : [0, 1, 1, 0],
  );
  const y = useTransform(opacity, [0, 1], [16, 0]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0">
      <p className="text-sm font-semibold text-ulab">Step {index + 1} of {steps.length}</p>
      <h2 className="mt-1 text-3xl font-semibold md:text-5xl">{title}</h2>
      <p className="mt-2 text-ink-soft md:text-lg">{body}</p>
    </motion.div>
  );
}

function Bar({ progress, range }: { progress: MotionValue<number>; range: number[] }) {
  const scaleX = useTransform(progress, range, [0, 1]);
  return (
    <span className="h-1 flex-1 overflow-hidden rounded-full bg-mist">
      <motion.span style={{ scaleX }} className="block h-full origin-left rounded-full bg-gradient-to-r from-ulab to-gold" />
    </span>
  );
}
