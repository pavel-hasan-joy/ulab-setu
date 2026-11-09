"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Video,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveCmsPhase3Item, deleteCmsPage } from "@/app/actions/cms";
import {
  EVENT_CATEGORIES,
  CONTENT_AUDIENCES,
  eventSchema,
  getDerivedEventState,
  type EventFormData,
} from "@/lib/cms-phase3-types";
import type { CmsContentStatus } from "@/lib/cms-types";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  priority: number;
  featuredImage: string | null;
  structuredData: string | null;
  status: CmsContentStatus;
  createdAt: string | Date;
  author: { id: string; name: string | null; role: string } | null;
  _count: { revisions: number };
};

export function CmsEventsClient({ initialItems, userRole }: { initialItems: EventItem[]; userRole: string }) {
  const [items, setItems] = useState<EventItem[]>(initialItems);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [formSummary, setFormSummary] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAudience, setFormAudience] = useState<string>("PUBLIC");
  const [formPosterImage, setFormPosterImage] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStartTime, setFormStartTime] = useState("10:00 AM");
  const [formEndTime, setFormEndTime] = useState("04:00 PM");
  const [formVenue, setFormVenue] = useState("ULAB Main Campus, Beribadh, Dhaka");
  const [formMeetingUrl, setFormMeetingUrl] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("ULAB Career Services");
  const [formRegUrl, setFormRegUrl] = useState("");
  const [formRegDeadline, setFormRegDeadline] = useState("");
  const [formPriority, setFormPriority] = useState<number>(0);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategory(EVENT_CATEGORIES[0]);
    setFormSummary("");
    setFormBody("");
    setFormAudience("PUBLIC");
    setFormPosterImage("");
    const today = new Date().toISOString().split("T")[0];
    setFormStartDate(today);
    setFormEndDate(today);
    setFormStartTime("10:00 AM");
    setFormEndTime("04:00 PM");
    setFormVenue("ULAB Main Campus, Auditorium");
    setFormMeetingUrl("");
    setFormOrganizer("ULAB Career Services & Alumni Affairs");
    setFormRegUrl("");
    setFormRegDeadline("");
    setFormPriority(0);
    setIsEditorOpen(true);
    setFeedback(null);
  };

  const openEditModal = (item: EventItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormCategory(item.category || EVENT_CATEGORIES[0]);
    setFormSummary(item.summary || "");
    setFormBody(item.body || "");
    setFormPosterImage(item.featuredImage || "");
    setFormPriority(item.priority || 0);

    let meta: any = {};
    if (item.structuredData) {
      try {
        meta = JSON.parse(item.structuredData);
      } catch {}
    }

    setFormAudience(meta.targetAudience || "PUBLIC");
    setFormStartDate(meta.startDate || new Date().toISOString().split("T")[0]);
    setFormEndDate(meta.endDate || new Date().toISOString().split("T")[0]);
    setFormStartTime(meta.startTime || "10:00 AM");
    setFormEndTime(meta.endTime || "04:00 PM");
    setFormVenue(meta.venue || "ULAB Main Campus");
    setFormMeetingUrl(meta.meetingUrl || "");
    setFormOrganizer(meta.organizer || "ULAB");
    setFormRegUrl(meta.registrationUrl || "");
    setFormRegDeadline(meta.registrationDeadline || "");

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
    const parsed = eventSchema.safeParse({
      title: formTitle,
      slug: formSlug,
      summary: formSummary,
      body: formBody,
      category: formCategory,
      targetAudience: formAudience,
      posterImage: formPosterImage || undefined,
      startDate: formStartDate,
      endDate: formEndDate,
      startTime: formStartTime,
      endTime: formEndTime,
      timeZone: "Asia/Dhaka",
      venue: formVenue,
      meetingUrl: formMeetingUrl || undefined,
      organizer: formOrganizer,
      registrationUrl: formRegUrl || undefined,
      registrationDeadline: formRegDeadline || undefined,
      priority: formPriority,
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
        targetAudience: formAudience,
        startDate: formStartDate,
        endDate: formEndDate,
        startTime: formStartTime,
        endTime: formEndTime,
        timeZone: "Asia/Dhaka",
        venue: formVenue,
        meetingUrl: formMeetingUrl,
        organizer: formOrganizer,
        registrationUrl: formRegUrl,
        registrationDeadline: formRegDeadline,
      };

      const res = await saveCmsPhase3Item({
        id: editingItem?.id,
        title: formTitle,
        slug: formSlug,
        contentType: "EVENT",
        summary: formSummary,
        body: formBody,
        category: formCategory,
        priority: formPriority,
        featuredImage: formPosterImage,
        structuredData,
        publishImmediately,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Event saved!" });
        const updatedItem: EventItem = {
          id: res.itemId || editingItem?.id || `temp-${Date.now()}`,
          title: formTitle,
          slug: formSlug,
          summary: formSummary,
          body: formBody,
          category: formCategory,
          priority: formPriority,
          featuredImage: formPosterImage || null,
          structuredData: JSON.stringify(structuredData),
          status: publishImmediately ? "PUBLISHED" : editingItem?.status || "DRAFT",
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          author: editingItem?.author || { id: "me", name: "You", role: userRole },
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
        setFeedback({ type: "error", message: res.error || "Failed to save event." });
      }
    });
  };

  const handleArchive = (item: EventItem) => {
    if (!confirm(`Archive event "${item.title}"?`)) return;

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
            Institutional Campus Events
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Manage Career Fairs, Workshops, Reunions, Seminars, and Hackathons with Asia/Dhaka schedule integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/events"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> Public Events Page
          </Link>
          <Button onClick={openCreateModal} className="gap-2 shadow-soft">
            <Plus size={16} /> New Campus Event
          </Button>
        </div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {editingItem ? `Edit: ${editingItem.title}` : "Create New Campus Event"}
              </h2>
              <p className="text-xs text-ink-soft">All event dates and timings enforce Asia/Dhaka local timezone.</p>
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
                Event Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => handleSlugAutoFill(e.target.value)}
                placeholder="e.g. ULAB National Tech Fest & Career Fair 2026"
                className="mt-1.5 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-mist bg-surface px-3">
                <span className="text-xs font-medium text-ink-soft">/events/</span>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="tech-fest-2026"
                  className="w-full bg-transparent px-1 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Event Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Dates & Times */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Start Date (Asia/Dhaka) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                End Date (Asia/Dhaka) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Daily Timing (Start - End)
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <Input
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  placeholder="10:00 AM"
                />
                <Input
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  placeholder="04:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Campus Venue / Location <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                placeholder="Auditorium, Permanent Campus, Beribadh"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Host / Organizing Department <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formOrganizer}
                onChange={(e) => setFormOrganizer(e.target.value)}
                placeholder="Department of CSE & ULAB Career Services"
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
                Summary / Teaser Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                rows={2}
                placeholder="Short teaser description shown on calendar cards."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Detailed Event Description & Schedule <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={6}
                placeholder="Keynote speakers, workshop topics, participation requirements..."
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Poster Image URL
              </label>
              <Input
                value={formPosterImage}
                onChange={(e) => setFormPosterImage(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Registration / RSVP Form URL
              </label>
              <Input
                value={formRegUrl}
                onChange={(e) => setFormRegUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Online Meeting Link (If virtual or hybrid)
              </label>
              <Input
                value={formMeetingUrl}
                onChange={(e) => setFormMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Display Priority (0-10)
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

      {/* Events Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-6 py-3.5">Event & Category</th>
                <th className="px-6 py-3.5">Schedule & Venue</th>
                <th className="px-6 py-3.5">Lifecycle State</th>
                <th className="px-6 py-3.5">Audience</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60 bg-paper">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <Calendar size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="font-medium">No events found.</p>
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

                  const derivedState = getDerivedEventState(
                    meta.startDate || new Date().toISOString(),
                    meta.endDate || new Date().toISOString(),
                    item.status
                  );

                  return (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{item.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge tone="blue">{item.category || "Event"}</Badge>
                          <span className="font-mono text-xs text-ink-soft">/events/{item.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <Calendar size={13} className="text-ulab" />
                          <span>{meta.startDate} {meta.startTime ? `(${meta.startTime})` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-ink-soft mt-1">
                          <MapPin size={13} />
                          <span>{meta.venue || "Campus"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          tone={
                            derivedState === "UPCOMING"
                              ? "blue"
                              : derivedState === "ONGOING"
                              ? "sage"
                              : derivedState === "COMPLETED"
                              ? "gray"
                              : "rose"
                          }
                        >
                          {derivedState}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-ink-soft">{meta.targetAudience || "PUBLIC"}</span>
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

