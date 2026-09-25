"use client";

import { AnimatePresence, motion } from "motion/react";
import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const DISMISSED = "setu-install-dismissed";

/**
 * Registers the service worker and, on phones, offers to install Setu as an app:
 * a one-tap button on Android/Chrome, or Share → Add to Home Screen steps on iPhone.
 */
export function Pwa() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [open, setOpen] = useState(false);
  const [aboveNav, setAboveNav] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {}
    if (standalone || dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault(); // show our own, calmer prompt instead of the browser's
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const t = setTimeout(() => {
      if (isIos) setShowIos(true);
      // sit above the dashboard's bottom menu when there is one, otherwise at the very bottom
      setAboveNav(!!document.querySelector("[data-bottom-nav]"));
      if (phone) setOpen(true);
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    dismiss();
  };

  const visible = open && (installEvent || showIos);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Install Setu"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-3 z-[60] rounded-2xl border border-mist bg-surface p-4 shadow-lift"
          style={{ bottom: `calc(env(safe-area-inset-bottom) + ${aboveNav ? 92 : 12}px)` }}
        >
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
            <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Install Setu on your phone</p>
              {installEvent ? (
                <p className="mt-0.5 text-sm text-ink-soft">Open it from your home screen like any other app.</p>
              ) : (
                <p className="mt-0.5 text-sm text-ink-soft">
                  Tap <Share size={14} className="inline -translate-y-0.5" /> Share, then <b>Add to Home Screen</b>.
                </p>
              )}
              {installEvent && (
                <button onClick={install} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ulab px-4 py-2 text-sm font-semibold text-white">
                  <Download size={15} /> Install app
                </button>
              )}
            </div>
            <button onClick={dismiss} aria-label="Not now" className="rounded-lg p-1.5 text-ink-soft hover:bg-sky">
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
