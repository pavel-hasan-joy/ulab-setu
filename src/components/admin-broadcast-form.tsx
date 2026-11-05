"use client";

import { useState } from "react";
import { dispatchSystemNotification } from "@/app/actions/admin";
import { Send, CheckCircle2 } from "lucide-react";

export function AdminBroadcastForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState<"ALL" | "STUDENT" | "ALUMNI" | "TEACHER">("ALL");
  const [link, setLink] = useState("");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    try {
      await dispatchSystemNotification(title, body, targetRole, link);
      setSent(true);
      setTitle("");
      setBody("");
      setLink("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to broadcast notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBroadcast} className="space-y-4">
      {sent && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 size={16} /> Notification dispatched successfully to all recipients!
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-ink">Notification Title</label>
        <input
          type="text"
          required
          placeholder="e.g. ULAB Job Fair 2026 Registration Open"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ink">Notification Body</label>
        <textarea
          rows={3}
          required
          placeholder="Detailed message text..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-ink">Target Audience</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as any)}
            className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          >
            <option value="ALL">Entire Campus (All Users)</option>
            <option value="STUDENT">Students Only</option>
            <option value="ALUMNI">Alumni Only</option>
            <option value="TEACHER">Faculty Only</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Action URL / Link (Optional)</label>
          <input
            type="text"
            placeholder="e.g. /student/jobs or https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-2.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-ulab px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep disabled:opacity-50"
      >
        <Send size={14} /> {loading ? "Dispatching..." : "Send Broadcast"}
      </button>
    </form>
  );
}
