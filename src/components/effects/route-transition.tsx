"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

// Full-screen page transition. Clicking an internal link sweeps three curtains up over the page
// with the logo and a loader; when the new route has rendered, the curtains carry on up and away.
// The first visit of a session opens with the same reveal.

type Phase = "idle" | "cover" | "reveal";
const MIN_COVER_MS = 750;
const SAFETY_MS = 8000;
const panels = ["bg-ulab", "bg-gold", "bg-paper"];
const ease = [0.76, 0, 0.24, 1] as const;

export function RouteTransition() {
  // Only path changes get the curtain; tab and filter changes (query string) stay instant.
  const route = usePathname();
  const [phase, setPhase] = useState<Phase>("cover"); // start covered: first-visit splash
  const [firstMount, setFirstMount] = useState(true);
  const coveredAt = useRef(0);
  const lastRoute = useRef(route);

  // First load: reveal once hydrated (short if this session has already seen the splash).
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("setu-splash") === "1";
      sessionStorage.setItem("setu-splash", "1");
    } catch {}
    const t = setTimeout(() => setPhase("reveal"), seen ? 150 : 1300);
    return () => clearTimeout(t);
  }, []);

  // Start covering when an internal link is clicked.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      coveredAt.current = performance.now();
      setPhase("cover");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Reveal once the new route is on screen (and the curtain has been up long enough to register).
  useEffect(() => {
    if (route === lastRoute.current) return;
    lastRoute.current = route;
    if (phase !== "cover") return;
    const wait = Math.max(0, MIN_COVER_MS - (performance.now() - coveredAt.current));
    const t = setTimeout(() => setPhase("reveal"), wait);
    return () => clearTimeout(t);
  }, [route, phase]);

  // Never leave the curtain stuck if navigation fails.
  useEffect(() => {
    if (phase !== "cover") return;
    const t = setTimeout(() => setPhase("reveal"), SAFETY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <AnimatePresence onExitComplete={() => { setPhase("idle"); setFirstMount(false); }}>
      {phase === "cover" && (
        <motion.div key="curtain" className="fixed inset-0 z-[100] animate-[curtain-failsafe_0s_linear_6s_forwards]" aria-live="polite" aria-busy="true">
          {panels.map((bg, i) => (
            <motion.div
              key={bg}
              className={`absolute inset-0 ${bg}`}
              // The first-visit splash is already covering the page in the server HTML.
              initial={firstMount ? false : { y: "105%", borderTopLeftRadius: "50% 20%", borderTopRightRadius: "50% 20%" }}
              animate={{ y: "0%", borderTopLeftRadius: "0% 0%", borderTopRightRadius: "0% 0%", transition: { duration: 0.7, delay: i * 0.09, ease } }}
              exit={{ y: "-105%", borderBottomLeftRadius: "50% 20%", borderBottomRightRadius: "50% 20%", transition: { duration: 0.8, delay: (panels.length - 1 - i) * 0.08, ease } }}
            />
          ))}

          <motion.div
            className="absolute inset-0 grid place-items-center"
            initial={firstMount ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.35, duration: 0.3 } }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.3 } }}
          >
            <div className="flex flex-col items-center">
              <div className="relative grid size-36 place-items-center">
                {/* orbiting rings */}
                <motion.span className="absolute inset-0 rounded-full border-2 border-ulab/20 border-t-ulab" animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
                <motion.span className="absolute inset-3 rounded-full border-2 border-gold/20 border-b-gold" animate={{ rotate: -360 }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} />
                <motion.span className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}>
                  <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_12px_rgba(233,185,58,0.9)]" />
                </motion.span>
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.4 }}>
                  <Image src={site.logo} alt="" width={84} height={30} className="h-8 w-auto dark:hidden" />
                  <Image src={site.logoDark} alt="" width={84} height={30} className="hidden h-8 w-auto dark:block" />
                </motion.div>
              </div>
              <motion.p
                className="mt-6 font-display text-3xl font-semibold text-ink"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Setu
              </motion.p>
              <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-mist">
                <motion.span
                  className="block h-full rounded-full bg-gradient-to-r from-ulab via-ulab-light to-gold"
                  initial={{ x: "-100%" }}
                  animate={{ x: ["-100%", "0%", "100%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <p className="mt-3 text-sm text-ink-soft">Loading your page…</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
