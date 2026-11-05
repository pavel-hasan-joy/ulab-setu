"use client";

import { useState } from "react";
import { resolveUserReport } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";

export function AdminReportActions({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [actionType, setActionType] = useState<"INVESTIGATING" | "RESOLVED" | "DISMISSED">("RESOLVED");

  const handleResolve = async () => {
    setLoading(true);
    try {
      await resolveUserReport(reportId, actionType, notes);
      setOpenModal(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to resolve report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActionType("RESOLVED");
            setOpenModal(true);
          }}
          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Resolve
        </button>
        <button
          type="button"
          onClick={() => {
            setActionType("DISMISSED");
            setOpenModal(true);
          }}
          className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:bg-mist/40 dark:bg-white/5"
        >
          Dismiss
        </button>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-mist bg-surface p-5 shadow-lift dark:border-white/10 dark:bg-[#0f172a]">
            <h3 className="font-display font-bold text-ink text-sm">
              Mark Report as {actionType}
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Add internal moderation notes explaining the action taken.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. User warned, content removed, or report unfounded."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-3 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleResolve}
                className="rounded-xl bg-ulab px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ulab-deep disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

