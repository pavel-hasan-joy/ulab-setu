"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Megaphone,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Sparkles,
  Send,
  X,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea, timeAgo } from "@/components/ui";
import { createAdminNotice, deleteNoticeByAdmin } from "@/app/actions/admin";
import { postKinds } from "@/lib/site";

export type AdminNoticeRecord = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  eventDate: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    designation: string | null;
  };
};

export function AdminNoticesView({
  notices,
  currentAdminName,
}: {
  notices: AdminNoticeRecord[];
  currentAdminName: string;
}) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [kind, setKind] = useState("Notice");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [formError, setFormError] = useState("");

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (kindFilter !== "ALL" && n.kind !== kindFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.author.name.toLowerCase().includes(q)
      );
    });
  }, [notices, search, kindFilter]);

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !body.trim()) {
      setFormError("Title and description are required.");
      return;
    }

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("title", title.trim());
    formData.append("body", body.trim());
    if (link.trim()) formData.append("link", link.trim());
    if (eventDate) formData.append("eventDate", eventDate);

    startTransition(async () => {
      const res = await createAdminNotice({}, formData);
      if (res?.error) {
        setFormError(res.error);
      } else {
        setTitle("");
        setBody("");
        setLink("");
        setEventDate("");
        setShowCreateModal(false);
      }
    });
  };

  const handleDelete = (postId: string, noticeTitle: string) => {
    if (!confirm(`Are you sure you want to delete the notice "${noticeTitle}"?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteNoticeByAdmin(postId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete post");
      }
    });
  };

  const kindBadgeTone = (k: string) => {
    switch (k) {
      case "Event":
        return "gold";
      case "Scholarship":
        return "sage";
      case "Research":
        return "lilac";
      case "Opportunity":
        return "blue";
      default:
        return "rose";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Post Button */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-ulab/10 via-surface to-sky/20 border-ulab-light/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ulab text-white shadow-soft">
            <Megaphone size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Broadcast Official Notice</h3>
            <p className="text-xs text-ink-soft">
              Publish university-wide announcements, scholarship alerts, and seminar schedules.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 shrink-0 text-xs sm:text-sm py-2"
        >
          <PlusCircle size={16} /> New Announcement
        </Button>
      </Card>

      {/* Modal / Dialog for New Notice */}
      {showCreateModal && (
        <Card className="p-6 border-2 border-ulab-light/40 shadow-lift relative animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-mist/70">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-ulab" />
              <h3 className="font-bold text-base text-ink">Create University Notice</h3>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-ink-soft hover:text-ink p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateNotice} className="mt-4 space-y-4">
            {formError && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Notice Category">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ulab-light focus:outline-none"
                >
                  {postKinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Event / Application Date (Optional)">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-ulab-light focus:outline-none"
                />
              </Field>
            </div>

            <Field label="Announcement Title">
              <input
                type="text"
                placeholder="e.g. ULAB Annual Tech Fest 2026 Registration Open"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none"
                required
              />
            </Field>

            <Field label="Detailed Body & Instructions">
              <textarea
                rows={4}
                placeholder="Write the full announcement, guidelines, venue, or participation rules..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none resize-y"
                required
              />
            </Field>

            <Field label="External URL / Registration Link (Optional)">
              <input
                type="url"
                placeholder="https://ulab.edu.bd/event-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full rounded-xl border border-mist bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                <Send size={15} />
                {isPending ? "Publishing..." : "Publish Broadcast"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70"
            />
            <input
              type="text"
              placeholder="Search announcements by title, content, or poster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-mist bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-none focus:ring-4 focus:ring-ulab-light/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <Filter size={13} /> Filter:
            </span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {postKinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            {(search || kindFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setKindFilter("ALL");
                }}
                className="text-xs text-rose font-medium hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          title="No notices found"
          body="No posts match your active search or category filters."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-soft px-1">
            <span>Showing {filteredNotices.length} notices & events</span>
            {isPending && <span className="text-ulab font-medium animate-pulse">Updating...</span>}
          </div>

          <div className="grid gap-3">
            {filteredNotices.map((n) => {
              const tone = kindBadgeTone(n.kind) as "gold" | "sage" | "lilac" | "blue" | "rose";

              return (
                <Card key={n.id} className="p-5 transition hover:border-mist">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={tone}>{n.kind}</Badge>
                        <h4 className="text-base font-bold text-ink">
                          {n.title}
                        </h4>
                      </div>

                      <p className="text-xs sm:text-sm text-ink/90 whitespace-pre-line leading-relaxed">
                        {n.body}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft pt-1">
                        {n.eventDate && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                            <Calendar size={13} /> {new Date(n.eventDate).toLocaleDateString("en-US", { dateStyle: "long" })}
                          </span>
                        )}
                        {n.link && (
                          <a
                            href={n.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-ulab hover:underline"
                          >
                            <ExternalLink size={13} /> Open Link
                          </a>
                        )}
                        <span>
                          By <span className="font-semibold text-ink">{n.author.name}</span> ({n.author.role}) · {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    <div className="pt-2 sm:pt-0">
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(n.id, n.title)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400"
                        title="Delete this notice"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
