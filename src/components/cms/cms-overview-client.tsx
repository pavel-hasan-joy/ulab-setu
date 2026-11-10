"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  FileCheck2,
  FileEdit,
  Clock,
  CalendarClock,
  Archive,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
  Newspaper,
  Calendar,
  HelpCircle,
  Award,
  FolderGit2,
  Image as ImageIcon,
  History,
  X,
  Loader2,
  Send,
  Eye,
} from "lucide-react";
import { Badge, Avatar, cn } from "@/components/ui";
import {
  type CmsRole,
  type CmsContentType,
  type CmsContentStatus,
  CMS_CONTENT_TYPES,
  CMS_CONTENT_TYPE_META,
  CMS_STATUS_META,
} from "@/lib/cms-types";
import { createCmsContent, transitionCmsContentStatus } from "@/app/actions/cms";

type DashboardMetrics = {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  pendingReview: number;
  scheduledContent: number;
  archivedContent: number;
  activeCmsRoleCount: number;
};

type ContentItem = {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  status: string;
  summary: string | null;
  updatedAt: Date | string;
  scheduledAt?: Date | string | null;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  lastEditedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type AuditItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  createdAt: Date | string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
};

type CmsOverviewClientProps = {
  metrics: DashboardMetrics;
  byType: Record<string, number>;
  recentlyUpdated: ContentItem[];
  pendingApprovalQueue: ContentItem[];
  upcomingScheduled: ContentItem[];
  recentActivity: AuditItem[];
  currentActorRole: CmsRole;
};

