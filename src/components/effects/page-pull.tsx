"use client";

import { usePathname } from "next/navigation";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

// When someone arrives at their home page (student, teacher or alumni), a little student runs in
// from the right, dragging the new page onto the screen behind her. About 0.6s; no other page
// transitions anywhere on the site.

const HOMES = new Set(["/student", "/teacher", "/alumni"]);
const PULL_S = 0.42;
const EXIT_S = 0.22;

export function PagePull({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const pageX = useMotionValue(0);
  const runnerExtra = useMotionValue(0);
  const runnerX = useTransform(() => pageX.get() + runnerExtra.get());
  const [pulling, setPulling] = useState(false);

  // Layout effect: the page is moved off-screen before the browser paints it, so it never flashes.
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (from === pathname || !HOMES.has(pathname)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    pageX.set(window.innerWidth);
    runnerExtra.set(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must mount the runner before the first paint of the new page
    setPulling(true);
    const pull = animate(pageX, 0, { duration: PULL_S, ease: [0.22, 1, 0.36, 1] });
    let exit: ReturnType<typeof animate> | undefined;
    pull.then(() => {
      // she lets go and dashes off the left edge
      exit = animate(runnerExtra, -220, { duration: EXIT_S, ease: "easeIn" });
      exit.then(() => setPulling(false));
    });
    return () => {
      pull.stop();
      exit?.stop();
      pageX.set(0);
      setPulling(false);
    };
  }, [pathname, pageX, runnerExtra]);

  return (
    <>
      <motion.div
        style={{ x: pageX }}
        // Leave no transform behind when idle, so sticky and fixed elements behave normally.
        transformTemplate={(_, generated) => (pageX.get() === 0 ? "none" : generated)}
        className={pulling ? "relative shadow-[-24px_0_48px_-12px_rgba(22,41,74,0.35)]" : undefined}
      >
        {children}
      </motion.div>

      {pulling && (
        <motion.div
          aria-hidden
          data-page-pull
          style={{ x: runnerX }}
          className="pointer-events-none fixed bottom-[8vh] left-0 z-[100] -ml-[92px] w-[110px]"
        >
          <PullingStudent />
        </motion.div>
      )}
    </>
  );
}

/** A student running left, one arm stretched back to grip the page's edge. */
function PullingStudent() {
  return (
    <svg viewBox="0 0 110 150" className="h-auto w-full drop-shadow-[0_8px_12px_rgba(22,41,74,0.25)]">
      <style>{`
        .pp-a { animation: pp-leg 0.22s linear infinite alternate; transform-box: fill-box; transform-origin: 50% 0; }
        .pp-b { animation: pp-leg 0.22s linear infinite alternate-reverse; transform-box: fill-box; transform-origin: 50% 0; }
        .pp-arm { animation: pp-leg 0.22s linear infinite alternate-reverse; transform-box: fill-box; transform-origin: 50% 0; }
        @keyframes pp-leg { from { transform: rotate(-38deg); } to { transform: rotate(38deg); } }
      `}</style>
      <g transform="rotate(-12 55 90)">
        {/* back leg, backpack */}
        <line className="pp-b" x1="50" y1="98" x2="50" y2="138" stroke="#56657f" strokeWidth="9" strokeLinecap="round" />
        <rect x="58" y="58" width="15" height="34" rx="6" fill="#efc75e" />
        {/* front leg */}
        <line className="pp-a" x1="50" y1="98" x2="50" y2="138" stroke="#6b7c99" strokeWidth="9" strokeLinecap="round" />
        {/* body */}
        <rect x="36" y="54" width="30" height="48" rx="13" fill="#9cc7ec" />
        {/* swinging front arm */}
        <line className="pp-arm" x1="42" y1="62" x2="42" y2="88" stroke="#86b6de" strokeWidth="8" strokeLinecap="round" />
        {/* head facing left, hair flying back */}
        <path d="M60 30 q18 -2 26 10 q-10 -2 -16 2z" fill="#3a3350" />
        <circle cx="48" cy="38" r="14" fill="#d9a27e" />
        <path d="M34 36 a14 14 0 0 1 28 -4 q-10 -1 -15 -7 q-5 6 -13 11z" fill="#3a3350" />
        <circle cx="41" cy="38" r="1.8" fill="#3a3350" />
        <path d="M38 45 q3 2 6 0" stroke="#3a3350" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      {/* back arm reaching to the page edge (right side of the figure) */}
      <line x1="66" y1="68" x2="100" y2="62" stroke="#9cc7ec" strokeWidth="8" strokeLinecap="round" />
      <circle cx="102" cy="62" r="5.5" fill="#d9a27e" />
      {/* speed lines trailing behind her feet */}
      <g stroke="var(--color-ulab-light)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <line x1="72" y1="118" x2="92" y2="118" />
        <line x1="68" y1="132" x2="96" y2="132" />
      </g>
    </svg>
  );
}
