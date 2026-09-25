"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

// An anime-style sky painted in layers (think Makoto Shinkai backgrounds): gradient sky, light rays,
// towering cumulus clouds, a distant city and hills. Each layer moves at its own speed with scroll,
// and the whole sky turns to night in the dark theme.

function Cumulus({ x, y, s, flip = false, id }: { x: number; y: number; s: number; flip?: boolean; id: string }) {
  // Many overlapping puffs, lit from above, shaded underneath.
  const puffs: [number, number, number][] = [
    [0, 60, 70], [70, 30, 85], [160, 10, 105], [260, 30, 90], [340, 60, 70], [120, 80, 75], [220, 85, 80], [300, 95, 55], [40, 100, 50],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g fill={`url(#${id}-shade)`}>
        {puffs.map(([cx, cy, r], i) => <circle key={`s${i}`} cx={cx} cy={cy + 18} r={r} />)}
      </g>
      <g fill={`url(#${id}-lit)`}>
        {puffs.map(([cx, cy, r], i) => <circle key={`l${i}`} cx={cx} cy={cy} r={r * 0.94} />)}
      </g>
    </g>
  );
}

export function AnimeSky({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  const far = useTransform(progress, [0, 1], ["0%", "12%"]);
  const mid = useTransform(progress, [0, 1], ["0%", "28%"]);
  const near = useTransform(progress, [0, 1], ["0%", "46%"]);
  const ground = useTransform(progress, [0, 1], ["0%", "8%"]);

  return (
    <div className={className} aria-hidden>
      {/* Sky gradient: day and night versions cross-fade with the theme */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#5fb2ee_0%,#8fcaf4_38%,#cfe8fa_70%,#fff1dc_100%)] transition-opacity duration-700 dark:opacity-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#070d24_0%,#132150_45%,#2b3470_78%,#57508a_100%)] opacity-0 transition-opacity duration-700 dark:opacity-100" />

      {/* Light rays (day only) */}
      <div className="absolute inset-0 overflow-hidden opacity-60 mix-blend-soft-light dark:opacity-0">
        <div className="absolute -right-1/4 -top-1/3 h-[160%] w-[90%] origin-top-right animate-[rays_18s_ease-in-out_infinite] bg-[repeating-conic-gradient(from_200deg_at_100%_0%,rgba(255,255,255,0.5)_0deg_4deg,transparent_4deg_11deg)]" />
      </div>

      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          {["far", "mid", "near"].map((id) => (
            <g key={id}>
              <linearGradient id={`${id}-lit`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--cloud-top)" />
                <stop offset="1" stopColor="var(--cloud-mid)" />
              </linearGradient>
              <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--cloud-mid)" />
                <stop offset="1" stopColor="var(--cloud-shade)" />
              </linearGradient>
            </g>
          ))}
        </defs>

        {/* Far clouds */}
        <motion.g style={{ y: far }} opacity="0.75">
          <g className="animate-[drift_120s_linear_infinite]">
            <Cumulus id="far" x={80} y={260} s={0.55} />
            <Cumulus id="far" x={700} y={200} s={0.45} flip />
            <Cumulus id="far" x={1180} y={280} s={0.5} />
          </g>
        </motion.g>

        {/* Distant city and campus towers */}
        <motion.g style={{ y: ground }}>
          <path
            d="M0 700 V640 h40 v-30 h30 v50 h40 v-80 h24 v-20 h20 v100 h50 v-60 h36 v60 h60 v-110 h14 v-14 h14 v124 h40 v-50 h50 v70 h70 v-90 h30 v-30 h30 v120 h46 v-70 h40 v90 h60 v-130 h20 v-20 h24 v150 h40 v-60 h56 v80 h50 v-100 h30 v100 h60 v-70 h40 v70 h70 v-120 h26 v120 h50 v-60 h46 v80 h40 V700z"
            fill="var(--city)"
          />
          {/* lit windows at night */}
          <g className="opacity-0 transition-opacity duration-700 dark:opacity-100" fill="#f7d774">
            {Array.from({ length: 40 }).map((_, i) => (
              <rect key={i} x={30 + ((i * 137) % 1380)} y={600 + ((i * 53) % 80)} width="5" height="7" opacity={0.5 + ((i * 7) % 5) / 10} />
            ))}
          </g>
        </motion.g>

        {/* Mid clouds: the big towering ones */}
        <motion.g style={{ y: mid }}>
          <g className="animate-[drift_90s_linear_infinite_reverse]">
            <Cumulus id="mid" x={-60} y={430} s={1.1} />
            <Cumulus id="mid" x={1000} y={380} s={1.25} flip />
          </g>
        </motion.g>

        {/* Rolling hills */}
        <motion.g style={{ y: ground }}>
          <path d="M0 760 C 220 690 420 720 640 745 C 900 775 1120 690 1440 720 V900 H0z" fill="var(--hill-far)" />
          <path d="M0 820 C 260 770 520 800 760 815 C 1020 830 1240 780 1440 800 V900 H0z" fill="var(--hill-near)" />
        </motion.g>

        {/* Near clouds drift across the bottom */}
        <motion.g style={{ y: near }} opacity="0.95">
          <g className="animate-[drift_70s_linear_infinite]">
            <Cumulus id="near" x={240} y={780} s={0.9} />
            <Cumulus id="near" x={1240} y={800} s={0.8} flip />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}
