"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { useTheme } from "../theme";

/**
 * Site-wide sky: a field of stars that drift on their own and scatter slightly with scroll
 * (nearer stars move more), shooting stars at night, and a sun or moon in the corner
 * depending on the theme.
 */
export function SkyLayer() {
  const theme = useTheme();
  return (
    <>
      <Stars dark={theme === "dark"} />
      <Celestial dark={theme === "dark"} />
    </>
  );
}

type Star = { x: number; y: number; z: number; r: number; vx: number; vy: number; phase: number; speed: number; hue: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

function Stars({ dark }: { dark: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(dark);
  useEffect(() => {
    darkRef.current = dark;
  }, [dark]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];

    const make = (): Star => {
      const z = Math.random() ** 1.6; // most stars far away, a few close
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z,
        r: 0.5 + z * 1.9,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.8,
        hue: Math.random(),
      };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W * dpr;
      el.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(160, (W * H) / 11000));
      stars = Array.from({ length: count }, make);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastScroll = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      if (reduce) return;
      for (const s of stars) {
        // parallax: near stars slide further than far ones
        s.y -= dy * (0.08 + s.z * 0.45);
        // and each gets a small random nudge, so they scatter instead of moving as one sheet
        const kick = Math.min(Math.abs(dy), 60) * 0.004 * (0.3 + s.z);
        s.vx += (Math.random() - 0.5) * kick;
        s.vy += (Math.random() - 0.5) * kick;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let frame = 0;
    let t = 0;
    let nextMeteor = 3 + Math.random() * 5;
    let last = performance.now();
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const isDark = darkRef.current;
      ctx.clearRect(0, 0, W, H);

      for (const s of stars) {
        if (!reduce) {
          // slow Brownian wander with friction
          s.vx += (Math.random() - 0.5) * 0.004;
          s.vy += (Math.random() - 0.5) * 0.004;
          s.vx *= 0.985;
          s.vy *= 0.985;
          s.x += s.vx;
          s.y += s.vy;
        }
        // wrap around the edges
        if (s.y < -10) { s.y = H + 10; s.x = Math.random() * W; }
        if (s.y > H + 10) { s.y = -10; s.x = Math.random() * W; }
        if (s.x < -10) s.x = W + 10;
        if (s.x > W + 10) s.x = -10;

        const twinkle = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        if (isDark) {
          const a = (0.35 + s.z * 0.65) * twinkle;
          const color = s.hue < 0.7 ? `rgba(235,242,255,${a})` : s.hue < 0.9 ? `rgba(180,210,255,${a})` : `rgba(255,226,160,${a})`;
          if (s.r > 1.6) {
            // bright stars get a soft glow and a faint cross flare
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
            g.addColorStop(0, color);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(235,242,255,${a * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(s.x - s.r * 4, s.y); ctx.lineTo(s.x + s.r * 4, s.y);
            ctx.moveTo(s.x, s.y - s.r * 4); ctx.lineTo(s.x, s.y + s.r * 4);
            ctx.stroke();
          }
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // daytime: small blue and gold sparkles, softer
          const a = (0.18 + s.z * 0.4) * twinkle;
          ctx.fillStyle = s.hue < 0.55 ? `rgba(90,169,222,${a})` : `rgba(233,185,58,${a})`;
          const k = s.r * 2.2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - k);
          ctx.quadraticCurveTo(s.x, s.y, s.x + k, s.y);
          ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + k);
          ctx.quadraticCurveTo(s.x, s.y, s.x - k, s.y);
          ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - k);
          ctx.fill();
        }
      }

      // shooting stars, night only
      if (isDark && !reduce) {
        nextMeteor -= dt;
        if (nextMeteor <= 0) {
          nextMeteor = 6 + Math.random() * 9;
          const speed = 700 + Math.random() * 400;
          const angle = Math.PI * (0.15 + Math.random() * 0.12);
          meteors.push({ x: W * (0.3 + Math.random() * 0.7), y: Math.random() * H * 0.4, vx: -Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 });
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt * 0.9;
          if (m.life <= 0) { meteors.splice(i, 1); continue; }
          const tail = 0.12;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
          g.addColorStop(0, `rgba(255,255,255,${m.life})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
          ctx.stroke();
        }
      }
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-30 h-full w-full" />;
}

/** Sun by day, moon by night. Sinks slowly as you scroll; swaps with a set/rise when the theme changes. */
function Celestial({ dark }: { dark: boolean }) {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const y = useTransform(smooth, [0, 1], [0, 140]);
  const x = useTransform(smooth, [0, 1], [0, -60]);

  return (
    <motion.div style={{ x, y }} className="pointer-events-none fixed right-3 top-20 z-30 size-10 md:right-5 md:top-24 md:size-12" aria-hidden>
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.div
            key="moon"
            initial={{ y: 80, opacity: 0, rotate: -30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 14 }}
            className="relative size-full"
          >
            <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(220,230,255,0.35),transparent_65%)]" />
            <svg viewBox="0 0 64 64" className="relative size-full drop-shadow-[0_0_14px_rgba(220,230,255,0.6)]">
              <defs>
                <mask id="crescent">
                  <rect width="64" height="64" fill="white" />
                  <circle cx="44" cy="22" r="24" fill="black" />
                </mask>
              </defs>
              <g mask="url(#crescent)">
                <circle cx="32" cy="32" r="28" fill="#f4f1dc" />
                <circle cx="20" cy="36" r="4" fill="#e2ddbf" />
                <circle cx="14" cy="24" r="2.5" fill="#e2ddbf" />
                <circle cx="26" cy="50" r="3" fill="#e2ddbf" />
              </g>
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 80, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 14 }}
            className="relative size-full"
          >
            <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(255,214,102,0.45),transparent_65%)]" />
            <svg viewBox="0 0 64 64" className="relative size-full animate-[spin_40s_linear_infinite]">
              {Array.from({ length: 12 }).map((_, i) => (
                <rect key={i} x="30.5" y="1" width="3" height="10" rx="1.5" fill="#f5b73b" transform={`rotate(${i * 30} 32 32)`} />
              ))}
              <circle cx="32" cy="32" r="17" fill="#ffd66b" />
              <circle cx="32" cy="32" r="17" fill="url(#sunshine)" />
              <defs>
                <radialGradient id="sunshine" cx="0.35" cy="0.35" r="0.8">
                  <stop offset="0" stopColor="#fff6d2" />
                  <stop offset="1" stopColor="#ffc83d" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
