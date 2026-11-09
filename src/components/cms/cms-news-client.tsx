"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
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
  Tag,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveCmsPhase3Item, deleteCmsPage } from "@/app/actions/cms";
import {
  ANNOUNCEMENT_CATEGORIES,
  CONTENT_AUDIENCES,
  announcementSchema,
  type AnnouncementFormData,
} from "@/lib/cms-phase3-types";
import type { CmsContentStatus } from "@/lib/cms-types";

type AnnouncementItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  tags: string | null;
  priority: number;
  featuredImage: string | null;
  structuredData: string | null;
  status: CmsContentStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: { id: string; name: string | null; email: string | null; role: string } | null;
  lastEditedBy: { id: string; name: string | null; email: string | null } | null;
  publishedBy: { id: string; name: string | null; email: string | null } | null;
  _count: { revisions: number };
};

interface CmsNewsClientProps {
  initialItems: AnnouncementItem[];
  userRole: string;
}

export function CmsNewsClient({ initialItems, userRole }: CmsNewsClientProps) {
  const [items, setItems] = useState<AnnouncementItem[]>(initialItems);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formContentType, setFormContentType] = useState<"NEWS" | "ANNOUNCEMENT">("ANNOUNCEMENT");
  const [formCategory, setFormCategory] = useState<string>(ANNOUNCEMENT_CATEGORIES[0]);
  const [formSummary, setFormSummary] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAudience, setFormAudience] = useState<string>("PUBLIC");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formAttachmentUrl, setFormAttachmentUrl] = useState("");
  const [formRegUrl, setFormRegUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formPriority, setFormPriority] = useState<number>(0);
  const [formNotify, setFormNotify] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesCat && matchesQuery;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormContentType("ANNOUNCEMENT");
    setFormCategory(ANNOUNCEMENT_CATEGORIES[0]);
    setFormSummary("");
    setFormBody("");
    setFormAudience("PUBLIC");
    setFormFeaturedImage("");
    setFormAttachmentUrl("");
    setFormRegUrl("");
    setFormTags("");
    setFormPriority(0);
    setFormNotify(false);
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormContentType("ANNOUNCEMENT");
    setFormCategory(item.category || ANNOUNCEMENT_CATEGORIES[0]);
    setFormSummary(item.summary || "");
    setFormBody(item.body || "");
    setFormFeaturedImage(item.featuredImage || "");
    setFormTags(item.tags || "");
    setFormPriority(item.priority || 0);

    let parsedMeta: any = {};
    if (item.structuredData) {
      try {
        parsedMeta = JSON.parse(item.structuredData);
      } catch {}
    }
    setFormAudience(parsedMeta.targetAudience || "PUBLIC");
    setFormAttachmentUrl(parsedMeta.attachmentUrl || "");
    setFormRegUrl(parsedMeta.registrationUrl || "");
    setFormNotify(false);

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
    const parsed = announcementSchema.safeParse({
      title: formTitle,
      slug: formSlug,
      contentType: formContentType,
      summary: formSummary,
      body: formBody,
      category: formCategory,
      targetAudience: formAudience,
      featuredImage: formFeaturedImage || undefined,
      attachmentUrl: formAttachmentUrl || undefined,
      registrationUrl: formRegUrl || undefined,
      tags: formTags || undefined,
      priority: formPriority,
      notifyUsers: formNotify,
    });

    if (!parsed.success) {
      setFeedback({
        type: "error",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    startTransition(async () => {
      const res = await saveCmsPhase3Item({
        id: editingItem?.id,
        title: formTitle,
        slug: formSlug,
        contentType: formContentType,
        summary: formSummary,
        body: formBody,
        category: formCategory,
        tags: formTags,
        priority: formPriority,
        featuredImage: formFeaturedImage,
        structuredData: {
          targetAudience: formAudience,
          attachmentUrl: formAttachmentUrl,
          registrationUrl: formRegUrl,
        },
        publishImmediately,
        notifyUsers: formNotify,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Saved successfully!" });
        const updatedItem: AnnouncementItem = {
          id: res.itemId || editingItem?.id || `temp-${Date.now()}`,
          title: formTitle,
          slug: formSlug,
          summary: formSummary,
          body: formBody,
          category: formCategory,
          tags: formTags || null,
          priority: formPriority,
          featuredImage: formFeaturedImage || null,
          structuredData: JSON.stringify({
            targetAudience: formAudience,
            attachmentUrl: formAttachmentUrl,
            registrationUrl: formRegUrl,
          }),
          status: publishImmediately ? "PUBLISHED" : editingItem?.status || "DRAFT",
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: editingItem?.author || { id: "me", name: "You", email: null, role: userRole },
          lastEditedBy: { id: "me", name: "You", email: null },
          publishedBy: publishImmediately ? { id: "me", name: "You", email: null } : editingItem?.publishedBy || null,
          _count: { revisions: (editingItem?._count.revisions || 0) + 1 },
        };

        setItems((prev) => {
          const idx = prev.findIndex((i) => i.id === updatedItem.id || i.slug === updatedItem.slug);
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
        }, 1000);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save." });
      }
    });
  };

  const handleArchive = (item: AnnouncementItem) => {
    if (!confirm(`Archive announcement "${item.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteCmsPage(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        alert(res.error || "Failed to archive.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            News & Official Announcements
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Publish official university circulars, scholarships, research calls, and campus advisories with audience targeting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/news"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> Public News Board
          </Link>
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> New Announcement
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingItem ? `Edit: ${editingItem.title}` : "Create Official Announcement / News"}
              </h2>
              <p className="text-xs text-ink-soft">
                Target your announcement to Students, Alumni, Faculty, or the General Public.
              </p>
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
                Announcement Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => handleSlugAutoFill(e.target.value)}
                placeholder="e.g. ULAB VC Scholarship Application Circular Fall 2026"
                className="mt-1.5 text-base font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-mist bg-surface px-3">
                <span className="text-xs font-medium text-ink-soft">/news/</span>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="scholarship-fall-2026"
                  className="w-full bg-transparent px-1 py-2 text-sm text-ink outline-none"
                />
              </div>
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
                {ANNOUNCEMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Display Priority (0-10, Higher = Pinned Top)
              </label>
              <Input
                type="number"
                min={0}
                max={10}
                value={formPriority}
                onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Summary / Lead Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                placeholder="Brief narrative lead visible in announcement cards."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Detailed Content & Circular Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={6}
                placeholder="Provide full announcement instructions, eligibility, deadline, and venue..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Featured Banner Image URL
              </label>
              <Input
                value={formFeaturedImage}
                onChange={(e) => setFormFeaturedImage(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Official PDF / Document Attachment URL
              </label>
              <Input
                value={formAttachmentUrl}
                onChange={(e) => setFormAttachmentUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                External Registration / Action Link (Optional)
              </label>
              <Input
                value={formRegUrl}
                onChange={(e) => setFormRegUrl(e.target.value)}
                placeholder="https://forms.gle/..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Tags (Comma separated)
              </label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="scholarship, fall2026, registrar"
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-mist bg-surface/50 p-4">
              <input
                type="checkbox"
                id="notifyCheckbox"
                checked={formNotify}
                onChange={(e) => setFormNotify(e.target.checked)}
                className="h-4 w-4 rounded text-ulab focus:ring-ulab"
              />
              <label htmlFor="notifyCheckbox" className="text-xs text-ink cursor-pointer">
                <span className="font-semibold block">Send In-App Notification Broadcast</span>
                <span>Send notification bell alert to all target audience users when published live.</span>
              </label>
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
              Save as Draft
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

      {/* Filter and Search */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === tab
                  ? "bg-ulab text-white shadow-sm"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              {tab === "ALL" ? "All Status" : tab}
            </button>
          ))}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-mist bg-surface px-2.5 py-1.5 text-xs font-medium text-ink outline-none"
          >
            <option value="ALL">All Categories</option>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-xl border border-mist bg-surface py-2 pl-9 pr-4 text-xs text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
          />
        </div>
      </Card>

      {/* Announcements Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Title & Category</th>
                <th className="px-6 py-3.5">Audience</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <Bell size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No announcements found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  let audience = "PUBLIC";
                  if (item.structuredData) {
                    try {
                      audience = JSON.parse(item.structuredData).targetAudience || "PUBLIC";
                    } catch {}
                  }

                  return (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge tone="blue">{item.category || "General"}</Badge>
                          <span className="font-mono text-xs text-ink-soft">/news/{item.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone="gray" className="gap-1">
                          <Users size={12} /> {audience}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={item.status === "PUBLISHED" ? "sage" : "gold"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {item.priority > 0 ? (
                          <span className="font-bold text-amber-600">Pinned ({item.priority})</span>
                        ) : (
                          "Normal"
                        )}
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

