"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Search,
  ExternalLink,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Filter,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui";
import { submitReviewDecision } from "@/app/actions/cms";
import { CMS_STATUS_META, CMS_CONTENT_TYPE_META, type CmsContentStatus, type CmsContentType } from "@/lib/cms-types";

interface ReviewItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  status: string;
  summary: string | null;
  body: string | null;
  reviewNotes: string | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; email: string; image?: string | null };
  reviewedBy?: { id: string; name: string; email: string } | null;
  reviews: Array<{
    id: string;
    action: string;
    comments: string;
    createdAt: Date;
    reviewer: { id: string; name: string; email: string };
  }>;
}

interface CmsReviewClientProps {
  initialItems: ReviewItem[];
  currentRole: string;
}

export function CmsReviewClient({ initialItems, currentRole }: CmsReviewClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.author.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDecision = (action: "APPROVE" | "REQUEST_CHANGES") => {
    if (!selectedItem) return;
    if (!reviewComments.trim()) {
      setMessage({ text: "Please provide review feedback comments.", error: true });
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const res = await submitReviewDecision({
        contentId: selectedItem.id,
        action,
        comments: reviewComments.trim(),
      });

      if (!res.success) {
        setMessage({ text: res.error || "Failed to submit review decision.", error: true });
      } else {
        setMessage({ text: res.message || "Review decision recorded." });
        setItems((prev) =>
          prev.map((it) =>
            it.id === selectedItem.id
              ? {
                  ...it,
                  status: action === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED",
                  reviewNotes: reviewComments.trim(),
                }
              : it
          )
        );
        setSelectedItem(null);
        setReviewComments("");
        router.refresh();
      }
    });
  };

  const canReview = currentRole === "CMS_ADMIN" || currentRole === "CONTENT_REVIEWER";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-mist/80 bg-surface/80 p-6 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-wash text-sage-vivid shadow-xs">
                <CheckSquare size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Review & Approval Desk
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Evaluate submitted content, provide editorial guidance, and sign off on content before publication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mist px-3 py-1 text-xs font-medium text-ink-soft bg-paper">
              <Clock size={12} /> {items.filter((i) => i.status === "IN_REVIEW").length} Pending Review
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mist px-3 py-1 text-xs font-medium text-sage-vivid bg-sage-wash">
              <CheckCircle size={12} /> {items.filter((i) => i.status === "APPROVED").length} Approved
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mist/60 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === st
                    ? "bg-ink text-paper shadow-xs"
                    : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
                }`}
              >
                {st === "ALL" ? "All Queue" : CMS_STATUS_META[st as CmsContentStatus]?.label || st}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author..."
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

      {/* Review Queue Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-mist/70 bg-surface/40 p-12 text-center">
          <CheckSquare size={36} className="mx-auto text-ink-soft/60" />
          <h3 className="mt-3 text-sm font-semibold text-ink">Queue is Clear</h3>
          <p className="mt-1 text-xs text-ink-soft">
            No content items currently match your review filter.
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
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 text-ink">
                {filteredItems.map((item) => {
                  const typeMeta = CMS_CONTENT_TYPE_META[item.contentType as CmsContentType];
                  const statusMeta = CMS_STATUS_META[item.status as CmsContentStatus];

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-surface/50">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="font-mono text-[11px] text-ink-soft">/{item.slug}</div>
                        {item.reviewNotes && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                            <MessageSquare size={11} />
                            <span className="truncate max-w-[320px]">Note: {item.reviewNotes}</span>
                          </div>
                        )}
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
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            item.status === "APPROVED"
                              ? "bg-sage-wash text-sage-vivid"
                              : item.status === "IN_REVIEW"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : item.status === "CHANGES_REQUESTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-mist/60 text-ink-soft"
                          }`}
                        >
                          {statusMeta?.label || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-ink-soft">
                        {new Date(item.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/admin/cms/preview/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-mist px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:bg-surface hover:text-ink"
                          >
                            <ExternalLink size={12} /> Preview
                          </a>
                          {canReview && item.status === "IN_REVIEW" && (
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setReviewComments(item.reviewNotes || "");
                                setMessage(null);
                              }}
                              className="rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper shadow-xs hover:opacity-90"
                            >
                              Review & Decide
                            </button>
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

      {/* Review & Decision Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mist bg-paper p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ulab">
                  Editorial Review
                </span>
                <h3 className="text-lg font-bold text-ink">{selectedItem.title}</h3>
                <p className="text-xs text-ink-soft">
                  Author: {selectedItem.author.name} ({selectedItem.author.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-surface hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Content Summary Preview */}
            <div className="my-4 space-y-2 rounded-xl border border-mist/80 bg-surface/50 p-4 text-xs">
              <div className="font-semibold text-ink">Summary:</div>
              <p className="text-ink-soft leading-relaxed">
                {selectedItem.summary || "No short summary provided."}
              </p>
              {selectedItem.body && (
                <>
                  <div className="mt-2 font-semibold text-ink">Body Snippet:</div>
                  <p className="line-clamp-4 font-mono text-[11px] text-ink-soft bg-paper p-2 rounded border border-mist/60">
                    {selectedItem.body}
                  </p>
                </>
              )}
            </div>

            {/* Previous Feedback History */}
            {selectedItem.reviews.length > 0 && (
              <div className="mb-4 space-y-2 border-t border-mist/60 pt-3">
                <h4 className="text-xs font-semibold text-ink">Previous Review Feedback:</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedItem.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-mist/60 bg-surface/60 p-2.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span>{r.reviewer.name} ({r.action})</span>
                        <span className="text-ink-soft">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-ink-soft">{r.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Decision Form */}
            <div className="space-y-3 border-t border-mist/60 pt-4">
              <label className="block text-xs font-semibold text-ink">
                Editorial Feedback & Notes:
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="State your feedback, requested changes, or approval remarks..."
                rows={4}
                className="w-full rounded-xl border border-mist bg-surface/50 p-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => handleDecision("REQUEST_CHANGES")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                >
                  <AlertTriangle size={14} /> Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("APPROVE")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sage-vivid px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Approve for Publication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

