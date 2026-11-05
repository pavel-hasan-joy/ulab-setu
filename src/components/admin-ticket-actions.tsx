"use client";

import { useState } from "react";
import { updateSupportTicket } from "@/app/actions/admin";

export function AdminTicketActions({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [status, setStatus] = useState<"IN_PROGRESS" | "RESOLVED" | "CLOSED">("RESOLVED");
  const [resolution, setResolution] = useState("");

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSupportTicket(ticketId, { status, resolution });
      setOpenModal(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className="rounded-lg bg-ulab/10 px-2.5 py-1 text-xs font-semibold text-ulab transition hover:bg-ulab/20"
      >
        Update Status
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-mist bg-surface p-5 shadow-lift dark:border-white/10 dark:bg-[#0f172a]">
            <h3 className="font-display font-bold text-ink text-sm">Update Support Ticket</h3>
            <p className="mt-1 text-xs text-ink-soft">Change status and add resolution remarks.</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-ink-soft">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-soft">Resolution Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain resolution details..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

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
                onClick={handleUpdate}
                className="rounded-xl bg-ulab px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ulab-deep disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

