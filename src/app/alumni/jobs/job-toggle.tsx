"use client";

import { motion } from "motion/react";
import { useOptimistic, useTransition } from "react";
import { toggleJob } from "@/app/actions/jobs";

export function JobToggle({ jobId, active }: { jobId: string; active: boolean }) {
  const [on, setOn] = useOptimistic(active);
  const [, start] = useTransition();
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => start(async () => { setOn(!on); await toggleJob(jobId); })}
      className="flex items-center gap-2 text-sm text-ink-soft"
    >
      <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${on ? "justify-end bg-sage" : "justify-start bg-mist"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className="size-5 rounded-full bg-white shadow-soft" />
      </span>
      {on ? "Open" : "Closed"}
    </button>
  );
}
