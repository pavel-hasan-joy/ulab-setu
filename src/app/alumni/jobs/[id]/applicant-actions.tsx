"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  MessageSquare,
  FileEdit,
  Eye,
  RotateCcw,
} from "lucide-react";
import { setApplicationStatus, updateApplicationHiringNotes } from "@/app/actions/jobs";
import { Badge, Button } from "@/components/ui";
import { APPLICATION_STATUS_CONFIG, type ApplicationStatus } from "@/lib/applications";

export function ApplicantActions({
  applicationId,
  status,
  initialNotes = "",
}: {
  applicationId: string;
  status: string;
  initialNotes?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  const setStatus = (s: "APPLIED" | "VIEWED" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED") => {
    startTransition(async () => {
      try {
        await setApplicationStatus(applicationId, s);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateApplicationHiringNotes(applicationId, notes);
        setNotesSaved(true);
        setTimeout(() => {
          setNotesSaved(false);
          setShowNotesModal(false);
        }, 1200);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to save hiring notes");
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Private Notes button */}
        <button
          type="button"
          onClick={() => setShowNotesModal(true)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            notes
              ? "border-gold bg-gold-wash/80 text-gold-ink font-semibold"
              : "border-mist bg-surface text-ink-soft hover:bg-mist hover:text-ink"
          }`}
          title="Private notes visible only to you and admins"
        >
          <FileEdit size={13} /> {notes ? "Hiring Notes (Saved)" : "Add Notes"}
        </button>

        {/* Dynamic Status Action Controls */}
        {status !== "SHORTLISTED" && status !== "INTERVIEW" && status !== "SELECTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("SHORTLISTED")}
            className="inline-flex items-center gap-1 rounded-lg bg-gold/90 px-3 py-1.5 text-xs font-semibold text-gold-ink hover:bg-gold transition shadow-xs"
          >
            <Sparkles size={13} /> Shortlist
          </button>
        )}

        {status === "SHORTLISTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("INTERVIEW")}
            className="inline-flex items-center gap-1 rounded-lg bg-ulab px-3 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep transition shadow-xs"
          >
            <Calendar size={13} /> Invite to Interview
          </button>
        )}

        {(status === "SHORTLISTED" || status === "INTERVIEW") && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("SELECTED")}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <CheckCircle2 size={13} /> Select Candidate
          </button>
        )}

        {status !== "REJECTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("REJECTED")}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <XCircle size={13} /> Not a fit
          </button>
        )}

        {status !== "APPLIED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStatus("APPLIED")}
            className="inline-flex items-center gap-1 rounded-lg border border-mist bg-surface px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-mist transition"
            title="Reset status back to initial application"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Private Hiring Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <FileEdit size={18} className="text-ulab" />
              Private Hiring Notes
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              These notes are strictly private to you (and authorized university administrators). The student cannot see them.
            </p>

            <form onSubmit={handleSaveNotes} className="mt-4 space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Write interview feedback, technical ratings, or questions for next rounds..."
                className="w-full rounded-xl border border-mist bg-surface p-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
              />

              <div className="flex items-center justify-between">
                {notesSaved && (
                  <span className="text-xs font-semibold text-emerald-600">✓ Notes saved securely!</span>
                )}
                {!notesSaved && <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className="rounded-xl border border-mist px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-ulab px-4 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep disabled:opacity-60"
                  >
                    {pending ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
