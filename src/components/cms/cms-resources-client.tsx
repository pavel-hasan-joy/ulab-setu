"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveCmsPhase3Item, deleteCmsPage } from "@/app/actions/cms";
import {
  RESOURCE_CATEGORIES,
  CONTENT_AUDIENCES,
  resourceSchema,
} from "@/lib/cms-phase3-types";
import type { CmsContentStatus } from "@/lib/cms-types";

type ResourceItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  tags: string | null;
  featuredImage: string | null;
  structuredData: string | null;
  status: CmsContentStatus;
};

export function CmsResourcesClient({ initialItems, userRole }: { initialItems: ResourceItem[]; userRole: string }) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<string>(RESOURCE_CATEGORIES[0]);
  const [formSummary, setFormSummary] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileType, setFormFileType] = useState("PDF Document");
  const [formAuthor, setFormAuthor] = useState("ULAB Career Services");
  const [formAudience, setFormAudience] = useState<string>("PUBLIC");
  const [formTags, setFormTags] = useState("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategory(RESOURCE_CATEGORIES[0]);
    setFormSummary("");
    setFormBody("");
    setFormCoverImage("");
    setFormFileUrl("");
    setFormFileType("PDF Document");
    setFormAuthor("ULAB Career Services & Alumni Affairs");
    setFormAudience("PUBLIC");
    setFormTags("");
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const openEditModal = (item: ResourceItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormCategory(item.category || RESOURCE_CATEGORIES[0]);
    setFormSummary(item.summary || "");
    setFormBody(item.body || "");
    setFormCoverImage(item.featuredImage || "");
    setFormTags(item.tags || "");

    let meta: any = {};
    if (item.structuredData) {
      try {
        meta = JSON.parse(item.structuredData);
      } catch {}
    }

    setFormFileUrl(meta.fileUrl || "");
    setFormFileType(meta.fileType || "PDF Document");
    setFormAuthor(meta.authorOrSource || "ULAB");
    setFormAudience(meta.targetAudience || "PUBLIC");

    setIsEditorOpen(true);
    setFeedback(null);
  };

  const handleSlugAutoFill = (title: string) => {
    setFormTitle(title);
    if (!editingItem) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated);
    }
  };

  const handleSave = (publishImmediately: boolean) => {
    const parsed = resourceSchema.safeParse({
      title: formTitle,
      slug: formSlug,
      summary: formSummary,
      body: formBody,
      category: formCategory,
      coverImage: formCoverImage || undefined,
      fileUrl: formFileUrl,
      fileType: formFileType,
      authorOrSource: formAuthor,
      targetAudience: formAudience,
      tags: formTags || undefined,
    });

    if (!parsed.success) {
      setFeedback({
        type: "error",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    startTransition(async () => {
      const structuredData = {
        fileUrl: formFileUrl,
        fileType: formFileType,
        authorOrSource: formAuthor,
        targetAudience: formAudience,
      };

      const res = await saveCmsPhase3Item({
        id: editingItem?.id,
        title: formTitle,
        slug: formSlug,
        contentType: "RESOURCE",
        summary: formSummary,
        body: formBody,
        category: formCategory,
        tags: formTags,
        featuredImage: formCoverImage,
        structuredData,
        publishImmediately,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Resource saved!" });
        const updatedItem: ResourceItem = {
          id: res.itemId || editingItem?.id || `temp-${Date.now()}`,
          title: formTitle,
          slug: formSlug,
          summary: formSummary,
          body: formBody,
          category: formCategory,
          tags: formTags || null,
          featuredImage: formCoverImage || null,
          structuredData: JSON.stringify(structuredData),
          status: publishImmediately ? "PUBLISHED" : editingItem?.status || "DRAFT",
        };

        setItems((prev) => {
          const idx = prev.findIndex((i) => i.id === updatedItem.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });

        setTimeout(() => {
          setIsEditorOpen(false);
          setEditingItem(null);
        }, 800);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save resource." });
      }
    });
  };

  const handleArchive = (item: ResourceItem) => {
    if (!confirm(`Delete resource "${item.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteCmsPage(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        alert(res.error || "Failed to delete.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Resource Library & Guides
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Manage CV templates, interview preparation kits, research guides, and career development documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/resources"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> Public Resources
          </Link>
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> New Resource
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingItem ? "Edit Resource Item" : "Create Career or Academic Resource"}
              </h2>
              <p className="text-xs text-ink-soft">Attach approved downloadable PDFs or links with audience visibility rules.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditorOpen(false);
                setEditingItem(null);
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
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Resource Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => handleSlugAutoFill(e.target.value)}
                placeholder="e.g. Standard ULAB Tech CV Format & Guidelines (2026 Edition)"
                className="mt-1.5 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="tech-cv-format-2026"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Author / Source Organization <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. ULAB Career Services / CSE Department"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <select
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              >
                {CONTENT_AUDIENCES.map((a) => (
                  <option key={a} value={a}>{a} Only</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Short Overview / Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                placeholder="Brief summary of what students will learn from this document..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Detailed Guide Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={5}
                placeholder="Instructions on how to utilize this template or guide..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                File / Document Download URL <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formFileUrl}
                onChange={(e) => setFormFileUrl(e.target.value)}
                placeholder="https://.../document.pdf"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Format / File Type
              </label>
              <Input
                value={formFileType}
                onChange={(e) => setFormFileType(e.target.value)}
                placeholder="PDF Document, Excel Sheet, ZIP"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Cover / Preview Image URL
              </label>
              <Input
                value={formCoverImage}
                onChange={(e) => setFormCoverImage(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Tags
              </label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="resume, interview, tech"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-mist/70 pt-4">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="gap-2"
            >
              {isPending && <RefreshCw size={14} className="animate-spin" />}
              Save Draft
            </Button>
            <Button
              disabled={isPending}
              onClick={() => handleSave(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
            >
              {isPending && <RefreshCw size={14} className="animate-spin" />}
              Publish Live
            </Button>
          </div>
        </Card>
      )}

      {/* Resource Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Resource & Category</th>
                <th className="px-6 py-3.5">Source & Format</th>
                <th className="px-6 py-3.5">Audience</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <BookOpen size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No resources found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  let meta: any = {};
                  if (item.structuredData) {
                    try {
                      meta = JSON.parse(item.structuredData);
                    } catch {}
                  }

                  return (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <Badge tone="blue" className="mt-1">{item.category}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-ink">{meta.authorOrSource || "ULAB"}</div>
                        <div className="text-ink-soft flex items-center gap-1 mt-0.5">
                          <FileText size={12} /> {meta.fileType || "PDF"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-ink-soft">{meta.targetAudience || "PUBLIC"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={item.status === "PUBLISHED" ? "sage" : "gold"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openEditModal(item)}
                            className="h-8 gap-1.5 px-2.5 text-xs"
                          >
                            <Edit3 size={13} /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleArchive(item)}
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

