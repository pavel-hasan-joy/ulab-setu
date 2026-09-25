"use client";

import { motion, useReducedMotion } from "motion/react";
import { GraduationCap, Briefcase } from "lucide-react";

// "Setu" means bridge. Students on the left, alumni on the right, arcs drawing the connections between them.
const students = [
  { x: 70, y: 90 }, { x: 40, y: 170 }, { x: 95, y: 240 }, { x: 55, y: 320 }, { x: 110, y: 380 },
];
const alumni = [
  { x: 470, y: 70 }, { x: 510, y: 150 }, { x: 455, y: 230 }, { x: 505, y: 310 }, { x: 465, y: 390 },
];
const links: [number, number][] = [[0, 1], [1, 0], [2, 2], [3, 3], [4, 2], [1, 4], [3, 1]];

function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const lift = 70 + Math.abs(a.y - b.y) * 0.25;
  return `M ${a.x} ${a.y} Q ${mx} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
}

export function BridgeHero() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto aspect-[58/46] w-full max-w-[560px]">
      <svg viewBox="0 0 580 460" className="absolute inset-0 h-full w-full" role="img" aria-label="Students connecting with alumni">
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-ulab-light)" />
            <stop offset="1" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>

        {links.map(([s, a], i) => (
          <g key={i}>
            <motion.path
              id={`arc-${i}`}
              d={arc(students[s], alumni[a])}
              fill="none"
              stroke="url(#arc)"
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.75 }}
              transition={{ duration: 1.4, delay: 0.5 + i * 0.18, ease: [0.65, 0, 0.35, 1] }}
            />
            {!reduce && (
              <circle r={3.2} fill="var(--color-ulab)" opacity={0}>
                <animate attributeName="opacity" values="0;1;1;0" dur={`${4 + (i % 3)}s`} begin={`${2 + i * 0.6}s`} repeatCount="indefinite" />
                <animateMotion dur={`${4 + (i % 3)}s`} begin={`${2 + i * 0.6}s`} repeatCount="indefinite">
                  <mpath href={`#arc-${i}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        ))}

        {students.map((p, i) => (
          <motion.g key={`s${i}`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 260, damping: 18 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
            <circle cx={p.x} cy={p.y} r={17} fill="var(--color-sky)" stroke="var(--color-ulab-light)" strokeWidth={1.5} />
            <circle cx={p.x} cy={p.y} r={5} fill="var(--color-ulab)" />
          </motion.g>
        ))}
        {alumni.map((p, i) => (
          <motion.g key={`a${i}`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 260, damping: 18 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
            <circle cx={p.x} cy={p.y} r={19} fill="var(--color-gold-wash)" stroke="var(--color-gold)" strokeWidth={1.5} />
            <circle cx={p.x} cy={p.y} r={5.5} fill="var(--color-gold)" />
          </motion.g>
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-[4%] left-[10%] animate-float"
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-mist bg-surface/90 px-3.5 py-2.5 shadow-soft backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full bg-sky text-ulab"><GraduationCap size={16} /></span>
          <div className="text-xs leading-tight">
            <p className="font-semibold text-ink">Farhana, CSE</p>
            <p className="text-ink-soft">Applied to Frontend Intern</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute right-[18%] -top-[4%] animate-float [animation-delay:-3s]"
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-mist bg-surface/90 px-3.5 py-2.5 shadow-soft backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full bg-gold-wash text-gold-ink"><Briefcase size={16} /></span>
          <div className="text-xs leading-tight">
            <p className="font-semibold text-ink">Tanvir, class of 2018</p>
            <p className="text-ink-soft">Posted a job with referral</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
