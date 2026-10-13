"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pin, Plus, Trash2, X } from "lucide-react";
import { createClassroomNotice, deleteClassroomNotice } from "@/app/actions/classroom";
import { Avatar, Badge, Button, Card, Field, formatDate, Input, Textarea } from "../ui";

export interface ClassroomNoticeData {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
  author: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    designation: string | null;
  };
}

export function ClassroomNotices({
  classroomId,
  notices,
  canPost,
  currentUserId,
}: {
  classroomId: string;
  notices: ClassroomNoticeData[];
  canPost: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both title and content.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await createClassroomNotice(classroomId, title, content, isPinned);
      if (res.error) {
        setError(res.error);
        return;
      }
      setShowForm(false);
      setTitle("");
      setContent("");
      setIsPinned(false);
      router.refresh();
    });
  };

  const handleDelete = (noticeId: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    startTransition(async () => {
      await deleteClassroomNotice(noticeId, classroomId);
      router.refresh();
    });
  };

  // Sort pinned notices first
  const sorted = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Class Announcements & Notices</h3>
          <p className="text-xs text-ink-soft">Important updates, exam notices, and course announcements</p>
        </div>

        {canPost && !showForm && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowForm(true)}
            className="text-xs py-2 px-3"
          >
            <Plus size={14} /> Post Announcement
          </Button>
        )}
      </div>

      {/* Post Notice Form */}
      {showForm && (
        <Card className="p-5 border-ulab/30 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-mist/50 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Megaphone size={16} className="text-ulab" />
              New Announcement
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-ink-soft hover:text-ink transition"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-3.5">
            {error && (
              <div className="rounded-xl bg-rose-wash p-2.5 text-xs font-semibold text-rose">
                {error}
              </div>
            )}

            <Field label="Title" hint="e.g. Midterm Exam Schedule & Syllabus">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement Title"
                required
              />
            </Field>

            <Field label="Content" hint="Detailed instructions or message">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement details here..."
                rows={4}
                required
              />
            </Field>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pinNotice"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="size-4 rounded accent-ulab"
              />
              <label htmlFor="pinNotice" className="text-xs font-medium text-ink cursor-pointer flex items-center gap-1">
                <Pin size={12} className="text-gold-ink" /> Pin this notice to the top
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-mist/40">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isPending} className="text-xs py-1.5 px-3">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPending} className="text-xs py-1.5 px-3">
                {isPending ? "Posting..." : "Post Notice"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notices List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-mist bg-surface">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gold-wash text-gold-ink mb-3 shadow-xs">
            <Megaphone size={22} />
          </div>
          <p className="font-heading text-sm font-bold text-ink">No announcements yet</p>
          <p className="text-xs text-ink-soft max-w-xs mt-1">
            {canPost
              ? "You can post exam schedules, syllabus updates, and course notices here."
              : "Your teacher has not posted any announcements for this class yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sorted.map((notice) => (
            <Card
              key={notice.id}
              className={`p-5 transition hover:shadow-lift ${
                notice.isPinned ? "border-gold/50 bg-gold-wash/10 ring-1 ring-gold/20" : "border-mist/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {notice.isPinned && (
                      <Badge tone="gold" className="text-[11px] py-0.5 px-2">
                        <Pin size={11} /> Pinned
                      </Badge>
                    )}
                    <h4 className="font-display text-base font-bold text-ink">{notice.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span>Posted by <strong className="text-ink">{notice.author.name}</strong></span>
                    <span>•</span>
                    <span>{formatDate(notice.createdAt)}</span>
                  </div>
                </div>

                {(canPost || notice.author.id === currentUserId) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(notice.id)}
                    disabled={isPending}
                    title="Delete notice"
                    className="rounded-lg p-1.5 text-ink-soft hover:bg-rose-wash hover:text-rose transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-mist/40 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
