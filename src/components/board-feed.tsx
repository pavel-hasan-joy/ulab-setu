"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ExternalLink,
  Clock,
  MessageSquare,
  Share2,
  Check,
  X,
  ArrowRight,
  Megaphone,
  Building,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { DeletePost } from "./delete-post";
import { Avatar, Badge, Button, Card, EmptyState, cn, formatDate, timeAgo } from "./ui";

export interface SerializedPostAuthor {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  company: string | null;
  graduationYear: number | string | null;
  image: string | null;
  bio: string | null;
}

export interface SerializedPost {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  eventDate: string | null;
  createdAt: string;
  authorId: string;
  author: SerializedPostAuthor;
}

const kindTone = {
  Notice: "blue",
  Event: "lilac",
  Scholarship: "gold",
  Research: "sage",
  Opportunity: "rose",
} as const;

interface BoardFeedProps {
  posts: SerializedPost[];
  viewerId: string;
  viewerRole: string;
  canPost: boolean;
  basePath: string;
  initialNoticeId?: string;
}

export function BoardFeed({
  posts,
  viewerId,
  viewerRole,
  canPost,
  basePath,
  initialNoticeId,
}: BoardFeedProps) {
  const [selectedNotice, setSelectedNotice] = useState<SerializedPost | null>(() => {
    if (initialNoticeId) {
      return posts.find((p) => p.id === initialNoticeId) || null;
    }
    return null;
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-open if query param noticeId changes
  useEffect(() => {
    if (initialNoticeId) {
      const found = posts.find((p) => p.id === initialNoticeId);
      if (found) setSelectedNotice(found);
    }
  }, [initialNoticeId, posts]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNotice(null);
    };
    if (selectedNotice) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedNotice]);

  const handleCopyNoticeLink = (noticeId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${basePath}?noticeId=${noticeId}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const getMessageHref = (authorId: string) => {
    const rolePrefix = viewerRole === "TEACHER" ? "teacher" : viewerRole === "ALUMNI" ? "alumni" : "student";
    return `/${rolePrefix}/messages`;
  };

  if (posts.length === 0) {
    return (
      <EmptyState
        title="Nothing posted here yet"
        body={
          canPost
            ? "Be the first: share a notice, event or opportunity above."
            : "Teachers and alumni will post notices, events and scholarships here."
        }
      />
    );
  }

  return (
    <>
      <Stagger className="space-y-4">
        {posts.map((p) => {
          const isAuthor = p.authorId === viewerId;
          const tone = kindTone[p.kind as keyof typeof kindTone] ?? "gray";

          return (
            <StaggerItem key={p.id}>
              <Card
                onClick={() => setSelectedNotice(p)}
                className="group cursor-pointer p-5 transition-all duration-200 hover:border-ulab/60 hover:shadow-soft md:p-6"
              >
                {/* Author row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar name={p.author.name} src={p.author.image} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-semibold text-ink group-hover:text-ulab transition">
                          {p.author.name}
                        </p>
                        <Badge tone={p.author.role === "TEACHER" ? "lilac" : "gold"}>
                          {p.author.role === "TEACHER"
                            ? p.author.designation ?? "Faculty"
                            : `Alumni, ${p.author.graduationYear ?? "ULAB"}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-soft">
                        {p.author.department ? `${p.author.department} · ` : ""}
                        {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Delete button (author only) */}
                  {isAuthor && <DeletePost postId={p.id} />}
                </div>

                {/* Category & Event Date */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge tone={tone}>{p.kind}</Badge>
                  {p.eventDate && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <CalendarDays size={13} /> {formatDate(p.eventDate)}
                    </span>
                  )}
                </div>

                {/* Notice Title */}
                <h2 className="mt-2 text-lg sm:text-xl font-bold text-ink group-hover:text-ulab transition leading-snug">
                  {p.title}
                </h2>

                {/* Notice Body Snippet */}
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-ink-soft">
                  {p.body}
                </p>

                {/* Card Action Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-mist/60 pt-3 text-xs dark:border-white/5">
                  <span className="inline-flex items-center gap-1.5 font-bold text-ulab group-hover:underline">
                    View Full Details & Notice <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                  </span>

                  <div className="flex items-center gap-3 text-ink-soft">
                    {p.link && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <ExternalLink size={12} /> External Link
                      </span>
                    )}
                    <span className="text-[11px] text-ink-soft/70">
                      Click to expand
                    </span>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* FULL NOTICE DETAILS MODAL */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-mist/80 bg-surface shadow-2xl dark:border-white/10 overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-mist/70 px-6 py-4 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Badge tone={kindTone[selectedNotice.kind as keyof typeof kindTone] ?? "gray"}>
                    {selectedNotice.kind}
                  </Badge>
                  <span className="text-xs text-ink-soft flex items-center gap-1">
                    <Clock size={12} />
                    Published {timeAgo(selectedNotice.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyNoticeLink(selectedNotice.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper dark:border-white/10 dark:bg-white/5 transition"
                    title="Copy direct notice link"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={13} />
                        <span>Share</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded-xl p-1.5 text-ink-soft hover:bg-paper hover:text-ink transition dark:hover:bg-white/10"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Notice Title */}
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-snug">
                    {selectedNotice.title}
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(selectedNotice.createdAt).toLocaleString("en-US", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                {/* Notice Author / Publisher Card (নোটিশদাতা ও বিভাগ) */}
                <div className="rounded-2xl border border-mist/80 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        name={selectedNotice.author.name}
                        src={selectedNotice.author.image}
                        size={48}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-ink">
                            {selectedNotice.author.name}
                          </h4>
                          <Badge
                            tone={
                              selectedNotice.author.role === "TEACHER"
                                ? "lilac"
                                : "gold"
                            }
                          >
                            {selectedNotice.author.role === "TEACHER"
                              ? "Faculty Member"
                              : "Verified Alumni"}
                          </Badge>
                        </div>

                        <p className="text-xs text-ink-soft mt-0.5">
                          {selectedNotice.author.role === "TEACHER" ? (
                            <>
                              <span className="font-semibold text-ink">
                                {selectedNotice.author.designation || "Faculty"}
                              </span>
                              {selectedNotice.author.department && ` · Department of ${selectedNotice.author.department}`}
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-ink">
                                {selectedNotice.author.company
                                  ? `${selectedNotice.author.designation || "Professional"} at ${selectedNotice.author.company}`
                                  : "ULAB Alumni"}
                              </span>
                              {selectedNotice.author.graduationYear && ` · Class of ${selectedNotice.author.graduationYear}`}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Direct message button if not viewing own notice */}
                    {selectedNotice.authorId !== viewerId && (
                      <Link
                        href={getMessageHref(selectedNotice.authorId)}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-mist/80 bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper shadow-xs transition dark:border-white/10 dark:bg-white/5"
                      >
                        <MessageSquare size={13} className="text-ulab" />
                        Message Author
                      </Link>
                    )}
                  </div>
                </div>

                {/* Event Date / Deadline Banner (if applicable) */}
                {selectedNotice.eventDate && (
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                    <CalendarDays size={20} className="shrink-0 text-amber-700 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Event Date / Application Deadline
                      </p>
                      <p className="text-sm font-semibold mt-0.5">
                        {new Date(selectedNotice.eventDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Notice Content (নোটিশের মূল বিবরণ ও তথ্য) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
                    <Megaphone size={14} className="text-ulab" />
                    <span>Notice Details & Content</span>
                  </div>

                  <div className="rounded-2xl border border-mist/60 bg-paper/40 p-5 text-sm leading-relaxed text-ink whitespace-pre-line selection:bg-ulab selection:text-white dark:border-white/5 dark:bg-white/[0.03]">
                    {selectedNotice.body}
                  </div>
                </div>

                {/* Attached External Link / Registration Portal (সংযুক্ত লিংক) */}
                {selectedNotice.link && (
                  <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/80 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Official Attachment / Registration Link:
                        </span>
                        <p className="mt-0.5 text-xs text-emerald-950 truncate max-w-md font-mono dark:text-emerald-200">
                          {selectedNotice.link}
                        </p>
                      </div>

                      <a
                        href={selectedNotice.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-soft transition"
                      >
                        Open Link / Apply <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-mist/70 bg-paper/40 px-6 py-3.5 dark:border-white/10 dark:bg-white/5">
                <span className="text-xs text-ink-soft">
                  ULAB Setu Official Notice Board
                </span>

                <Button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="bg-ulab px-5 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep shadow-soft"
                >
                  Close Notice
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
