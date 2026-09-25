"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Hero background: an alumnus walks a student by the hand to the "Jobs" building,
// then points at it while its windows light up. Loops.

const GROUND = 430;
const START_X = 60;
const END_X = 700;
const WALK_SECONDS = 9;

type Phase = "walk" | "arrive";

const c = {
  sky: "#eaf3fb",
  skin1: "#efc7a6",
  skin2: "#d9a27e",
  hair: "#3a3350",
  blazer: "#4a78ae",
  shirt: "#ffffff",
  pantsDark: "#2e3d5c",
  hoodie: "#9cc7ec",
  hoodieShade: "#86b6de",
  pantsLight: "#6b7c99",
  backpack: "#efc75e",
  gold: "#e9b93a",
  building: "#dcebf7",
  buildingEdge: "#bcd6ee",
  windowOff: "#f5f8fc",
  windowOn: "#f8dc85",
  tree: "#cfe6d9",
  treeDark: "#b5d7c4",
};

export function MentorWalk({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [phase, setPhase] = useState<Phase>(reduce ? "arrive" : "walk");

  useEffect(() => {
    if (reduce) {
      controls.set({ x: END_X, opacity: 1 });
      return;
    }
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        setPhase("walk");
        controls.set({ x: START_X, opacity: 0 });
        await controls.start({ opacity: 1, transition: { duration: 0.6 } });
        if (!alive) break;
        await controls.start({ x: END_X, transition: { duration: WALK_SECONDS, ease: "linear" } });
        if (!alive) break;
        setPhase("arrive");
        await wait(4200);
        if (!alive) break;
        await controls.start({ opacity: 0, transition: { duration: 0.8 } });
      }
    })();
    return () => {
      alive = false;
      controls.stop();
    };
  }, [controls, reduce]);

  const walking = phase === "walk";

  return (
    <svg viewBox="0 0 1200 480" className={className} preserveAspectRatio="xMidYMax meet" aria-hidden>
      <style>{`
        .mw-leg-a { animation: mw-swing 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0; }
        .mw-leg-b { animation: mw-swing 0.9s ease-in-out infinite; animation-delay: -0.45s; transform-box: fill-box; transform-origin: 50% 0; }
        .mw-arm { animation: mw-arm 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0; }
        .mw-bob { animation: mw-bob 0.45s ease-in-out infinite alternate; }
        .mw-still .mw-leg-a, .mw-still .mw-leg-b, .mw-still .mw-arm, .mw-still .mw-bob { animation: none; }
        .mw-cloud { animation: mw-drift 60s linear infinite; }
        .mw-cloud-slow { animation: mw-drift 90s linear infinite; }
        @keyframes mw-swing { 0%,100% { transform: rotate(22deg); } 50% { transform: rotate(-22deg); } }
        @keyframes mw-arm { 0%,100% { transform: rotate(-16deg); } 50% { transform: rotate(16deg); } }
        @keyframes mw-bob { from { transform: translateY(0); } to { transform: translateY(-3px); } }
        @keyframes mw-drift { from { transform: translateX(-200px); } to { transform: translateX(1400px); } }
      `}</style>

      {/* Sky details */}
      <circle cx="1040" cy="90" r="46" fill="#fdf0c6" opacity="0.8" />
      <circle cx="1040" cy="90" r="70" fill="#fdf5dc" opacity="0.5" />
      <g className="mw-cloud" opacity="0.9">
        <Cloud x={0} y={70} s={1} />
      </g>
      <g className="mw-cloud-slow" opacity="0.7" style={{ animationDelay: "-40s" }}>
        <Cloud x={0} y={140} s={0.7} />
      </g>

      {/* Distant skyline */}
      <g fill="#e6eff9">
        <rect x="640" y="250" width="70" height="180" rx="6" />
        <rect x="720" y="210" width="60" height="220" rx="6" />
        <rect x="1110" y="230" width="80" height="200" rx="6" />
        <rect x="560" y="300" width="60" height="130" rx="6" />
      </g>

      {/* Trees */}
      <Tree x={250} s={1} />
      <Tree x={520} s={0.8} />
      <Tree x={1170} s={0.9} />

      {/* Jobs building */}
      <g>
        <rect x="880" y="130" width="210" height={GROUND - 130} rx="10" fill={c.building} stroke={c.buildingEdge} strokeWidth="2" />
        <rect x="880" y="130" width="210" height="18" rx="9" fill={c.buildingEdge} />
        {/* Sign */}
        <g>
          <rect x="925" y="92" width="120" height="34" rx="17" fill="#fff" stroke={c.buildingEdge} strokeWidth="2" />
          <rect x="941" y="102" width="18" height="14" rx="3" fill="none" stroke={c.gold} strokeWidth="2.5" />
          <path d="M945 102 v-3 h10 v3" fill="none" stroke={c.gold} strokeWidth="2.5" strokeLinecap="round" />
          <text x="968" y="115" className="font-display" fontSize="16" fontWeight="700" fill="#134f88">JOBS</text>
        </g>
        {/* Windows light up one by one on arrival */}
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 3 }).map((_, col) => {
            const i = row * 3 + col;
            return (
              <motion.rect
                key={i}
                x={904 + col * 58}
                y={165 + row * 38}
                width="44"
                height="24"
                rx="5"
                initial={false}
                animate={{ fill: phase === "arrive" ? c.windowOn : c.windowOff }}
                transition={{ duration: 0.4, delay: phase === "arrive" ? 0.3 + (17 - i) * 0.08 : 0 }}
                stroke={c.buildingEdge}
                strokeWidth="1.5"
              />
            );
          }),
        )}
        {/* Door */}
        <rect x="955" y={GROUND - 64} width="60" height="64" rx="8" fill="#fff" stroke={c.buildingEdge} strokeWidth="2" />
        <line x1="985" y1={GROUND - 64} x2="985" y2={GROUND} stroke={c.buildingEdge} strokeWidth="2" />
        <circle cx="977" cy={GROUND - 30} r="2.5" fill={c.gold} />
        <circle cx="993" cy={GROUND - 30} r="2.5" fill={c.gold} />
        {/* Sparkle above sign on arrival */}
        <AnimatePresence>
          {phase === "arrive" && (
            <motion.g
              initial={{ scale: 0, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 1.6 }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <path d="M1062 60 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z" fill={c.gold} />
            </motion.g>
          )}
        </AnimatePresence>
      </g>

      {/* Ground and path */}
      <path d={`M0 ${GROUND} H1200`} stroke="#d5e3f1" strokeWidth="2" />
      <path d={`M40 ${GROUND + 18} C 300 ${GROUND + 8}, 600 ${GROUND + 28}, 985 ${GROUND + 6}`} fill="none" stroke="#dbe7f3" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" />

      {/* The pair */}
      <motion.g animate={controls} initial={{ x: START_X, opacity: 0 }} className={walking ? "" : "mw-still"}>
        <g className="mw-bob">
          <Student />
          <Alumni pointing={phase === "arrive"} />
        </g>
        <AnimatePresence>
          {phase === "arrive" && (
            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <rect x="-40" y={GROUND - 250} width="178" height="44" rx="14" fill="#fff" stroke={c.buildingEdge} strokeWidth="1.5" />
              <path d={`M62 ${GROUND - 207} l4 16 12 -16`} fill="#fff" stroke={c.buildingEdge} strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="60" y={GROUND - 208} width="22" height="4" fill="#fff" />
              <text x="49" y={GROUND - 223} textAnchor="middle" className="font-sans" fontSize="15" fontWeight="600" fill="#16294a">
                Your first job is in there.
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
    </svg>
  );
}

// Student faces right, on the left of the pair. Feet at (0, GROUND).
function Student() {
  const hip = GROUND - 50;
  return (
    <g>
      {/* back leg, back arm */}
      <line className="mw-leg-b" x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke="#56657f" strokeWidth="10" strokeLinecap="round" />
      <line className="mw-arm" x1="-4" y1={GROUND - 84} x2="-4" y2={GROUND - 56} stroke={c.hoodieShade} strokeWidth="9" strokeLinecap="round" />
      {/* backpack */}
      <rect x="-26" y={GROUND - 90} width="14" height="36" rx="6" fill={c.backpack} />
      {/* front leg */}
      <line className="mw-leg-a" x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={c.pantsLight} strokeWidth="10" strokeLinecap="round" />
      {/* torso */}
      <rect x="-15" y={GROUND - 94} width="30" height="48" rx="13" fill={c.hoodie} />
      <path d={`M-12 ${GROUND - 88} v18`} stroke={c.backpack} strokeWidth="3" strokeLinecap="round" />
      {/* head */}
      <circle cx="2" cy={GROUND - 108} r="13" fill={c.skin2} />
      <path d={`M-11 ${GROUND - 110} a13 13 0 0 1 26 -2 q-9 -2 -14 -8 q-4 6 -12 10z`} fill={c.hair} />
      <circle cx="9" cy={GROUND - 108} r="1.6" fill={c.hair} />
      {/* arm reaching up to the alumnus' hand */}
      <line x1="8" y1={GROUND - 84} x2="34" y2={GROUND - 68} stroke={c.hoodie} strokeWidth="9" strokeLinecap="round" />
      <circle cx="35" cy={GROUND - 67} r="5.5" fill={c.skin2} />
    </g>
  );
}

// Alumnus stands to the right of the student (offset 64), taller, pointing on arrival.
function Alumni({ pointing }: { pointing: boolean }) {
  const x = 64;
  const hip = GROUND - 66;
  const shoulderY = GROUND - 116;
  return (
    <g transform={`translate(${x} 0)`}>
      <line className="mw-leg-b" x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke="#1f2b44" strokeWidth="11" strokeLinecap="round" />
      {/* arm holding the student's hand */}
      <line x1="-9" y1={shoulderY + 4} x2="-27" y2={GROUND - 70} stroke={c.blazer} strokeWidth="10" strokeLinecap="round" />
      <circle cx="-29" cy={GROUND - 68} r="6" fill={c.skin1} />
      <line className="mw-leg-a" x1="0" y1={hip} x2="0" y2={GROUND - 2} stroke={c.pantsDark} strokeWidth="11" strokeLinecap="round" />
      {/* torso */}
      <rect x="-18" y={shoulderY - 8} width="36" height="62" rx="14" fill={c.blazer} />
      <path d={`M-7 ${shoulderY - 8} L0 ${shoulderY + 8} L7 ${shoulderY - 8}z`} fill={c.shirt} />
      <line x1="0" y1={shoulderY + 8} x2="0" y2={shoulderY + 30} stroke={c.gold} strokeWidth="2" />
      <rect x="-5" y={shoulderY + 30} width="10" height="13" rx="2" fill={c.gold} />
      {/* head */}
      <circle cx="2" cy={shoulderY - 24} r="15" fill={c.skin1} />
      <path d={`M-13 ${shoulderY - 26} a15 15 0 0 1 30 -3 q-12 1 -18 -7 q-4 7 -12 10z`} fill={c.hair} />
      <circle cx="10" cy={shoulderY - 24} r="1.8" fill={c.hair} />
      <motion.path
        d={`M6 ${shoulderY - 16} q4 3 8 0`}
        fill="none"
        stroke={c.hair}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ opacity: pointing ? 1 : 0 }}
      />
      {/* free arm: swings while walking, points at the building on arrival */}
      <g transform={`translate(9 ${shoulderY + 2})`}>
        <motion.g
          initial={false}
          animate={{ rotate: pointing ? -118 : -8 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
          style={{ originX: 0, originY: 0 }}
        >
          <g className={pointing ? "" : "mw-arm"}>
            <line x1="0" y1="0" x2="0" y2="38" stroke={c.blazer} strokeWidth="10" strokeLinecap="round" />
            <circle cx="0" cy="42" r="6" fill={c.skin1} />
          </g>
        </motion.g>
      </g>
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
      <ellipse cx="60" cy="20" rx="60" ry="18" />
      <circle cx="40" cy="10" r="22" />
      <circle cx="75" cy="4" r="26" />
    </g>
  );
}

function Tree({ x, s }: { x: number; s: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <rect x="-4" y="-60" width="8" height="60" rx="4" fill="#d9c9b0" />
      <circle cx="0" cy="-78" r="30" fill={c.tree} />
      <circle cx="-16" cy="-62" r="20" fill={c.treeDark} opacity="0.7" />
      <circle cx="16" cy="-92" r="18" fill={c.tree} />
    </g>
  );
}
