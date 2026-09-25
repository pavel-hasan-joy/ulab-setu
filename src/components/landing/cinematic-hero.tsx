"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { Badge, ButtonLink } from "../ui";
import { StudentCharacter } from "./student-character";

const headline = "Your seniors already know the way in.";
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Full-screen hero in three depth layers: the illustrated student (slowest), the copy, and floating cards (fastest).
 * Scrolling pushes the layers apart; moving the pointer tilts them in opposite directions.
 */
export function CinematicHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollYProgress = useTransform(raw, (v) => v);

  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -320]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const imgX = useTransform(sx, (v) => v * -14);
  const imgTiltY = useTransform(sy, (v) => v * -10);
  const cardX = useTransform(sx, (v) => v * 30);
  const cardTiltY = useTransform(sy, (v) => v * 20);

  return (
    <section
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      className="relative isolate flex min-h-[760px] items-end md:min-h-[640px] overflow-hidden md:h-[100svh] md:items-center"
      style={{ height: "100svh" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-paper via-sky/60 to-gold-wash/60" />
      <div className="dots absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_70%_45%,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-20 size-[560px] rounded-full bg-ulab-light/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 -z-20 size-[420px] rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40" style={{ background: "linear-gradient(0deg, var(--color-paper), transparent)" }} />

      {/* Layer 1: illustrated student, moves slowest */}
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-x-0 top-16 -z-10 flex justify-center md:inset-y-0 md:left-auto md:right-[4%] md:top-0 md:w-[46%] md:items-center"
      >
        <motion.div style={{ x: imgX, y: imgTiltY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease }} className="w-[52%] max-w-[250px] [mask-image:linear-gradient(to_bottom,black_82%,transparent)] md:w-full md:max-w-[560px]">
          <StudentCharacter lookX={sx} lookY={sy} className="h-auto w-full" />
        </motion.div>
      </motion.div>

      {/* Layer 2: copy */}
      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="relative mx-auto w-full max-w-6xl px-4 pb-24 md:px-6 md:pb-0">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Badge tone="gold" className="mb-5"><Sparkles size={12} /> For {site.universityShort} students and graduates</Badge>
          </motion.div>
          <h1 className="text-[2.7rem] font-semibold leading-[1.04] text-ink sm:text-5xl md:text-[4rem]">
            {headline.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "105%", opacity: 0, filter: "blur(6px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.07, ease }}
                >
                  {word}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease }}
            className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft"
          >
            Ask {site.universityShort} alumni about their work, apply to jobs they post, and browse fresh openings from across Bangladesh in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <ButtonLink href="/signup?role=student" className="px-5 py-3">I&apos;m a current student</ButtonLink>
            <ButtonLink href="/signup?role=alumni" variant="outline" className="px-5 py-3">I&apos;m an alumnus</ButtonLink>
          </motion.div>
        </div>
      </motion.div>

      {/* Layer 3: floating cards, closest to the viewer */}
      <motion.div style={{ y: cardsY, x: cardX }} className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div style={{ y: cardTiltY }} className="absolute inset-0">
          <FloatCard className="right-[3%] top-[20%]" delay={1.3} icon={<Briefcase size={16} />} tone="gold" title="Tanvir, class of 2018" body="Posted a job with referral" />
          <FloatCard className="bottom-[16%] right-[36%]" delay={1.6} icon={<GraduationCap size={16} />} tone="blue" title="Farhana, CSE" body="Applied to Frontend Intern" />
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        style={{ opacity: copyOpacity }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-ink-soft md:flex"
      >
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-mist">
          <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-ulab" />
        </span>
      </motion.div>
    </section>
  );
}

function FloatCard({ className, delay, icon, tone, title, body }: { className: string; delay: number; icon: React.ReactNode; tone: "gold" | "blue"; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease }}
      className={`absolute ${className}`}
    >
      <div className="flex animate-float items-center gap-3 rounded-2xl border border-white/40 bg-surface/70 px-4 py-3 shadow-lift backdrop-blur-xl">
        <span className={`grid size-9 place-items-center rounded-full ${tone === "gold" ? "bg-gold-wash text-gold-ink" : "bg-sky text-ulab"}`}>{icon}</span>
        <div className="text-sm leading-tight">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-ink-soft">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}