export function CmsOverviewClient({
  metrics,
  byType,
  recentlyUpdated,
  pendingApprovalQueue,
  upcomingScheduled,
  recentActivity,
  currentActorRole,
}: CmsOverviewClientProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Quick slug generator
  const [titleInput, setTitleInput] = useState("");
  const [slugInput, setSlugInput] = useState("");

  const handleTitleChange = (val: string) => {
    setTitleInput(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlugInput(generated);
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createCmsContent(undefined, formData);
      if (!res.success) {
        setFormError(res.error || "Failed to create content draft.");
      } else {
        setFormSuccess(res.message || "Draft created successfully!");
        setTimeout(() => {
          setCreateModalOpen(false);
          setTitleInput("");
          setSlugInput("");
          setFormSuccess(null);
        }, 1200);
      }
    });
  };

  const handleQuickTransition = (contentId: string, nextStatus: CmsContentStatus) => {
    if (!confirm(`Are you sure you want to transition this content to ${nextStatus}?`)) return;
    startTransition(async () => {
      const res = await transitionCmsContentStatus(contentId, nextStatus);
      if (!res.success) {
        alert(res.error || "Transition failed.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* =========================================================================
          HERO BANNER & QUICK ACTIONS
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-mist/80 bg-gradient-to-br from-ulab-deep via-[#0d2a4a] to-ulab p-6 text-white shadow-soft dark:border-white/10 md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-soft border border-gold/30">
                <ShieldCheck size={14} /> Integrated CMS Production Engine
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                Role: {currentActorRole}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              ULAB Setu Content Management System
            </h1>
            <p className="max-w-2xl text-xs text-white/80 md:text-sm leading-relaxed">
              Institutional publishing ecosystem for university pages, campus announcements, event directories, alumni spotlights, and academic resources with strict 8-stage lifecycle governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-xs font-bold text-ulab-deep shadow-lift transition hover:bg-gold-soft active:scale-98"
            >
              <Plus size={16} /> New Content Item
            </button>
            <Link
              href="/admin/cms/permissions"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <ShieldCheck size={16} /> Manage CMS Roles
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-64 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      {/* =========================================================================
          KEY LIFECYCLE METRIC CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Content */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-ulab/40 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Total Content</span>
            <div className="rounded-xl bg-ulab/10 p-2 text-ulab dark:bg-ulab/20 dark:text-sky-300">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{metrics.totalContent}</p>
          <span className="text-[11px] font-medium text-ink-soft">Across 8 types</span>
        </div>

        {/* Published */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-emerald-500/40 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Published</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <FileCheck2 size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.publishedContent}
          </p>
          <span className="text-[11px] font-medium text-ink-soft">Live on platform</span>
        </div>

        {/* Drafts */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-blue-500/40 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Drafts</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <FileEdit size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{metrics.draftContent}</p>
          <span className="text-[11px] font-medium text-ink-soft">Work in progress</span>
        </div>

        {/* In Review */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-gold/50 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Pending Review</span>
            <div className="rounded-xl bg-gold/15 p-2 text-gold-ink dark:bg-gold/20 dark:text-gold-soft">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-gold-ink dark:text-gold-soft">
            {metrics.pendingReview}
          </p>
          <span className="text-[11px] font-medium text-ink-soft">Requires approval</span>
        </div>

        {/* Scheduled */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-purple-500/40 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Scheduled</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <CalendarClock size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{metrics.scheduledContent}</p>
          <span className="text-[11px] font-medium text-ink-soft">Future publication</span>
        </div>

        {/* Archived */}
        <div className="rounded-2xl border border-mist/80 bg-surface/90 p-4 shadow-xs transition hover:border-gray-500/40 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-semibold">Archived</span>
            <div className="rounded-xl bg-mist/60 p-2 text-ink-soft dark:bg-white/10">
              <Archive size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-ink-soft">{metrics.archivedContent}</p>
          <span className="text-[11px] font-medium text-ink-soft">Historical archive</span>
        </div>
      </div>

      {/* =========================================================================
          CONTENT TYPES DIRECTORY CARDS
      ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Content Modules & Architecture</h2>
            <p className="text-xs text-ink-soft">
              8 polymorphic content structures supported by the unified CMS engine.
            </p>
          </div>
          <Link
            href="/admin/cms/permissions"
            className="text-xs font-semibold text-ulab hover:underline dark:text-sky-400"
          >
            {metrics.activeCmsRoleCount} Active CMS Roles Assigned →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {CMS_CONTENT_TYPES.map((type) => {
            const meta = CMS_CONTENT_TYPE_META[type];
            const count = byType[type] || 0;
            const targetRoute =
              type === "PAGE"
                ? "/admin/cms/pages"
                : type === "HOMEPAGE_SECTION"
                ? "/admin/cms/homepage"
                : type === "NEWS" || type === "ANNOUNCEMENT"
                ? "/admin/cms/news"
                : type === "EVENT"
                ? "/admin/cms/events"
                : type === "FAQ"
                ? "/admin/cms/faqs"
                : type === "ALUMNI_STORY"
                ? "/admin/cms/stories"
                : "/admin/cms/resources";

            return (
              <Link
                key={type}
                href={targetRoute}
                className="group relative flex flex-col justify-between rounded-2xl border border-mist/80 bg-surface/80 p-4 transition-all hover:-translate-y-0.5 hover:border-ulab/40 hover:shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-soft dark:bg-white/10">
                      Phase {meta.phase}
                    </span>
                    <span className="font-display text-sm font-bold text-ink group-hover:text-ulab dark:group-hover:text-sky-400">
                      {count} items
                    </span>
                  </div>
                  <h3 className="mt-3 text-xs font-bold text-ink group-hover:text-ulab dark:group-hover:text-sky-300">
                    {meta.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ink-soft leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-mist/40 pt-2 text-[11px] font-semibold text-ulab dark:border-white/5 dark:text-sky-400">
                  <span>Open Module</span>
                  <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TWO-COLUMN WORKFLOW SECTION
      ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Approval Queue & Recently Updated */}
        <div className="space-y-6 lg:col-span-7">
          {/* Pending Approval Queue */}
          <div className="rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gold/15 text-gold-ink dark:bg-gold/20 dark:text-gold-soft">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">Editorial Review & Approval Queue</h3>
                  <p className="text-[11px] text-ink-soft">Submissions awaiting reviewer sign-off.</p>
                </div>
              </div>
              <Badge tone="gold">{pendingApprovalQueue.length} Pending</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {pendingApprovalQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-paper text-emerald-600 dark:bg-white/5 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-ink">Review Queue Clear</p>
                  <p className="mt-1 text-[11px] text-ink-soft max-w-xs">
                    All submitted content has been processed. New review requests will appear here.
                  </p>
                </div>
              ) : (
                pendingApprovalQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-mist/70 bg-paper/60 p-3.5 transition hover:bg-paper dark:border-white/5 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-ulab/10 px-1.5 py-0.5 text-[9px] font-bold text-ulab dark:bg-ulab/20 dark:text-sky-300">
                            {item.contentType}
                          </span>
                          <span className="text-[11px] text-ink-soft font-mono">/{item.slug}</span>
                        </div>
                        <h4 className="mt-1 text-xs font-bold text-ink">{item.title}</h4>
                      </div>
                      <Badge tone="gold" className="text-[10px]">In Review</Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-mist/40 text-[11px] text-ink-soft dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <Avatar name={item.author.name} size={20} src={item.author.image} />
                        <span>{item.author.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(currentActorRole === "CMS_ADMIN" || currentActorRole === "CONTENT_REVIEWER") && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleQuickTransition(item.id, "APPROVED")}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickTransition(item.id, "CHANGES_REQUESTED")}
                              className="rounded-lg bg-rose/10 px-2.5 py-1 text-[10px] font-bold text-rose hover:bg-rose/20"
                            >
                              Request Changes
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recently Updated Content */}
          <div className="rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-ulab/10 text-ulab dark:bg-ulab/20 dark:text-sky-300">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">Recently Updated Content</h3>
                  <p className="text-[11px] text-ink-soft">Latest entries modified across the CMS.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {recentlyUpdated.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-soft">
                  No content records created yet. Use the "New Content Item" button above to create the first draft.
                </div>
              ) : (
                recentlyUpdated.map((item) => {
                  const statusMeta = CMS_STATUS_META[item.status as CmsContentStatus] || {
                    label: item.status,
                    tone: "gray",
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-mist/60 bg-paper/50 p-3 transition hover:bg-paper dark:border-white/5 dark:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                            {item.contentType}
                          </span>
                          <span className="text-[10px] text-ink-soft/60">•</span>
                          <span className="truncate text-[11px] font-mono text-ink-soft">
                            /{item.slug}
                          </span>
                        </div>
                        <p className="truncate text-xs font-bold text-ink mt-0.5">{item.title}</p>
                        <p className="text-[10px] text-ink-soft mt-0.5">
                          Author: {item.author.name} {item.lastEditedBy ? `• Editor: ${item.lastEditedBy.name}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={statusMeta.tone} className="text-[10px]">
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Scheduled & Activity Logs */}
        <div className="space-y-6 lg:col-span-5">
          {/* Upcoming Scheduled Publications */}
          <div className="rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold text-ink">Upcoming Scheduled Publications</h3>
              </div>
              <Badge tone="lilac">{upcomingScheduled.length}</Badge>
            </div>

            <div className="mt-4 space-y-2.5">
              {upcomingScheduled.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-soft">
                  No publications currently scheduled.
                </div>
              ) : (
                upcomingScheduled.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-mist/60 bg-paper/50 p-2.5 text-xs dark:border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{item.title}</p>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">
                        Scheduled: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "TBD"}
                      </p>
                    </div>
                    <Badge tone="lilac">Scheduled</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent CMS Activity / Audit Log */}
          <div className="rounded-3xl border border-mist/80 bg-surface/90 p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <History size={16} className="text-ink-soft" />
                <h3 className="text-xs font-bold text-ink">Recent CMS Activity & Audit</h3>
              </div>
              <Link href="/admin/audit-logs" className="text-[11px] font-semibold text-ulab hover:underline dark:text-sky-400">
                Full Log
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-soft">
                  No CMS audit records yet. All editorial actions are logged immutably.
                </div>
              ) : (
                recentActivity.map((log) => {
                  const actionClean = log.action.replace("CMS_", "").replace(/_/g, " ");

                  return (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <Avatar name={log.admin.name} size={24} src={log.admin.image} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-bold text-ink">{log.admin.name}</p>
                          <span className="text-[10px] text-ink-soft shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-soft font-mono">
                          {actionClean} • {log.targetType}
                        </p>
                        {log.details && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-soft/70">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NEW CONTENT DRAFT MODAL
      ========================================================================= */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-xl rounded-3xl border border-mist bg-surface p-6 shadow-lift dark:border-white/10 dark:bg-[#0f172a]"
            >
              <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-ulab/10 text-ulab dark:bg-ulab/20 dark:text-sky-300">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-ink">Create New Content Draft</h3>
                    <p className="text-[11px] text-ink-soft">Initializes a new item in DRAFT state with Revision v1.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-wash p-2.5 text-xs text-rose">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink">Content Type *</label>
                    <select
                      name="contentType"
                      required
                      className="mt-1 h-9.5 w-full rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      {CMS_CONTENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {CMS_CONTENT_TYPE_META[type].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink">Category</label>
                    <input
                      type="text"
                      name="category"
                      placeholder="e.g. Academics, Career, Campus"
                      className="mt-1 h-9.5 w-full rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink">Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Enter headline or title..."
                    value={titleInput}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mt-1 h-9.5 w-full rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink">URL Slug *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-soft">
                      /
                    </span>
                    <input
                      type="text"
                      name="slug"
                      required
                      placeholder="url-friendly-slug"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value.toLowerCase().trim())}
                      className="h-9.5 w-full rounded-xl border border-mist/80 bg-paper pl-6 pr-3 text-xs font-mono text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft">Unique web URL path identifier.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink">Summary / Excerpt</label>
                  <textarea
                    name="summary"
                    rows={2}
                    placeholder="Short introduction or teaser..."
                    className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink">Body Content</label>
                  <textarea
                    name="body"
                    rows={4}
                    placeholder="Main text content (markdown or rich copy)..."
                    className="mt-1 w-full rounded-xl border border-mist/80 bg-paper p-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-mist/70 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-xl border border-mist/80 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-5 py-2 text-xs font-bold text-white transition hover:bg-ulab disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving Draft...
                      </>
                    ) : (
                      <>
                        <SaveIcon size={14} /> Create Draft
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SaveIcon({ size = 16 }: { size?: number }) {
  return <Plus size={size} />;
}

