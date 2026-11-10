"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Archive,
  RotateCcw,
  Search,
  ExternalLink,
  GitBranch,
  Calendar,
  User,
  CheckCircle,
  Eye,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  getCmsContentRevisions,
  restoreCmsRevision,
  restoreArchivedCmsItem,
} from "@/app/actions/cms";
import { CMS_STATUS_META, CMS_CONTENT_TYPE_META, type CmsContentStatus, type CmsContentType } from "@/lib/cms-types";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  status: string;
  updatedAt: Date;
  author: { id: string; name: string; email: string };
  lastEditedBy?: { id: string; name: string; email: string } | null;
}

interface RevisionRecord {
  id: string;
  version: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  structuredData: string | null;
  statusAtRevision: string;
  changeSummary: string | null;
  createdAt: Date;
  createdBy: { id: string; name: string; email: string; image?: string | null };
}

interface CmsHistoryClientProps {
  activeItems: ContentItem[];
  archivedItems: ContentItem[];
  currentRole: string;
}

export function CmsHistoryClient({ activeItems, archivedItems, currentRole }: CmsHistoryClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"REVISIONS" | "ARCHIVE">("REVISIONS");
  const [search, setSearch] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(activeItems[0] || null);
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [inspectingRevision, setInspectingRevision] = useState<RevisionRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Load revisions when content item is selected
  const loadRevisions = async (content: ContentItem) => {
    setSelectedContent(content);
    setLoadingRevisions(true);
    setMessage(null);
    try {
      const data = await getCmsContentRevisions(content.id);
      setRevisions(data as any);
    } catch {
      setMessage({ text: "Failed to load revisions.", error: true });
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestoreRevision = (revision: RevisionRecord) => {
    if (!selectedContent) return;
    if (
      !confirm(
        `Are you sure you want to restore "${selectedContent.title}" to version v${revision.version}? This will safely create a new revision without deleting historical versions.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const res = await restoreCmsRevision({
        contentId: selectedContent.id,
        revisionId: revision.id,
      });

      if (!res.success) {
        setMessage({ text: res.error || "Failed to restore revision.", error: true });
      } else {
        setMessage({ text: res.message || "Revision restored successfully." });
        setInspectingRevision(null);
        await loadRevisions(selectedContent);
        router.refresh();
      }
    });
  };

  const handleRestoreArchive = (item: ContentItem) => {
    startTransition(async () => {
      setMessage(null);
      const res = await restoreArchivedCmsItem(item.id);
      if (!res.success) {
        setMessage({ text: res.error || "Failed to restore archived item.", error: true });
      } else {
        setMessage({ text: res.message || "Item restored to Draft status." });
        router.refresh();
      }
    });
  };

  const canEdit = currentRole === "CMS_ADMIN" || currentRole === "CONTENT_EDITOR";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-mist/80 bg-surface/80 p-6 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shadow-xs">
                <History size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                History, Revisions & Archive
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Immutable version audit ledger tracking all content modifications, change summaries, and non-destructive rollbacks.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("REVISIONS")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "REVISIONS"
                  ? "bg-ink text-paper shadow-xs"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              Revision History
            </button>
            <button
              onClick={() => setTab("ARCHIVE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "ARCHIVE"
                  ? "bg-ink text-paper shadow-xs"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              Archived Content ({archivedItems.length})
            </button>
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

      {tab === "REVISIONS" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Select Content Item */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-xl border border-mist bg-paper p-4 shadow-soft">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter content items..."
                  className="w-full rounded-lg border border-mist bg-surface/50 py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                {activeItems
                  .filter((it) => it.title.toLowerCase().includes(search.toLowerCase()) || it.slug.includes(search))
                  .map((item) => {
                    const isSelected = selectedContent?.id === item.id;
                    const typeMeta = CMS_CONTENT_TYPE_META[item.contentType as CmsContentType];

                    return (
                      <button
                        key={item.id}
                        onClick={() => loadRevisions(item)}
                        className={`w-full text-left rounded-xl p-3 text-xs transition-all border ${
                          isSelected
                            ? "border-ulab bg-sky/30 shadow-xs"
                            : "border-mist/60 bg-surface/40 hover:bg-surface/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink line-clamp-1">{item.title}</span>
                          <span className="rounded bg-paper px-1.5 py-0.5 text-[10px] text-ink-soft border border-mist">
                            {typeMeta?.label || item.contentType}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
                          <span className="font-mono truncate max-w-[180px]">/{item.slug}</span>
                          <span className="uppercase text-[10px] font-bold">{item.status}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Revisions Timeline for Selected Content */}
          <div className="lg:col-span-7">
            {selectedContent ? (
              <div className="rounded-2xl border border-mist bg-paper p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between border-b border-mist pb-4 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ulab">
                      Revisions Timeline
                    </span>
                    <h3 className="text-base font-bold text-ink">{selectedContent.title}</h3>
                    <p className="font-mono text-xs text-ink-soft">/{selectedContent.slug}</p>
                  </div>
                  <a
                    href={`/admin/cms/preview/${selectedContent.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-mist px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-surface hover:text-ink"
                  >
                    <ExternalLink size={12} /> Live Preview
                  </a>
                </div>

                {loadingRevisions ? (
                  <div className="py-12 text-center text-xs text-ink-soft">
                    Loading version history...
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-soft">
                    <History size={32} className="mx-auto text-ink-soft/40" />
                    <p className="mt-2 font-medium">No previous revisions recorded yet.</p>
                    <p className="mt-0.5 text-[11px]">Revisions are automatically captured whenever content is modified or published.</p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {revisions.map((rev, idx) => (
                      <div
                        key={rev.id}
                        className="relative rounded-xl border border-mist/80 bg-surface/50 p-4 transition-all hover:border-mist"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
                              v{rev.version}
                            </span>
                            <span className="font-semibold text-ink text-xs">
                              {rev.changeSummary || `Version ${rev.version}`}
                            </span>
                            {idx === 0 && (
                              <span className="rounded-full bg-sage-wash px-2 py-0.5 text-[10px] font-bold text-sage-vivid">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInspectingRevision(rev)}
                              className="rounded-lg border border-mist bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:bg-surface hover:text-ink"
                            >
                              <Eye size={12} className="inline mr-1" /> View Snapshot
                            </button>
                            {canEdit && idx !== 0 && (
                              <button
                                onClick={() => handleRestoreRevision(rev)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
                              >
                                <RotateCcw size={11} /> Rollback to v{rev.version}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-soft border-t border-mist/40 pt-2">
                          <span>Recorded by: <strong>{rev.createdBy.name}</strong></span>
                          <span>
                            {new Date(rev.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="uppercase font-mono text-[10px]">
                            Status: {rev.statusAtRevision}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-mist/70 bg-surface/40 p-12 text-center text-xs text-ink-soft">
                Select a content item from the left to view its version timeline.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ARCHIVED CONTENT VAULT */
        <div className="overflow-hidden rounded-2xl border border-mist/70 bg-paper shadow-soft">
          <div className="p-4 border-b border-mist bg-surface/50">
            <h3 className="font-semibold text-sm text-ink">Archived Content Records</h3>
            <p className="text-xs text-ink-soft">
              Archived items are completely excluded from public visitors and search indexers. You can restore them back to Draft state at any time.
            </p>
          </div>

          {archivedItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-soft">
              <Archive size={32} className="mx-auto text-ink-soft/40" />
              <p className="mt-2 font-medium">Archive vault is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-mist bg-surface/70 text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title & Slug</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Author</th>
                    <th className="px-4 py-3 font-semibold">Archived Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist/60 text-ink">
                  {archivedItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-surface/50">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="font-mono text-[11px] text-ink-soft">/{item.slug}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-md border border-mist px-2 py-0.5 text-[11px] font-medium text-ink-soft bg-surface">
                          {item.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium">{item.author.name}</div>
                        <div className="text-[11px] text-ink-soft">{item.author.email}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-ink-soft">
                        {new Date(item.updatedAt).toLocaleDateString()}
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
                          {canEdit && (
                            <button
                              onClick={() => handleRestoreArchive(item)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
                            >
                              <RotateCcw size={11} /> Restore to Draft
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Revision Snapshot Modal */}
      {inspectingRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mist bg-paper p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ulab">
                  Snapshot: Version {inspectingRevision.version}
                </span>
                <h3 className="text-base font-bold text-ink">{inspectingRevision.title}</h3>
                <p className="text-xs text-ink-soft">
                  Created by {inspectingRevision.createdBy.name} on{" "}
                  {new Date(inspectingRevision.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectingRevision(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-surface hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-ink">Slug:</span>{" "}
                <code className="font-mono bg-surface px-1.5 py-0.5 rounded border border-mist">
                  /{inspectingRevision.slug}
                </code>
              </div>

              <div>
                <span className="font-semibold text-ink">Summary:</span>
                <p className="mt-1 text-ink-soft bg-surface/50 p-2.5 rounded-lg border border-mist/60 leading-relaxed">
                  {inspectingRevision.summary || "No summary recorded."}
                </p>
              </div>

              {inspectingRevision.body && (
                <div>
                  <span className="font-semibold text-ink">Narrative Body:</span>
                  <pre className="mt-1 font-mono text-[11px] text-ink-soft bg-surface/50 p-3 rounded-lg border border-mist/60 overflow-x-auto whitespace-pre-wrap max-h-48">
                    {inspectingRevision.body}
                  </pre>
                </div>
              )}

              {inspectingRevision.structuredData && (
                <div>
                  <span className="font-semibold text-ink">Structured Blocks JSON:</span>
                  <pre className="mt-1 font-mono text-[10px] text-ink-soft bg-surface/50 p-3 rounded-lg border border-mist/60 overflow-x-auto max-h-40">
                    {inspectingRevision.structuredData}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-mist pt-4">
              <Button variant="outline" onClick={() => setInspectingRevision(null)}>
                Close
              </Button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRestoreRevision(inspectingRevision)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Rollback to this Version
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

