"use client";

import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { Badge, ButtonLink } from "../ui";
import { AnimeSky } from "./anime-sky";

const headline = "Your seniors already know the way in.";
const ease = [0.22, 1, 0.36, 1] as const;

// Petals drifting through the hero. Positions are fixed so server and client render the same thing.
const petals = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 71) % 100,
  delay: -((i * 1.7) % 12),
  duration: 11 + ((i * 3) % 7),
  size: 8 + ((i * 5) % 7),
}));

/**
 * Full-screen hero in depth layers: anime sky (clouds at three speeds), the student, the copy,
 * and floating cards. Scrolling pushes the layers apart; the pointer tilts them.
 */
export function CinematicHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollYProgress = useTransform(raw, (v) => v);

  const girlY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const girlScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -340]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const girlX = useTransform(sx, (v) => v * -22);
  const girlTilt = useTransform(sx, (v) => v * -3);
  const cardX = useTransform(sx, (v) => v * 34);
  const cardTiltY = useTransform(sy, (v) => v * 22);

  return (
    <section
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      className="relative isolate flex min-h-[780px] items-end overflow-hidden md:min-h-[680px] md:items-center"
      style={{ height: "100svh" }}
    >
      <AnimeSky progress={scrollYProgress} className="absolute inset-0 -z-20" />

      {/* Falling petals */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {petals.map((p, i) => (
          <span
            key={i}
            className="absolute -top-8 block animate-[petal_linear_infinite] rounded-[80%_0_80%_0] bg-gradient-to-br from-[#ffd6e4] to-[#f7a8c4] opacity-80 dark:from-[#fff4c4] dark:to-[#f2cf6b] dark:opacity-70"
            style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      {/* Readability veil behind the copy */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-paper)_0%,color-mix(in_srgb,var(--color-paper)_85%,transparent)_40%,transparent_70%)] md:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-paper)_78%,transparent)_0%,color-mix(in_srgb,var(--color-paper)_40%,transparent)_40%,transparent_62%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-paper to-transparent" />

      {/* The student */}
      <motion.div
        style={{ y: girlY, scale: girlScale }}
        className="absolute inset-x-0 top-16 -z-10 flex justify-center md:inset-y-0 md:left-auto md:right-[6%] md:top-auto md:w-[40%] md:items-end"
      >
        <motion.div
          style={{ x: girlX, rotate: girlTilt }}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.25, ease }}
          className="relative w-[46%] max-w-[230px] md:w-full md:max-w-[520px]"
        >
          <div className="animate-float [animation-duration:6s]">
            <Image
              src="/images/anime-student.webp"
              alt="Anime-style illustration of a smiling student in school uniform making a peace sign"
              width={1034}
              height={1553}
              priority
              className="h-auto w-full drop-shadow-[0_24px_40px_rgba(22,41,74,0.25)] [mask-image:linear-gradient(to_bottom,black_86%,transparent)]"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Copy */}
      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="relative mx-auto w-full max-w-6xl px-4 pb-20 md:px-6 md:pb-0">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Badge tone="gold" className="mb-5 shadow-soft"><Sparkles size={12} /> For {site.universityShort} students, alumni and teachers</Badge>
          </motion.div>
          <h1 className="text-[2.7rem] font-semibold leading-[1.04] text-ink sm:text-5xl md:text-[4.2rem]">
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
            Ask {site.universityShort} alumni and teachers about their work, apply to jobs they post, and browse fresh openings from across Bangladesh in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <ButtonLink href="/signup?role=student" className="px-5 py-3">I&apos;m a current student</ButtonLink>
            <ButtonLink href="/signup?role=alumni" variant="outline" className="px-5 py-3">I&apos;m an alumnus</ButtonLink>
            <ButtonLink href="/signup?role=teacher" variant="outline" className="px-5 py-3">I&apos;m a teacher</ButtonLink>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating cards, closest layer */}
      <motion.div style={{ y: cardsY, x: cardX }} className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div style={{ y: cardTiltY }} className="absolute inset-0">
          <FloatCard className="right-[3%] top-[22%]" delay={1.3} icon={<Briefcase size={16} />} tone="gold" title="Tanvir, class of 2018" body="Posted a job with referral" />
          <FloatCard className="bottom-[14%] right-[38%]" delay={1.6} icon={<GraduationCap size={16} />} tone="blue" title="Farhana, CSE" body="Applied to Frontend Intern" />
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: copyOpacity }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-ink-soft md:flex">
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
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, duration: 0.7, ease }} className={`absolute ${className}`}>
      <div className="flex animate-float items-center gap-3 rounded-2xl border border-white/40 bg-surface/75 px-4 py-3 shadow-lift backdrop-blur-xl">
        <span className={`grid size-9 place-items-center rounded-full ${tone === "gold" ? "bg-gold-wash text-gold-ink" : "bg-sky text-ulab"}`}>{icon}</span>
        <div className="text-sm leading-tight">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-ink-soft">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}
