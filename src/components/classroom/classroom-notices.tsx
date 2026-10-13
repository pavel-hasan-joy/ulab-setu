"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  File,
  FileCheck,
  FileText,
  Link as LinkIcon,
  Megaphone,
  Pin,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { createClassroomNotice, deleteClassroomNotice } from "@/app/actions/classroom";
import { Badge, Button, Card, Field, formatDate, Input, Textarea } from "../ui";

export interface ClassroomNoticeData {
  id: string;
  title: string;
  content: string;
  link?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  attachmentType?: string | null;
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
  const [link, setLink] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [file, setFile] = useState<{
    name: string;
    size: string;
    type: string;
    url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);

    // 15MB limit
    if (f.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit. Please upload a smaller file or provide a Google Drive link.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`;
      setFile({
        name: f.name,
        size: sizeStr,
        type: f.type || "application/octet-stream",
        url: reader.result as string,
      });
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both title and content.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await createClassroomNotice(classroomId, title, content, {
        isPinned,
        link: link.trim() || null,
        attachment: file,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setShowForm(false);
      setTitle("");
      setContent("");
      setLink("");
      setIsPinned(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <h3 className="font-display text-base font-bold text-ink">Class Announcements & Study Materials</h3>
          <p className="text-xs text-ink-soft">
            Lecture notes, PDF slides, exam schedules, and course updates
          </p>
        </div>

        {canPost && !showForm && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowForm(true)}
            className="text-xs py-2 px-3"
          >
            <Plus size={14} /> Post Announcement / Upload Material
          </Button>
        )}
      </div>

      {/* Post Notice Form */}
      {showForm && (
        <Card className="p-5 border-ulab/30 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-mist/50 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Megaphone size={16} className="text-ulab" />
              New Class Announcement or Learning Material
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-ink-soft hover:text-ink transition"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-wash p-2.5 text-xs font-semibold text-rose">
                {error}
              </div>
            )}

            <Field label="Title" hint="e.g. Chapter 4: Relational Algebra Lecture Slides & Notes">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement or Material Title"
                required
              />
            </Field>

            <Field label="Description / Instructions" hint="Explain the materials or announcements for students">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement details or lecture overview..."
                rows={3}
                required
              />
            </Field>

            {/* File Upload (PDF, Word, PPT, Excel, Images) */}
            <div className="rounded-2xl border border-dashed border-mist bg-paper/50 p-4">
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UploadCloud size={15} className="text-ulab" />
                  Attach Education File (PDF, Slides, DOCX, ZIP)
                </span>
                <span className="text-[10px] text-ink-soft font-normal">Max 15MB</span>
              </label>

              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-sage/40 bg-sage-wash/60 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={20} className="text-sage shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{file.name}</p>
                      <p className="text-[11px] text-ink-soft">{file.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-1 text-ink-soft hover:bg-rose-wash hover:text-rose transition"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.txt"
                    className="block w-full text-xs text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky file:text-ulab-deep hover:file:bg-ulab hover:file:text-white cursor-pointer"
                  />
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Supports Lecture PDF, Powerpoint slides (.pptx), Word documents, datasets, or lab code files.
                  </p>
                </div>
              )}
            </div>

            {/* External Resource Link */}
            <Field label="Google Drive / External Resource Link (Optional)" hint="e.g. Google Drive folder, YouTube lecture video, or GitHub repo">
              <div className="relative">
                <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://drive.google.com/... or https://..."
                  className="pl-9 text-xs"
                />
              </div>
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
                {isPending ? "Posting..." : "Post Notice & Materials"}
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
          <p className="font-heading text-sm font-bold text-ink">No announcements or study materials yet</p>
          <p className="text-xs text-ink-soft max-w-xs mt-1">
            {canPost
              ? "You can upload lecture slides, PDF documents, and post course notices here."
              : "Your teacher has not uploaded any materials or announcements for this class yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((notice) => {
            const isPdf = notice.attachmentName?.toLowerCase().endsWith(".pdf");

            return (
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

                <div className="mt-3 pt-3 border-t border-mist/40 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </div>

                {/* Attached File Card (PDF, Slides, Doc) */}
                {notice.attachmentUrl && (
                  <div className="mt-4 rounded-2xl border border-mist/80 bg-paper/70 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isPdf ? "bg-rose-wash text-rose" : "bg-sky text-ulab-deep"
                        }`}
                      >
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-ink truncate max-w-xs sm:max-w-md">
                          {notice.attachmentName || "Attached Document"}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {isPdf ? "PDF Document" : "Course File"} {notice.attachmentSize ? `• ${notice.attachmentSize}` : ""}
                        </p>
                      </div>
                    </div>

                    <a
                      href={notice.attachmentUrl}
                      download={notice.attachmentName || "document.pdf"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep active:scale-95"
                    >
                      <Download size={13} />
                      <span>{isPdf ? "View / Download PDF" : "Download File"}</span>
                    </a>
                  </div>
                )}

                {/* Attached External Link (Google Drive / GitHub / Slides) */}
                {notice.link && (
                  <div className="mt-3">
                    <a
                      href={notice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-1.5 text-xs font-semibold text-ulab transition hover:border-ulab hover:bg-sky"
                    >
                      <ExternalLink size={13} />
                      <span className="truncate max-w-sm">{notice.link}</span>
                    </a>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
