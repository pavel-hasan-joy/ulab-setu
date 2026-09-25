"use client";

import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";

// An alumnus walks a student by the hand to the "Jobs" building. The walk is scrubbed by scroll:
// `progress` (0 → 1) comes from the sticky section around it, so scrolling back walks them back.
// Leg and arm swing are derived from distance travelled, so the gait always matches the movement.

const GROUND = 430;
const START_X = 40;
const END_X = 700;
const ARRIVE_AT = 0.74;

const v = (name: string) => `var(--scene-${name})`;
const people = {
  skin1: "#efc7a6",
  skin2: "#d9a27e",
  hair: "#3a3350",
  blazer: "#4a78ae",
  shirt: "#ffffff",
  pantsDark: "#2e3d5c",
  pantsDarker: "#1f2b44",
  hoodie: "#9cc7ec",
  hoodieShade: "#86b6de",
  pantsLight: "#6b7c99",
  pantsLighter: "#56657f",
  backpack: "#efc75e",
  gold: "#e9b93a",
};

export function MentorWalk({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  const [arrived, setArrived] = useState(() => progress.get() > ARRIVE_AT);
  useMotionValueEvent(progress, "change", (p) => setArrived(p > ARRIVE_AT));

  const x = useTransform(progress, [0.04, ARRIVE_AT - 0.02], [START_X, END_X], { clamp: true });
  const opacity = useTransform(progress, [0, 0.05], [0, 1]);
  const legA = useTransform(x, (d) => Math.sin(d / 15) * 24);
  const legB = useTransform(legA, (a) => -a);
  const armSwing = useTransform(legA, (a) => -a * 0.7);
  const bob = useTransform(x, (d) => -Math.abs(Math.sin(d / 15)) * 3);

  const gait = { legA, legB, armSwing };

  return (
    <svg viewBox="0 0 1200 480" className={className} preserveAspectRatio="xMidYMax meet" aria-hidden>
      <style>{`
        .mw-cloud { animation: mw-drift 60s linear infinite; }
        .mw-cloud-slow { animation: mw-drift 90s linear infinite; }
        @keyframes mw-drift { from { transform: translateX(-200px); } to { transform: translateX(1400px); } }
        .mw-window { transition: fill 0.4s ease; }
      `}</style>

      {/* Sky */}
      <circle cx="1040" cy="90" r="70" fill={v("sun-glow")} opacity="0.6" />
      <circle cx="1040" cy="90" r="46" fill={v("sun")} opacity="0.85" />
      <g className="mw-cloud" opacity="0.9"><Cloud x={0} y={70} s={1} /></g>
      <g className="mw-cloud-slow" opacity="0.7" style={{ animationDelay: "-40s" }}><Cloud x={0} y={140} s={0.7} /></g>

      {/* Distant skyline */}
      <g fill={v("skyline")}>
        <rect x="560" y="300" width="60" height="130" rx="6" />
        <rect x="640" y="250" width="70" height="180" rx="6" />
        <rect x="720" y="210" width="60" height="220" rx="6" />
        <rect x="1110" y="230" width="80" height="200" rx="6" />
      </g>

      <Tree x={250} s={1} />
      <Tree x={520} s={0.8} />
      <Tree x={1170} s={0.9} />

      {/* Jobs building */}
      <g>
        <rect x="880" y="130" width="210" height={GROUND - 130} rx="10" fill={v("building")} stroke={v("edge")} strokeWidth="2" />
        <rect x="880" y="130" width="210" height="18" rx="9" fill={v("edge")} />
        <rect x="925" y="92" width="120" height="34" rx="17" fill={v("bubble")} stroke={v("edge")} strokeWidth="2" />
        <rect x="941" y="102" width="18" height="14" rx="3" fill="none" stroke={people.gold} strokeWidth="2.5" />
        <path d="M945 102 v-3 h10 v3" fill="none" stroke={people.gold} strokeWidth="2.5" strokeLinecap="round" />
        <text x="968" y="115" className="font-display" fontSize="16" fontWeight="700" fill="var(--color-ulab-deep)">JOBS</text>
        {Array.from({ length: 18 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          return (
            <rect
              key={i}
              className="mw-window"
              x={904 + col * 58}
              y={165 + row * 38}
              width="44"
              height="24"
              rx="5"
              stroke={v("edge")}
              strokeWidth="1.5"
              // Light up from the ground floor upwards.
              style={{ fill: arrived ? v("window-on") : v("window-off"), transitionDelay: arrived ? `${0.2 + (17 - i) * 0.07}s` : "0s" }}
            />
          );
        })}
        <rect x="955" y={GROUND - 64} width="60" height="64" rx="8" fill={v("bubble")} stroke={v("edge")} strokeWidth="2" />
        <line x1="985" y1={GROUND - 64} x2="985" y2={GROUND} stroke={v("edge")} strokeWidth="2" />
        <circle cx="977" cy={GROUND - 30} r="2.5" fill={people.gold} />
        <circle cx="993" cy={GROUND - 30} r="2.5" fill={people.gold} />
        <AnimatePresence>
          {arrived && (
            <motion.path
              d="M1062 60 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z"
              fill={people.gold}
              initial={{ scale: 0, opacity: 0, rotate: -40 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 1.2 }}
            />
          )}
        </AnimatePresence>
      </g>

      {/* Ground */}
      <path d={`M0 ${GROUND} H1200`} stroke={v("ground")} strokeWidth="2" />
      <path d={`M40 ${GROUND + 18} C 300 ${GROUND + 8}, 600 ${GROUND + 28}, 985 ${GROUND + 6}`} fill="none" stroke={v("path")} strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" />

      {/* The pair */}
      <motion.g style={{ x, opacity }}>
        <motion.g style={{ y: bob }}>
          <Student gait={gait} />
          <Alumni gait={gait} pointing={arrived} />
        </motion.g>
        <AnimatePresence>
          {arrived && (
            <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
              <rect x="-40" y={GROUND - 250} width="178" height="44" rx="14" fill={v("bubble")} stroke={v("edge")} strokeWidth="1.5" />
              <path d={`M62 ${GROUND - 207} l4 16 12 -16`} fill={v("bubble")} stroke={v("edge")} strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="60" y={GROUND - 208} width="22" height="4" fill={v("bubble")} />
              <text x="49" y={GROUND - 223} textAnchor="middle" className="font-sans" fontSize="15" fontWeight="600" fill={v("bubble-ink")}>
                Your first job is in there.
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
    </svg>
  );
}

type Gait = { legA: MotionValue<number>; legB: MotionValue<number>; armSwing: MotionValue<number> };
const limb = (rotate: MotionValue<number>) => ({ rotate, originX: 0.5, originY: 0 });

function Student({ gait }: { gait: Gait }) {
  const hip = GROUND - 50;
  return (
    <g>
      <motion.line style={limb(gait.legB)} x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={people.pantsLighter} strokeWidth="10" strokeLinecap="round" />
      <motion.line style={limb(gait.armSwing)} x1="-4" y1={GROUND - 84} x2="-4" y2={GROUND - 56} stroke={people.hoodieShade} strokeWidth="9" strokeLinecap="round" />
      <rect x="-26" y={GROUND - 90} width="14" height="36" rx="6" fill={people.backpack} />
      <motion.line style={limb(gait.legA)} x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={people.pantsLight} strokeWidth="10" strokeLinecap="round" />
      <rect x="-15" y={GROUND - 94} width="30" height="48" rx="13" fill={people.hoodie} />
      <path d={`M-12 ${GROUND - 88} v18`} stroke={people.backpack} strokeWidth="3" strokeLinecap="round" />
      <circle cx="2" cy={GROUND - 108} r="13" fill={people.skin2} />
      <path d={`M-11 ${GROUND - 110} a13 13 0 0 1 26 -2 q-9 -2 -14 -8 q-4 6 -12 10z`} fill={people.hair} />
      <circle cx="9" cy={GROUND - 108} r="1.6" fill={people.hair} />
      {/* holding the alumnus' hand */}
      <line x1="8" y1={GROUND - 84} x2="34" y2={GROUND - 68} stroke={people.hoodie} strokeWidth="9" strokeLinecap="round" />
      <circle cx="35" cy={GROUND - 67} r="5.5" fill={people.skin2} />
    </g>
  );
}

function Alumni({ gait, pointing }: { gait: Gait; pointing: boolean }) {
  const hip = GROUND - 66;
  const shoulderY = GROUND - 116;
  return (
    <g transform="translate(64 0)">
      <motion.line style={limb(gait.legB)} x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={people.pantsDarker} strokeWidth="11" strokeLinecap="round" />
      <line x1="-9" y1={shoulderY + 4} x2="-27" y2={GROUND - 70} stroke={people.blazer} strokeWidth="10" strokeLinecap="round" />
      <circle cx="-29" cy={GROUND - 68} r="6" fill={people.skin1} />
      <motion.line style={limb(gait.legA)} x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={people.pantsDark} strokeWidth="11" strokeLinecap="round" />
      <rect x="-18" y={shoulderY - 8} width="36" height="62" rx="14" fill={people.blazer} />
      <path d={`M-7 ${shoulderY - 8} L0 ${shoulderY + 8} L7 ${shoulderY - 8}z`} fill={people.shirt} />
      <line x1="0" y1={shoulderY + 8} x2="0" y2={shoulderY + 30} stroke={people.gold} strokeWidth="2" />
      <rect x="-5" y={shoulderY + 30} width="10" height="13" rx="2" fill={people.gold} />
      <circle cx="2" cy={shoulderY - 24} r="15" fill={people.skin1} />
      <path d={`M-13 ${shoulderY - 26} a15 15 0 0 1 30 -3 q-12 1 -18 -7 q-4 7 -12 10z`} fill={people.hair} />
      <circle cx="10" cy={shoulderY - 24} r="1.8" fill={people.hair} />
      <motion.path d={`M6 ${shoulderY - 16} q4 3 8 0`} fill="none" stroke={people.hair} strokeWidth="1.8" strokeLinecap="round" animate={{ opacity: pointing ? 1 : 0 }} />
      {/* free arm: swings with the walk, points at the building on arrival */}
      <g transform={`translate(9 ${shoulderY + 2})`}>
        <motion.g initial={false} animate={{ rotate: pointing ? -118 : 0 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} style={{ originX: 0, originY: 0 }}>
          <motion.g style={{ rotate: pointing ? 0 : gait.armSwing, originX: 0.5, originY: 0 }}>
            <line x1="0" y1="0" x2="0" y2="38" stroke={people.blazer} strokeWidth="10" strokeLinecap="round" />
            <circle cx="0" cy="42" r="6" fill={people.skin1} />
          </motion.g>
        </motion.g>
      </g>
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={v("cloud")}>
      <ellipse cx="60" cy="20" rx="60" ry="18" />
      <circle cx="40" cy="10" r="22" />
      <circle cx="75" cy="4" r="26" />
    </g>
  );
}

function Tree({ x, s }: { x: number; s: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <rect x="-4" y="-60" width="8" height="60" rx="4" fill={v("trunk")} />
      <circle cx="0" cy="-78" r="30" fill={v("tree")} />
      <circle cx="-16" cy="-62" r="20" fill={v("tree-dark")} opacity="0.7" />
      <circle cx="16" cy="-92" r="18" fill={v("tree")} />
    </g>
  );
}
