"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Search,
  ExternalLink,
  Play,
  XCircle,
  CheckCircle,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  scheduleCmsContent,
  cancelCmsSchedule,
  publishCmsContentNow,
  runSchedulerManually,
} from "@/app/actions/cms";
import { CMS_STATUS_META, CMS_CONTENT_TYPE_META, type CmsContentStatus, type CmsContentType } from "@/lib/cms-types";

interface ScheduledItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; email: string };
  lastEditedBy?: { id: string; name: string; email: string } | null;
  publishedBy?: { id: string; name: string; email: string } | null;
}

interface CmsScheduledClientProps {
  initialItems: ScheduledItem[];
  currentRole: string;
}

export function CmsScheduledClient({ initialItems, currentRole }: CmsScheduledClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<ScheduledItem[]>(initialItems);
  const [tab, setTab] = useState<"SCHEDULED" | "APPROVED">("SCHEDULED");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Scheduling Modal State
  const [schedulingItem, setSchedulingItem] = useState<ScheduledItem | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  const filteredItems = items.filter((item) => {
    if (tab === "SCHEDULED" && item.status !== "SCHEDULED") return false;
    if (tab === "APPROVED" && item.status !== "APPROVED") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const canPublish = currentRole === "CMS_ADMIN" || currentRole === "PUBLISHER";

  const handleScheduleSubmit = () => {
    if (!schedulingItem || !scheduleDateTime) return;

    startTransition(async () => {
      setMessage(null);
      const res = await scheduleCmsContent({
        contentId: schedulingItem.id,
        scheduledAt: new Date(scheduleDateTime).toISOString(),
      });

      if (!res.success) {
        setMessage({ text: res.error || "Failed to schedule publication.", error: true });
      } else {
        setMessage({ text: res.message || "Scheduled successfully." });
        setItems((prev) =>
          prev.map((it) =>
            it.id === schedulingItem.id
              ? {
                  ...it,
                  status: "SCHEDULED",
                  scheduledAt: new Date(scheduleDateTime),
                }
              : it
          )
        );
        setSchedulingItem(null);
        setScheduleDateTime("");
        router.refresh();
      }
    });
  };

  const handleCancelSchedule = (contentId: string) => {
    startTransition(async () => {
      setMessage(null);
      const res = await cancelCmsSchedule(contentId);
      if (!res.success) {
        setMessage({ text: res.error || "Failed to cancel schedule.", error: true });
      } else {
        setMessage({ text: res.message || "Schedule cancelled." });
        setItems((prev) =>
          prev.map((it) => (it.id === contentId ? { ...it, status: "APPROVED", scheduledAt: null } : it))
        );
        router.refresh();
      }
    });
  };

  const handlePublishNow = (contentId: string) => {
    startTransition(async () => {
      setMessage(null);
      const res = await publishCmsContentNow(contentId);
      if (!res.success) {
        setMessage({ text: res.error || "Failed to publish.", error: true });
      } else {
        setMessage({ text: res.message || "Content published live!" });
        setItems((prev) => prev.filter((it) => it.id !== contentId));
        router.refresh();
      }
    });
  };

  const handleRunScheduler = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await runSchedulerManually();
      if (!res.success) {
        setMessage({ text: res.error || "Scheduler run failed.", error: true });
      } else {
        setMessage({ text: res.message || "Scheduler run completed successfully." });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-mist/80 bg-surface/80 p-6 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/40 text-ulab shadow-xs">
                <Clock size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Scheduled Content Calendar
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Manage timed releases, embargo dates, and automated publishing pipelines (Asia/Dhaka UTC+6).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPublish && (
              <button
                type="button"
                onClick={handleRunScheduler}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
              >
                <RefreshCw size={13} className={isPending ? "animate-spin" : ""} /> Run Scheduler Now
              </button>
            )}
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mist/60 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("SCHEDULED")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "SCHEDULED"
                  ? "bg-ink text-paper shadow-xs"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              Scheduled Queue ({items.filter((i) => i.status === "SCHEDULED").length})
            </button>
            <button
              onClick={() => setTab("APPROVED")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "APPROVED"
                  ? "bg-ink text-paper shadow-xs"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              Approved (Ready to Schedule) ({items.filter((i) => i.status === "APPROVED").length})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheduled items..."
              className="w-full rounded-lg border border-mist bg-paper py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-medium ${
            message.error
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-sage-200 bg-sage-50 text-sage-800 dark:border-sage-900/60 dark:bg-sage-950/40 dark:text-sage-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-mist/70 bg-surface/40 p-12 text-center">
          <Calendar size={36} className="mx-auto text-ink-soft/60" />
          <h3 className="mt-3 text-sm font-semibold text-ink">
            {tab === "SCHEDULED" ? "No Scheduled Items" : "No Approved Items Awaiting Schedule"}
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            {tab === "SCHEDULED"
              ? "No items are currently queued for automated publication."
              : "Approve items in the Review & Approval desk to make them eligible for scheduling."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-mist/70 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-mist bg-surface/70 text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title & Slug</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">
                    {tab === "SCHEDULED" ? "Scheduled Release (Asia/Dhaka)" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 text-ink">
                {filteredItems.map((item) => {
                  const typeMeta = CMS_CONTENT_TYPE_META[item.contentType as CmsContentType];

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-surface/50">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="font-mono text-[11px] text-ink-soft">/{item.slug}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-md border border-mist px-2 py-0.5 text-[11px] font-medium text-ink-soft bg-surface">
                          {typeMeta?.label || item.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium">{item.author.name}</div>
                        <div className="text-[11px] text-ink-soft">{item.author.email}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.scheduledAt ? (
                          <div className="flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300">
                            <Clock size={13} />
                            <span>
                              {new Date(item.scheduledAt).toLocaleString("en-US", {
                                timeZone: "Asia/Dhaka",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="rounded-full bg-sage-wash px-2 py-0.5 text-[11px] font-semibold text-sage-vivid">
                            Approved & Ready
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/admin/cms/preview/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-mist px-2 py-1 text-[11px] font-medium text-ink-soft hover:bg-surface hover:text-ink"
                          >
                            <ExternalLink size={12} /> Preview
                          </a>

                          {canPublish && (
                            <>
                              {item.status === "SCHEDULED" ? (
                                <>
                                  <button
                                    onClick={() => handleCancelSchedule(item.id)}
                                    disabled={isPending}
                                    className="rounded-lg border border-mist px-2 py-1 text-[11px] font-medium text-ink-soft hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                    title="Cancel schedule"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handlePublishNow(item.id)}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-1 rounded-lg bg-sage-vivid px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                  >
                                    <Play size={11} /> Publish Now
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSchedulingItem(item);
                                    setMessage(null);
                                  }}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
                                >
                                  <Calendar size={11} /> Schedule
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Picker Modal */}
      {schedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-mist bg-paper p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ulab">
                  Set Publication Schedule
                </span>
                <h3 className="text-base font-bold text-ink">{schedulingItem.title}</h3>
              </div>
              <button
                onClick={() => setSchedulingItem(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-surface hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <label className="block text-xs font-semibold text-ink">
                Release Date & Time (Asia/Dhaka):
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-mist bg-surface/50 p-2.5 text-xs text-ink focus:border-ulab focus:outline-none"
              />
              <p className="text-[11px] text-ink-soft">
                Content will remain private until this time arrives, at which point the automated scheduler will publish it live.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-mist pt-4">
              <Button
                variant="outline"
                onClick={() => setSchedulingItem(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleScheduleSubmit}
                disabled={isPending || !scheduleDateTime}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

