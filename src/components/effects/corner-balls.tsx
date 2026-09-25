"use client";

import { useEffect, useRef } from "react";

// Playful balls resting in the bottom-left and bottom-right corners of every page.
// Tap one and it flies in an arc to the other side; the pointer nudges them as it passes.
// Simple physics: gravity, bounces off walls and floor, and collisions between balls.

const palette = [
  ["#8cc4ee", "#2f7fca"],
  ["#ffe08a", "#e0a524"],
  ["#a8e0c3", "#3f9a6f"],
  ["#d3c9ff", "#7563d6"],
  ["#ffc2cf", "#e0708a"],
  ["#bfe7f7", "#3c9cc4"],
];

type Ball = { el: HTMLDivElement; x: number; y: number; vx: number; vy: number; r: number; squash: number; ghost: number };

export function CornerBalls() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = layer.current;
    if (!root) return;
    const small = window.innerWidth < 768;
    const perSide = small ? 1 : 3;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = () => window.innerWidth;
    // Keep clear of the dashboard sidebar (its account card and log-out button sit bottom-left).
    const leftWall = () => {
      const side = document.querySelector<HTMLElement>("[data-sidebar]");
      // width, not position: the sidebar slides during the page-pull animation
      return side && side.offsetParent ? side.offsetWidth : 0;
    };
    // Stay above the mobile bottom navigation bar when it is showing.
    const floor = () => {
      const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
      const navTop = nav && nav.offsetParent ? nav.getBoundingClientRect().top - 8 : window.innerHeight - 10;
      return Math.min(window.innerHeight - 10, navTop);
    };

    const balls: Ball[] = [];
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < perSide; i++) {
        const r = small ? 15 : 18 + ((i * 7 + side * 5) % 10);
        const [light, deep] = palette[(side * 3 + i) % palette.length];
        const el = document.createElement("div");
        el.setAttribute("aria-hidden", "true");
        el.className = "pointer-events-auto absolute left-0 top-0 cursor-pointer select-none rounded-full will-change-transform";
        el.style.width = el.style.height = `${r * 2}px`;
        el.style.background = `radial-gradient(circle at 32% 28%, #ffffff 0 8%, ${light} 22%, ${deep} 78%)`;
        el.style.boxShadow = `inset -${r * 0.25}px -${r * 0.3}px ${r * 0.6}px rgba(0,0,0,0.18), 0 ${r * 0.5}px ${r}px -${r * 0.3}px rgba(22,41,74,0.35)`;
        root.appendChild(el);
        const x = side === 0 ? leftWall() + 24 + r + i * (r * 2 + 6) : W() - 24 - r - i * (r * 2 + 6);
        const ball: Ball = { el, x, y: floor() - r - i * 4, vx: 0, vy: 0, r, squash: 0, ghost: 0 };
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // launch toward the far side, with some variety
          const dir = ball.x < (leftWall() + W()) / 2 ? 1 : -1;
          // aim to land near the far corner: flight time for vy under gravity G is 2·vy/G frames
          const vy = 17 + Math.random() * 3;
          const frames = (2 * vy) / 0.55;
          const target = dir > 0 ? W() - 60 - Math.random() * 80 : leftWall() + 60 + Math.random() * 80;
          ball.vy = -vy;
          ball.vx = (target - ball.x) / frames;
          ball.squash = 0.35;
          ball.ghost = 40; // pass over its neighbours instead of bumping into them
        });
        balls.push(ball);
      }
    }

    const pointer = { x: -999, y: -999 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove);

    const G = 0.55;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      const k = Math.min((now - last) / 16.67, 2); // normalise to 60fps
      last = now;
      const fl = floor();
      const w = W();
      const lw = leftWall();

      for (const b of balls) {
        if (!reduce) {
          // pointer gently pushes balls away
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < b.r + 40 && d > 0.1) {
            const f = ((b.r + 40 - d) / (b.r + 40)) * 0.9;
            b.vx += (dx / d) * f;
            b.vy += (dy / d) * f * 0.5;
          }
        }
        b.vy += G * k;
        b.x += b.vx * k;
        b.y += b.vy * k;
        if (b.ghost > 0) b.ghost -= k;
        else b.vx *= 0.995;

        if (b.y + b.r > fl) {
          b.y = fl - b.r;
          if (Math.abs(b.vy) > 2) b.squash = Math.min(0.3, Math.abs(b.vy) / 40);
          b.vy *= -0.55;
          b.vx *= 0.9; // rolling friction
          if (Math.abs(b.vy) < 1) b.vy = 0;
        }
        if (b.x - b.r < lw) { b.x = lw + b.r; b.vx = Math.abs(b.vx) * 0.7; }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * 0.7; }
      }

      // ball-to-ball collisions (mass ~ area)
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], c = balls[j];
          if (a.ghost > 0 || c.ghost > 0) continue;
          const dx = c.x - a.x, dy = c.y - a.y;
          const dist = Math.hypot(dx, dy);
          const min = a.r + c.r;
          if (dist > 0 && dist < min) {
            const nx = dx / dist, ny = dy / dist;
            const overlap = (min - dist) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap;
            c.x += nx * overlap; c.y += ny * overlap;
            const ma = a.r * a.r, mc = c.r * c.r;
            const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
            if (rel < 0) {
              const impulse = (-(1 + 0.6) * rel) / (1 / ma + 1 / mc);
              a.vx -= (impulse / ma) * nx; a.vy -= (impulse / ma) * ny;
              c.vx += (impulse / mc) * nx; c.vy += (impulse / mc) * ny;
            }
          }
        }
      }

      for (const b of balls) {
        b.squash *= 0.85;
        const sx = 1 + b.squash, sy = 1 - b.squash;
        // no rotation: the highlight stays put, like light on a real ball
        b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) scale(${sx}, ${sy})`;
      }
    };
    frame = requestAnimationFrame(step);

    const onResize = () => {
      for (const b of balls) b.x = Math.min(b.x, W() - b.r);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      balls.forEach((b) => b.el.remove());
    };
  }, []);

  return <div ref={layer} className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" />;
}
