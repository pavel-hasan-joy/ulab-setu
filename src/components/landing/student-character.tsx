"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

// An illustrated (not photographed) student for the hero. She waves, blinks, her hair sways,
// and her eyes follow the pointer via `lookX` / `lookY` (-0.5 → 0.5).

const c = {
  skin: "#f3cba9",
  skinShade: "#e6b28e",
  hair: "#3b2f4a",
  hairLight: "#54456a",
  kurti: "#8fc0ea",
  kurtiShade: "#76acdc",
  orna: "#f3d27a",
  ornaShade: "#e6bd55",
  cheek: "#f4a0a0",
  eye: "#2b2340",
  lips: "#d9756f",
  bookBlue: "#4a78ae",
  bookGold: "#e9b93a",
  bookSage: "#6cb38f",
};

export function StudentCharacter({ lookX, lookY, className }: { lookX: MotionValue<number>; lookY: MotionValue<number>; className?: string }) {
  const pupilX = useTransform(lookX, (v) => v * 6);
  const pupilY = useTransform(lookY, (v) => v * 6);
  const headTilt = useTransform(lookX, (v) => v * 4);

  return (
    <svg viewBox="0 0 520 640" className={className} role="img" aria-label="Illustration of a smiling university student waving hello">
      <style>{`
        .sc-blink { animation: sc-blink 4.5s infinite; transform-box: fill-box; transform-origin: center; }
        .sc-wave { animation: sc-wave 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 0% 100%; }
        .sc-hair { animation: sc-sway 5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0%; }
        .sc-breathe { animation: sc-breathe 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .sc-twinkle { animation: sc-twinkle 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .sc-orbit { animation: sc-float 6s ease-in-out infinite; }
        .sc-blob { animation: sc-spin 40s linear infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes sc-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
        @keyframes sc-wave { 0%, 55%, 100% { transform: rotate(0deg); } 62% { transform: rotate(14deg); } 70% { transform: rotate(-6deg); } 78% { transform: rotate(12deg); } 86% { transform: rotate(-4deg); } }
        @keyframes sc-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
        @keyframes sc-breathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.012); } }
        @keyframes sc-twinkle { 0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.4; } 50% { transform: scale(1) rotate(20deg); opacity: 1; } }
        @keyframes sc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes sc-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Backdrop blobs */}
      <path className="sc-blob" d="M262 92c92-8 178 52 192 146s-30 196-120 232-214 8-262-76-24-196 44-254c40-34 90-44 146-48z" fill="var(--color-sky)" />
      <circle cx="400" cy="160" r="70" fill="var(--color-gold-wash)" />
      <circle cx="120" cy="470" r="46" fill="var(--color-sage-wash)" />

      {/* Floating things */}
      <g className="sc-orbit">
        {/* graduation cap */}
        <g transform="translate(70 170) rotate(-12)">
          <path d="M0 18 L40 0 L80 18 L40 36z" fill={c.bookBlue} />
          <path d="M18 26 v16 q22 12 44 0 v-16 l-22 10z" fill="#3c6597" />
          <path d="M72 22 v22" stroke={c.bookGold} strokeWidth="3" strokeLinecap="round" />
          <circle cx="72" cy="46" r="4" fill={c.bookGold} />
        </g>
      </g>
      <g className="sc-orbit" style={{ animationDelay: "-3s" }}>
        {/* briefcase */}
        <g transform="translate(420 300) rotate(8)">
          <rect x="0" y="10" width="62" height="44" rx="9" fill={c.bookGold} />
          <path d="M20 10 v-6 h22 v6" fill="none" stroke="#c9971c" strokeWidth="4" strokeLinecap="round" />
          <rect x="0" y="26" width="62" height="5" fill="#d6a42b" />
        </g>
      </g>
      <g className="sc-twinkle"><path d="M420 90 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z" fill={c.bookGold} /></g>
      <g className="sc-twinkle" style={{ animationDelay: "-1.2s" }}><path d="M110 330 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="var(--color-ulab-light)" /></g>
      <g className="sc-twinkle" style={{ animationDelay: "-0.6s" }}><circle cx="455" cy="440" r="6" fill="var(--color-ulab-light)" /></g>

      <g className="sc-breathe">
        {/* Long hair behind */}
        <g className="sc-hair">
          <path d="M168 250 C150 360 160 470 196 520 L324 520 C360 470 372 360 352 250 C340 160 180 160 168 250z" fill={c.hair} />
        </g>

        {/* Body: kurti */}
        <path d="M188 420 C196 398 226 388 260 388 C294 388 324 398 332 420 L360 640 L160 640z" fill={c.kurti} />
        <path d="M260 388 L260 640" stroke={c.kurtiShade} strokeWidth="3" opacity="0.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={200 + (i % 3) * 60} cy={560 + Math.floor(i / 3) * 40} r="4" fill="#fff" opacity="0.55" />
        ))}

        {/* Neck */}
        <path d="M242 356 h36 v40 q-18 10 -36 0z" fill={c.skinShade} />

        {/* Orna draped over the shoulders */}
        <path d="M184 424 C210 400 240 404 262 420 C286 404 312 398 338 420 C344 470 330 520 318 560 C300 500 286 460 262 440 C236 470 214 520 196 566 C184 520 178 470 184 424z" fill={c.orna} />
        <path d="M262 420 C262 440 262 440 262 440" stroke={c.ornaShade} strokeWidth="3" />

        {/* Backpack strap and ID lanyard */}
        <path d="M318 402 C326 440 330 480 330 520" stroke="#e0a93a" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M248 396 L262 470 L276 396" stroke="var(--color-ulab)" strokeWidth="3" fill="none" />
        <g transform="translate(244 468) rotate(-4)">
          <rect width="36" height="46" rx="6" fill="#fff" stroke="#cfdcea" strokeWidth="2" />
          <rect x="6" y="6" width="24" height="14" rx="3" fill="var(--color-ulab)" />
          <text x="18" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="sans-serif">ULAB</text>
          <rect x="7" y="26" width="22" height="3" rx="1.5" fill="#cfdcea" />
          <rect x="7" y="33" width="15" height="3" rx="1.5" fill="#cfdcea" />
        </g>

        {/* Books hugged to her chest, with her arm around them */}
        <g transform="translate(170 470) rotate(-8)">
          <rect x="0" y="0" width="92" height="20" rx="4" fill={c.bookBlue} />
          <rect x="6" y="20" width="84" height="18" rx="4" fill={c.bookGold} />
          <rect x="2" y="38" width="90" height="20" rx="4" fill={c.bookSage} />
          <rect x="70" y="4" width="4" height="12" fill="#fff" opacity="0.6" />
        </g>
        <path d="M196 430 C170 470 176 510 214 526 L250 520" stroke={c.kurti} strokeWidth="26" strokeLinecap="round" fill="none" />
        <circle cx="252" cy="518" r="13" fill={c.skin} />

        {/* Waving arm */}
        <g className="sc-wave">
          <path d="M326 428 C356 404 372 368 380 330" stroke={c.kurti} strokeWidth="26" strokeLinecap="round" fill="none" />
          <g transform="translate(382 306)">
            <ellipse cx="0" cy="0" rx="17" ry="20" fill={c.skin} />
            <path d="M-12 -14 v-16 M-4 -18 v-20 M5 -17 v-18 M13 -12 v-13" stroke={c.skin} strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>

        {/* Head, tilting slightly toward the pointer */}
        <motion.g style={{ rotate: headTilt, originX: 0.5, originY: 1 }}>
          {/* ears + earrings */}
          <ellipse cx="174" cy="284" rx="14" ry="18" fill={c.skinShade} />
          <ellipse cx="346" cy="284" rx="14" ry="18" fill={c.skinShade} />
          <circle cx="174" cy="306" r="5" fill={c.bookGold} />
          <circle cx="346" cy="306" r="5" fill={c.bookGold} />

          <ellipse cx="260" cy="272" rx="88" ry="94" fill={c.skin} />

          {/* Bangs and side-swept hair */}
          <path d="M170 262 C166 190 214 160 262 162 C318 162 360 196 352 266 C340 226 312 206 286 204 C292 222 280 232 266 222 C244 206 214 214 196 236 C186 248 176 258 170 262z" fill={c.hair} />
          <path d="M214 192 C232 176 262 172 284 180" stroke={c.hairLight} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
          {/* hair clip */}
          <g transform="translate(318 210) rotate(28)">
            <rect x="-14" y="-5" width="28" height="10" rx="5" fill={c.bookGold} />
            <circle cx="0" cy="0" r="3" fill="#fff" opacity="0.8" />
          </g>

          {/* Brows */}
          <path d="M206 250 q16 -9 32 -2" stroke={c.hair} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M282 248 q16 -7 32 2" stroke={c.hair} strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Eyes: blink, and pupils follow the pointer */}
          {[222, 298].map((cx) => (
            <g key={cx} className="sc-blink">
              <ellipse cx={cx} cy="284" rx="19" ry="22" fill="#fff" />
              <motion.g style={{ x: pupilX, y: pupilY }}>
                <circle cx={cx} cy="287" r="12" fill={c.eye} />
                <circle cx={cx + 4} cy="281" r="4.5" fill="#fff" />
                <circle cx={cx - 4} cy="292" r="2" fill="#fff" opacity="0.8" />
              </motion.g>
              <path d={`M${cx - 20} 276 q20 -16 40 0`} stroke={c.eye} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          ))}

          {/* Cheeks, nose, smile */}
          <ellipse cx="200" cy="322" rx="17" ry="10" fill={c.cheek} opacity="0.5" />
          <ellipse cx="320" cy="322" rx="17" ry="10" fill={c.cheek} opacity="0.5" />
          <path d="M258 300 q4 10 -2 14" stroke={c.skinShade} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M240 330 q20 20 40 0" fill={c.lips} />
          <path d="M244 331 q16 8 32 0" fill="#fff" opacity="0.85" />
        </motion.g>
      </g>
    </svg>
  );
}
