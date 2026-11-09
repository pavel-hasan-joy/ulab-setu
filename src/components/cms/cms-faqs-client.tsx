"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveCmsPhase3Item, deleteCmsPage } from "@/app/actions/cms";
import { FAQ_CATEGORIES, faqSchema } from "@/lib/cms-phase3-types";
import type { CmsContentStatus } from "@/lib/cms-types";

type FaqItem = {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  category: string | null;
  priority: number;
  status: CmsContentStatus;
};

export function CmsFaqsClient({ initialItems, userRole }: { initialItems: FaqItem[]; userRole: string }) {
  const [items, setItems] = useState<FaqItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Form Fields
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState<string>(FAQ_CATEGORIES[0]);
  const [formOrder, setFormOrder] = useState<number>(0);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.body && item.body.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory(FAQ_CATEGORIES[0]);
    setFormOrder(items.length + 1);
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const openEditModal = (item: FaqItem) => {
    setEditingItem(item);
    setFormQuestion(item.title);
    setFormAnswer(item.body || "");
    setFormCategory(item.category || FAQ_CATEGORIES[0]);
    setFormOrder(item.priority || 0);
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const handleSave = (publishImmediately: boolean) => {
    const parsed = faqSchema.safeParse({
      question: formQuestion,
      answer: formAnswer,
      category: formCategory,
      displayOrder: formOrder,
    });

    if (!parsed.success) {
      setFeedback({
        type: "error",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    startTransition(async () => {
      const slug = `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const res = await saveCmsPhase3Item({
        id: editingItem?.id,
        title: formQuestion,
        slug: editingItem?.slug || slug,
        contentType: "FAQ",
        summary: formQuestion,
        body: formAnswer,
        category: formCategory,
        priority: formOrder,
        publishImmediately,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "FAQ saved!" });
        const updatedItem: FaqItem = {
          id: res.itemId || editingItem?.id || `temp-${Date.now()}`,
          title: formQuestion,
          slug: editingItem?.slug || slug,
          body: formAnswer,
          category: formCategory,
          priority: formOrder,
          status: publishImmediately ? "PUBLISHED" : editingItem?.status || "DRAFT",
        };

        setItems((prev) => {
          const idx = prev.findIndex((i) => i.id === updatedItem.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedItem;
            return next;
          }
          return [...prev, updatedItem];
        });

        setTimeout(() => {
          setIsEditorOpen(false);
          setEditingItem(null);
        }, 800);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save FAQ." });
      }
    });
  };

  const handleArchive = (item: FaqItem) => {
    if (!confirm(`Delete FAQ "${item.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteCmsPage(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        alert(res.error || "Failed to delete FAQ.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Frequently Asked Questions (FAQ)
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Manage categorical questions and answers displayed in clean accordions across the student portal and public site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/faqs"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> Public FAQ Page
          </Link>
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> New Question
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingItem ? "Edit FAQ Item" : "Create New FAQ"}
              </h2>
              <p className="text-xs text-ink-soft">Draft FAQs are kept hidden from public visitors until published.</p>
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

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Question <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="e.g. How does automated alumni verification work?"
                className="mt-1.5 font-semibold"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
                >
                  {FAQ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Authoritative Answer <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                rows={5}
                placeholder="Clear and detailed answer for students and alumni..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
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

      {/* FAQ Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Question & Answer Preview</th>
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <HelpCircle size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No FAQ questions found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge tone="blue">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{item.title}</div>
                      <p className="line-clamp-1 text-xs text-ink-soft mt-0.5">{item.body}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{item.priority}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

