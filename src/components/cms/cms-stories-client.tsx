"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveCmsPhase3Item, deleteCmsPage } from "@/app/actions/cms";
import { alumniStorySchema } from "@/lib/cms-phase3-types";
import type { CmsContentStatus } from "@/lib/cms-types";

type StoryItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  featuredImage: string | null;
  priority: number;
  structuredData: string | null;
  status: CmsContentStatus;
};

export function CmsStoriesClient({ initialItems, userRole }: { initialItems: StoryItem[]; userRole: string }) {
  const [items, setItems] = useState<StoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingItem, setEditingItem] = useState<StoryItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formAlumniName, setFormAlumniName] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formLinkedinUrl, setFormLinkedinUrl] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formHasConsent, setFormHasConsent] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    return (
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormAlumniName("");
    setFormBatch("CSE 2018");
    setFormCompany("");
    setFormDesignation("");
    setFormSummary("");
    setFormContent("");
    setFormPhotoUrl("");
    setFormLinkedinUrl("");
    setFormIsFeatured(false);
    setFormHasConsent(false);
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const openEditModal = (item: StoryItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormSummary(item.summary || "");
    setFormContent(item.body || "");
    setFormPhotoUrl(item.featuredImage || "");
    setFormIsFeatured(item.priority > 0);

    let meta: any = {};
    if (item.structuredData) {
      try {
        meta = JSON.parse(item.structuredData);
      } catch {}
    }

    setFormAlumniName(meta.alumniName || "");
    setFormBatch(meta.graduationBatch || "");
    setFormCompany(meta.currentCompany || "");
    setFormDesignation(meta.currentDesignation || "");
    setFormLinkedinUrl(meta.linkedinUrl || "");
    setFormHasConsent(meta.hasConsent || false);

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
    const parsed = alumniStorySchema.safeParse({
      title: formTitle,
      slug: formSlug,
      alumniName: formAlumniName,
      graduationBatch: formBatch,
      currentCompany: formCompany,
      currentDesignation: formDesignation,
      summary: formSummary,
      storyContent: formContent,
      approvedPhotoUrl: formPhotoUrl || undefined,
      linkedinUrl: formLinkedinUrl || undefined,
      isFeatured: formIsFeatured,
      hasConsent: formHasConsent,
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
        alumniName: formAlumniName,
        graduationBatch: formBatch,
        currentCompany: formCompany,
        currentDesignation: formDesignation,
        linkedinUrl: formLinkedinUrl,
        isFeatured: formIsFeatured,
        hasConsent: formHasConsent,
      };

      const res = await saveCmsPhase3Item({
        id: editingItem?.id,
        title: formTitle,
        slug: formSlug,
        contentType: "ALUMNI_STORY",
        summary: formSummary,
        body: formContent,
        priority: formIsFeatured ? 1 : 0,
        featuredImage: formPhotoUrl,
        structuredData,
        publishImmediately,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Story saved!" });
        const updatedItem: StoryItem = {
          id: res.itemId || editingItem?.id || `temp-${Date.now()}`,
          title: formTitle,
          slug: formSlug,
          summary: formSummary,
          body: formContent,
          priority: formIsFeatured ? 1 : 0,
          featuredImage: formPhotoUrl || null,
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
        setFeedback({ type: "error", message: res.error || "Failed to save story." });
      }
    });
  };

  const handleArchive = (item: StoryItem) => {
    if (!confirm(`Delete story "${item.title}"?`)) return;

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
            Alumni Stories & Testimonials
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Highlight verified ULAB alumni career journeys and inspirational experiences with strict privacy consent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/stories"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> Public Stories
          </Link>
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> New Alumni Story
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingItem ? "Edit Alumni Story" : "Create Alumni Career Story"}
              </h2>
              <p className="text-xs text-ink-soft">
                Showcase how a graduate transitioned from campus classes to industry leadership.
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
                Story Title / Headline <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => handleSlugAutoFill(e.target.value)}
                placeholder="e.g. From ULAB CSE Lab to Tech Lead at Delivery Hero"
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
                placeholder="tech-lead-journey"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Alumni Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formAlumniName}
                onChange={(e) => setFormAlumniName(e.target.value)}
                placeholder="e.g. Tanvir Hasan"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Department & Batch
              </label>
              <Input
                value={formBatch}
                onChange={(e) => setFormBatch(e.target.value)}
                placeholder="CSE, Batch 2018"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Current Employer / Company <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="e.g. Brain Station 23 / Shohoz"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Current Job Title / Designation <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                LinkedIn Profile URL
              </label>
              <Input
                value={formLinkedinUrl}
                onChange={(e) => setFormLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Brief Quote / Spotlight Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                placeholder="Catchy quotation or key career milestone highlight..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Full Narrative Journey <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                placeholder="Describe campus memories, key faculty influences, early career obstacles, and advice for juniors..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Approved Photo URL
              </label>
              <Input
                value={formPhotoUrl}
                onChange={(e) => setFormPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div className="flex flex-col gap-3 justify-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded text-ulab focus:ring-ulab"
                />
                <label htmlFor="featuredCheck" className="text-xs font-semibold text-ink cursor-pointer">
                  Pin as Featured Story on Homepage
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={formHasConsent}
                  onChange={(e) => setFormHasConsent(e.target.checked)}
                  className="h-4 w-4 rounded text-ulab focus:ring-ulab"
                />
                <label htmlFor="consentCheck" className="text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
                  Mandatory Consent: Alumnus gave explicit permission to publish their career story publicly.
                </label>
              </div>
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

      {/* Stories Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Alumnus & Story Title</th>
                <th className="px-6 py-3.5">Current Role</th>
                <th className="px-6 py-3.5">Featured</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <Sparkles size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No alumni stories found.</p>
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
                        <div className="text-xs text-ink-soft mt-0.5">
                          {meta.alumniName} ({meta.graduationBatch || "Alumni"})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-ink">{meta.currentDesignation || "Professional"}</div>
                        <div className="text-ink-soft">{meta.currentCompany || "Company"}</div>
                      </td>
                      <td className="px-6 py-4">
                        {item.priority > 0 ? (
                          <Badge tone="gold">Featured</Badge>
                        ) : (
                          <span className="text-xs text-ink-soft">Standard</span>
                        )}
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

