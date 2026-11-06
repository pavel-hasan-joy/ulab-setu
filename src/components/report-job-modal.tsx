"use client";

import { useState, useTransition } from "react";
import { Flag, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { reportJob } from "@/app/actions/jobs";

export function ReportJobModal({
  jobId,
  jobTitle,
  company,
}: {
  jobId: string;
  jobTitle: string;
  company: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await reportJob(jobId, reason, details);
        if (res.error) {
          setError(res.error);
        } else {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            setIsOpen(false);
            setDetails("");
          }, 2000);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to submit report");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-rose-600 transition"
      >
        <Flag size={13} /> Report this posting
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-ink-soft hover:bg-mist hover:text-ink transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-bold text-ink">Report Job Posting</h3>
            </div>

            <p className="mt-1 text-xs text-ink-soft">
              Help keep the ULAB community safe. If this posting ({jobTitle} at {company}) violates platform guidelines, submit a report for administrative review.
            </p>

            {isSuccess ? (
              <div className="my-6 flex flex-col items-center justify-center gap-2 text-center text-emerald-600">
                <CheckCircle2 size={36} />
                <p className="text-sm font-semibold">Thank you for reporting.</p>
                <p className="text-xs text-ink-soft">Our moderation team will investigate this posting promptly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Reason for report
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink focus:border-ulab focus:outline-none"
                  >
                    <option value="SPAM">Spam, advertisement, or duplicate posting</option>
                    <option value="FRAUD">Fraudulent, asking for money, or suspicious company</option>
                    <option value="INAPPROPRIATE">Inappropriate language, offensive, or discriminatory</option>
                    <option value="FAKE_IDENTITY">Fake identity or misrepresenting ULAB affiliation</option>
                    <option value="EXPIRED_INVALID">Invalid contact info or misleading requirements</option>
                    <option value="OTHER">Other issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Additional details (Optional)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    placeholder="Provide any context or links to help administrators investigate..."
                    className="w-full rounded-xl border border-mist bg-surface p-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-mist px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-mist transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60"
                  >
                    {isPending ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

