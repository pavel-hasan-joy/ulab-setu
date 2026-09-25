"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useActionState } from "react";
import { applyToJob } from "@/app/actions/jobs";
import { Button, Card, FormError, Textarea } from "@/components/ui";

const statusText: Record<string, string> = {
  APPLIED: "Your application was sent. You'll see updates in Applications.",
  SHORTLISTED: "Good news: you've been shortlisted. Expect a message soon.",
  REJECTED: "This one didn't work out. Keep going, there are more jobs waiting.",
};

export function ApplyPanel({ jobId, open, applied }: { jobId: string; open: boolean; applied: string | null }) {
  const [state, action, pending] = useActionState(applyToJob, undefined);
  const done = applied || (state && !state.error);

  return (
    <Card className="overflow-hidden p-5">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <svg viewBox="0 0 52 52" className="mx-auto size-14">
              <motion.circle cx="26" cy="26" r="24" fill="var(--color-sage-wash)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} style={{ transformOrigin: "center" }} />
              <motion.path d="M15 27 l7 7 l15 -16" fill="none" stroke="var(--color-sage)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.45 }} />
            </svg>
            <p className="mt-3 font-semibold">{applied === "SHORTLISTED" ? "Shortlisted" : applied === "REJECTED" ? "Not selected" : "Applied"}</p>
            <p className="mt-1 text-sm text-ink-soft">{statusText[applied ?? "APPLIED"]}</p>
            <Link href="/student/applications" className="mt-4 inline-block text-sm font-semibold text-ulab hover:underline">View my applications</Link>
          </motion.div>
        ) : !open ? (
          <motion.p key="closed" className="text-sm text-ink-soft">This job is no longer taking applications.</motion.p>
        ) : (
          <motion.form key="form" action={action} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <input type="hidden" name="jobId" value={jobId} />
            <p className="font-semibold">Apply with your profile</p>
            <p className="text-sm text-ink-soft">The alumnus will see your profile, skills and this note.</p>
            <Textarea name="note" rows={4} placeholder="Why are you a good fit? Two or three sentences is plenty." maxLength={800} />
            <FormError message={state?.error} />
            {state?.error?.includes("profile") && (
              <Link href="/student/profile" className="block text-sm font-semibold text-ulab hover:underline">Complete profile</Link>
            )}
            <Button className="w-full py-3" disabled={pending}>{pending ? "Sending…" : "Send application"}</Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
