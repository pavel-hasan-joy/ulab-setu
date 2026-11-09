"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Archive,
  RefreshCw,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, Input } from "@/components/ui";
import { BlockEditor } from "./block-editor";
import { parseCmsBlocks, type CmsBlock } from "@/lib/cms-blocks";
import { saveCmsPage, deleteCmsPage, type CmsActionState } from "@/app/actions/cms";
import type { CmsContentStatus } from "@/lib/cms-types";

type PageItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: CmsContentStatus;
  structuredData: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  updatedAt: Date | string;
  author: { id: string; name: string | null; email: string | null; image: string | null } | null;
  lastEditedBy: { id: string; name: string | null; email: string | null } | null;
  publishedBy: { id: string; name: string | null; email: string | null } | null;
  _count: { revisions: number };
};

interface PagesManagerClientProps {
  initialPages: PageItem[];
  userRole: string;
}

export function PagesManagerClient({ initialPages, userRole }: PagesManagerClientProps) {
  const [pages, setPages] = useState<PageItem[]>(initialPages);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form states for Create/Edit
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDescription, setFormMetaDescription] = useState("");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formBlocks, setFormBlocks] = useState<CmsBlock[]>([]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filtered pages
  const filteredPages = pages.filter((page) => {
    const matchesStatus = selectedStatus === "ALL" || page.status === selectedStatus;
    const matchesQuery =
      searchQuery.trim() === "" ||
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (page.summary && page.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const openCreateModal = () => {
    setEditingPage(null);
    setFormTitle("");
    setFormSlug("");
    setFormSummary("");
    setFormMetaTitle("");
    setFormMetaDescription("");
    setFormFeaturedImage("");
    setFormBlocks([
      {
        id: "b-head-1",
        type: "heading",
        text: "Welcome to this page",
        level: "h1",
        alignment: "left",
        subtitle: "Explore essential information and campus resources.",
      },
      {
        id: "b-rt-1",
        type: "richText",
        body: "This is where your detailed page body goes. You can format text, add lists, links, and bold highlights easily.",
        isLead: false,
      },
    ]);
    setIsCreating(true);
    setFeedback(null);
  };

  const openEditModal = (page: PageItem) => {
    setEditingPage(page);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormSummary(page.summary || "");
    setFormMetaTitle(page.metaTitle || "");
    setFormMetaDescription(page.metaDescription || "");
    setFormFeaturedImage(page.featuredImage || "");
    const parsed = parseCmsBlocks(page.structuredData);
    setFormBlocks(parsed.length > 0 ? parsed : []);
    setIsCreating(true);
    setFeedback(null);
  };

  const handleSlugAutoFill = (title: string) => {
    setFormTitle(title);
    if (!editingPage) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated);
    }
  };

  const handleSavePage = (publishImmediately: boolean) => {
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Please provide a page title." });
      return;
    }
    if (!formSlug.trim()) {
      setFeedback({ type: "error", message: "Please provide a valid URL slug." });
      return;
    }

    startTransition(async () => {
      const res = await saveCmsPage({
        id: editingPage?.id,
        title: formTitle,
        slug: formSlug,
        summary: formSummary,
        blocks: formBlocks,
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        featuredImage: formFeaturedImage,
        publishImmediately,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Page saved successfully!" });
        // Update local list
        const updatedItem: PageItem = {
          id: res.pageId || editingPage?.id || `temp-${Date.now()}`,
          title: formTitle,
          slug: formSlug,
          summary: formSummary || null,
          status: publishImmediately ? "PUBLISHED" : editingPage?.status || "DRAFT",
          structuredData: JSON.stringify(formBlocks),
          metaTitle: formMetaTitle || null,
          metaDescription: formMetaDescription || null,
          featuredImage: formFeaturedImage || null,
          updatedAt: new Date().toISOString(),
          author: editingPage?.author || { id: "me", name: "You", email: null, image: null },
          lastEditedBy: { id: "me", name: "You", email: null },
          publishedBy: publishImmediately ? { id: "me", name: "You", email: null } : editingPage?.publishedBy || null,
          _count: { revisions: (editingPage?._count.revisions || 0) + 1 },
        };

        setPages((prev) => {
          const idx = prev.findIndex((p) => p.id === updatedItem.id || p.slug === updatedItem.slug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });

        setTimeout(() => {
          setIsCreating(false);
          setEditingPage(null);
        }, 1200);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save page." });
      }
    });
  };

  const handleArchive = (page: PageItem) => {
    if (!confirm(`Are you sure you want to archive page "${page.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteCmsPage(page.id);
      if (res.success) {
        setPages((prev) => prev.filter((p) => p.id !== page.id));
      } else {
        alert(res.error || "Failed to archive page.");
      }
    });
  };

  const statusBadge = (status: CmsContentStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge tone="sage" className="gap-1.5"><CheckCircle2 size={12} /> Published</Badge>;
      case "DRAFT":
        return <Badge tone="gray" className="gap-1.5"><Clock size={12} /> Draft</Badge>;
      case "IN_REVIEW":
        return <Badge tone="blue" className="gap-1.5"><Eye size={12} /> In Review</Badge>;
      case "ARCHIVED":
        return <Badge tone="rose" className="gap-1.5"><Archive size={12} /> Archived</Badge>;
      default:
        return <Badge tone="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Pages Management
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create, edit, preview, and publish structured informational pages for ULAB Setu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> Create New Page
          </Button>
        </div>
      </div>

      {/* Editor Modal / Drawer */}
      {isCreating && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingPage ? `Edit Page: ${editingPage.title}` : "Create New Custom Page"}
              </h2>
              <p className="text-xs text-ink-soft">
                Use the structured content block builder below. Zero raw script execution guaranteed.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingPage(null);
              }}
              className="px-3 py-1.5 text-xs"
            >
              Close Editor
            </Button>
          </div>

          {feedback && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Page Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => handleSlugAutoFill(e.target.value)}
                placeholder="e.g. About ULAB Setu"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-mist bg-surface px-3">
                <span className="text-xs font-medium text-ink-soft">/p/</span>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="about-ulab-setu"
                  className="w-full bg-transparent px-1 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Summary / Short Description
              </label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                placeholder="Brief narrative description for page indexing and cards."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                SEO Meta Title
              </label>
              <Input
                value={formMetaTitle}
                onChange={(e) => setFormMetaTitle(e.target.value)}
                placeholder="Page Title · ULAB Setu"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Featured / OpenGraph Image URL
              </label>
              <Input
                value={formFeaturedImage}
                onChange={(e) => setFormFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Block Editor Component */}
          <div className="mt-8 border-t border-mist/70 pt-6">
            <h3 className="font-display text-lg font-bold text-ink">Page Content Blocks</h3>
            <p className="text-xs text-ink-soft">
              Assemble page content using verified visual blocks: Heading, Rich Text, Image, Cards, CTA, FAQs, Testimonials.
            </p>

            <div className="mt-4">
              <BlockEditor blocks={formBlocks} onChange={setFormBlocks} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-mist/70 pt-4">
            <div className="flex items-center gap-2">
              {editingPage && (
                <ButtonLink
                  href={`/admin/cms/preview/${editingPage.id}`}
                  target="_blank"
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Eye size={14} /> Fullscreen Live Preview
                </ButtonLink>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => handleSavePage(false)}
                className="gap-2"
              >
                {isPending && <RefreshCw size={14} className="animate-spin" />}
                Save as Draft
              </Button>

              <Button
                disabled={isPending}
                onClick={() => handleSavePage(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
              >
                {isPending && <RefreshCw size={14} className="animate-spin" />}
                Publish Page Live
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PUBLISHED", "DRAFT", "IN_REVIEW", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === tab
                  ? "bg-ulab text-white shadow-sm"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              {tab === "ALL" ? "All Pages" : tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages by title or slug..."
            className="w-full rounded-xl border border-mist bg-surface py-2 pl-9 pr-4 text-xs text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
          />
        </div>
      </Card>

      {/* Pages Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Title & URL Slug</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Revisions</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <FileText size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No pages found matching your filters.</p>
                    <p className="text-xs">Click &quot;Create New Page&quot; to build your first custom page.</p>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{page.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-ink-soft">/p/{page.slug}</span>
                        {page.status === "PUBLISHED" && (
                          <Link
                            href={`/p/${page.slug}`}
                            target="_blank"
                            className="inline-flex items-center text-xs text-ulab hover:underline"
                          >
                            <ExternalLink size={12} className="ml-1" />
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{statusBadge(page.status)}</td>
                    <td className="px-6 py-4">
                      <Badge tone="gray">v{page._count.revisions || 1}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-soft">
                      {new Date(page.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {page.lastEditedBy?.name && (
                        <div className="text-[11px] text-ink-soft/80">by {page.lastEditedBy.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ButtonLink
                          href={`/admin/cms/preview/${page.id}`}
                          target="_blank"
                          variant="ghost"
                          title="Preview"
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={15} />
                        </ButtonLink>
                        <Button
                          variant="outline"
                          onClick={() => openEditModal(page)}
                          className="h-8 gap-1.5 px-2.5 text-xs"
                        >
                          <Edit3 size={13} /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleArchive(page)}
                          title="Archive"
                          className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

