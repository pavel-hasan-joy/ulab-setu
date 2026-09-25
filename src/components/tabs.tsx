"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "./ui";

export function Tabs({ tabs, active }: { tabs: { id: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-mist/80 bg-surface p-1.5 shadow-soft">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          scroll={false}
          className={cn("relative flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors", active === t.id ? "text-ulab-deep" : "text-ink-soft hover:text-ink")}
        >
          {active === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-sky" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative">{t.label}</span>
          {t.count !== undefined && <span className="relative ml-1.5 text-xs font-medium opacity-70">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
