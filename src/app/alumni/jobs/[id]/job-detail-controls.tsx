"use client";

import { useTransition } from "react";
import { Sparkles, PauseCircle, PlayCircle, XCircle, Trash2, CheckCircle2 } from "lucide-react";
import { setJobStatus, toggleJobReferral, deleteJob } from "@/app/actions/jobs";
import type { JobStatus } from "@/lib/jobs";

export function JobDetailControls({
  jobId,
  currentStatus,
  currentReferral,
}: {
  jobId: string;
  currentStatus: JobStatus;
  currentReferral: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (status: JobStatus) => {
    startTransition(async () => {
      try {
        await setJobStatus(jobId, status);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const handleReferral = () => {
    startTransition(async () => {
      try {
        await toggleJobReferral(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to toggle referral");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to remove this job posting?")) return;
    startTransition(async () => {
      try {
        await deleteJob(jobId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink-soft">Quick Controls:</span>

        {/* Referral Toggle */}
        <button
          type="button"
          onClick={handleReferral}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            currentReferral
              ? "bg-gold-wash text-gold-ink border border-gold/40 hover:bg-gold-wash/80"
              : "bg-surface text-ink-soft border border-mist hover:text-ink"
          }`}
        >
          <Sparkles size={13} className={currentReferral ? "text-gold" : "text-ink-soft"} />
          {currentReferral ? "Referral Active" : "Offer Referral"}
        </button>

        {/* Status Actions */}
        {currentStatus === "PUBLISHED" && (
          <button
            type="button"
            onClick={() => handleStatus("PAUSED")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 font-medium text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <PauseCircle size={13} /> Pause Applications
          </button>
        )}

        {currentStatus === "PAUSED" && (
          <button
            type="button"
            onClick={() => handleStatus("PUBLISHED")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          >
            <PlayCircle size={13} /> Resume Applications
          </button>
        )}

        {currentStatus === "DRAFT" && (
          <button
            type="button"
            onClick={() => handleStatus("PUBLISHED")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-medium text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={13} /> Publish Job
          </button>
        )}

        {currentStatus !== "CLOSED" && (
          <button
            type="button"
            onClick={() => handleStatus("CLOSED")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 font-medium text-ink-soft hover:bg-mist hover:text-ink"
          >
            <XCircle size={13} /> Close Posting
          </button>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </div>
  );
}

