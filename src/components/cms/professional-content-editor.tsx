"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Eye,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Send,
  Save,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { BlockEditor } from "./block-editor";
import { CmsMediaManagerClient, type MediaAsset } from "./cms-media-manager-client";
import type { CmsBlock } from "@/lib/cms-blocks";
import type { CmsContentStatus } from "@/lib/cms-types";

export interface ProfessionalEditorProps {
  initialTitle?: string;
  initialSlug?: string;
  initialSummary?: string;
  initialBody?: string;
  initialBlocks?: CmsBlock[];
  initialCategory?: string;
  initialStatus?: CmsContentStatus;
  availableCategories?: string[];
  contentTypeLabel?: string;
  onSaveDraft: (data: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    blocks: CmsBlock[];
    category: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onPublish?: (data: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    blocks: CmsBlock[];
    category: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onSubmitForReview?: (data: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    blocks: CmsBlock[];
    category: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function ProfessionalContentEditor({
  initialTitle = "",
  initialSlug = "",
  initialSummary = "",
  initialBody = "",
  initialBlocks = [],
  initialCategory = "General",
  initialStatus = "DRAFT",
  availableCategories = ["General", "Official Notice", "Career", "Academic"],
  contentTypeLabel = "Content",
  onSaveDraft,
  onPublish,
  onSubmitForReview,
}: ProfessionalEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [summary, setSummary] = useState(initialSummary);
  const [body, setBody] = useState(initialBody);
  const [blocks, setBlocks] = useState<CmsBlock[]>(initialBlocks);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState<CmsContentStatus>(initialStatus);

  // Editor modes: narrative markdown/rich copy vs structured block builder
  const [editorMode, setEditorMode] = useState<"narrative" | "blocks" | "preview">("narrative");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Autosave states
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Word & character counts
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
    setAutosaveStatus("unsaved");
  };

  // Text formatting insertion helpers
  const applyFormat = (prefix: string, suffix: string = "") => {
    const el = bodyTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const nextBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(nextBody);
    setAutosaveStatus("unsaved");
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Debounced Autosave (saves draft after 3 seconds of inactivity)
  useEffect(() => {
    if (autosaveStatus !== "unsaved" || !title.trim()) return;

    const timer = setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        const res = await onSaveDraft({ title, slug, summary, body, blocks, category });
        if (res.success) {
          setAutosaveStatus("saved");
          setLastSavedAt(new Date().toLocaleTimeString());
        } else {
          setAutosaveStatus("error");
        }
      } catch {
        setAutosaveStatus("error");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, slug, summary, body, blocks, category, autosaveStatus, onSaveDraft]);

  // Insert image from Media Library into body
  const handleInsertMedia = (asset: MediaAsset) => {
    const mdImage = `\n![${asset.altText || asset.title}](${asset.url})\n`;
    setBody((prev) => prev + mdImage);
    setIsMediaPickerOpen(false);
    setAutosaveStatus("unsaved");
  };

  const handleManualSave = () => {
    startTransition(async () => {
      setAutosaveStatus("saving");
      const res = await onSaveDraft({ title, slug, summary, body, blocks, category });
      if (res.success) {
        setAutosaveStatus("saved");
        setLastSavedAt(new Date().toLocaleTimeString());
      } else {
        setAutosaveStatus("error");
        alert(res.error || "Save failed.");
      }
    });
  };

  const handlePublish = () => {
    if (!onPublish) return;
    startTransition(async () => {
      const res = await onPublish({ title, slug, summary, body, blocks, category });
      if (res.success) {
        setStatus("PUBLISHED");
        setAutosaveStatus("saved");
        alert("Published live to production website!");
      } else {
        alert(res.error || "Publication failed.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mist/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">
              Professional Editor · {contentTypeLabel}
            </h1>
            <Badge tone={status === "PUBLISHED" ? "sage" : "gold"}>{status}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
            {autosaveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Cloud size={13} /> Saved {lastSavedAt ? `at ${lastSavedAt}` : ""}
              </span>
            )}
            {autosaveStatus === "saving" && (
              <span className="flex items-center gap-1 text-ulab">
                <RefreshCw size={13} className="animate-spin" /> Autosaving draft...
              </span>
            )}
            {autosaveStatus === "unsaved" && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock size={13} /> Unsaved edits
              </span>
            )}
            {autosaveStatus === "error" && (
              <span className="flex items-center gap-1 text-rose-600">
                <CloudOff size={13} /> Autosave failed (Offline)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleManualSave} disabled={isPending} className="gap-1.5 text-xs px-3">
            <Save size={14} /> Save Draft
          </Button>

          {onPublish && (
            <Button
              onClick={handlePublish}
              disabled={isPending}
              className="gap-1.5 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Sparkles size={14} /> Publish Live
            </Button>
          )}
        </div>
      </div>

      {/* Editor Layout: Main Work Canvas + Right Control Rail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main Canvas */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & Slug */}
          <Card className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Document Title
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter compelling headline..."
                className="mt-1 text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                URL Identifier / Slug
              </label>
              <div className="mt-1 flex items-center rounded-xl border border-mist bg-surface px-3">
                <span className="text-xs text-ink-soft font-mono">/content/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutosaveStatus("unsaved");
                  }}
                  className="w-full bg-transparent px-1 py-2 text-xs font-mono text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Executive Summary / Excerpt
              </label>
              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setAutosaveStatus("unsaved");
                }}
                rows={2}
                placeholder="Brief lead paragraph for cards, search engines, and social media..."
                className="mt-1 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink outline-none"
              />
            </div>
          </Card>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-mist/70 pb-2">
            <button
              onClick={() => setEditorMode("narrative")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editorMode === "narrative" ? "bg-ulab text-white shadow-sm" : "bg-surface text-ink-soft hover:text-ink"
              }`}
            >
              Narrative Copy
            </button>
            <button
              onClick={() => setEditorMode("blocks")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editorMode === "blocks" ? "bg-ulab text-white shadow-sm" : "bg-surface text-ink-soft hover:text-ink"
              }`}
            >
              <Layers size={13} /> Visual Block Builder ({blocks.length})
            </button>
            <button
              onClick={() => setEditorMode("preview")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editorMode === "preview" ? "bg-ulab text-white shadow-sm" : "bg-surface text-ink-soft hover:text-ink"
              }`}
            >
              <Eye size={13} /> Live Preview
            </button>
          </div>

          {/* Canvas Mode 1: Narrative Copy with Formatting Bar */}
          {editorMode === "narrative" && (
            <Card className="p-0 overflow-hidden">
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-mist bg-surface/60 p-2">
                <button
                  type="button"
                  onClick={() => applyFormat("**", "**")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Bold"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("*", "*")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Italic"
                >
                  <Italic size={15} />
                </button>
                <div className="h-4 w-px bg-mist mx-1" />
                <button
                  type="button"
                  onClick={() => applyFormat("## ")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Heading 2"
                >
                  <Heading2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("### ")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Heading 3"
                >
                  <Heading3 size={15} />
                </button>
                <div className="h-4 w-px bg-mist mx-1" />
                <button
                  type="button"
                  onClick={() => applyFormat("- ")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Bulleted List"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("1. ")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Numbered List"
                >
                  <ListOrdered size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("> ")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Quote"
                >
                  <Quote size={15} />
                </button>
                <div className="h-4 w-px bg-mist mx-1" />
                <button
                  type="button"
                  onClick={() => applyFormat("[Link Label](", ")")}
                  className="p-1.5 rounded hover:bg-mist/50 text-ink-soft hover:text-ink"
                  title="Insert Link"
                >
                  <LinkIcon size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex items-center gap-1 rounded bg-sky/50 px-2 py-1 text-xs font-semibold text-ulab hover:bg-mist"
                  title="Embed from Media Library"
                >
                  <ImageIcon size={14} /> Insert Media
                </button>
              </div>

              {/* Text Writing Area */}
              <textarea
                ref={bodyTextareaRef}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setAutosaveStatus("unsaved");
                }}
                rows={14}
                placeholder="Draft your story or copy here. Standard Markdown formatting supported..."
                className="w-full bg-paper p-5 text-sm text-ink outline-none leading-relaxed font-sans resize-y"
              />

              {/* Word Count Bar */}
              <div className="flex items-center justify-between border-t border-mist/60 bg-surface/40 px-4 py-2 text-[11px] text-ink-soft">
                <span>Markdown Syntax Enabled · Safe HTML entity escaping</span>
                <span>
                  {wordCount} words · {charCount} characters
                </span>
              </div>
            </Card>
          )}

          {/* Canvas Mode 2: Block Builder */}
          {editorMode === "blocks" && (
            <Card className="p-5">
              <BlockEditor
                blocks={blocks}
                onChange={(updated) => {
                  setBlocks(updated);
                  setAutosaveStatus("unsaved");
                }}
              />
            </Card>
          )}

          {/* Canvas Mode 3: Live Preview */}
          {editorMode === "preview" && (
            <Card className="p-6 prose prose-slate max-w-none">
              <h1 className="font-display text-2xl font-bold text-ink">{title || "Untitled Content"}</h1>
              {summary && <p className="text-base text-ink-soft italic border-l-2 border-ulab pl-3">{summary}</p>}
              <div className="mt-4 whitespace-pre-line text-sm text-ink leading-relaxed">
                {body || "No body copy drafted yet."}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Editorial Sidebar Controls */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink border-b border-mist/70 pb-2">
              Publication Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setAutosaveStatus("unsaved");
                }}
                className="mt-1 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink outline-none"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Current Status
              </label>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={status === "PUBLISHED" ? "sage" : "gold"}>{status}</Badge>
              </div>
            </div>

            <div className="border-t border-mist/70 pt-4 space-y-2">
              {onSubmitForReview && status === "DRAFT" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    startTransition(async () => {
                      const res = await onSubmitForReview({ title, slug, summary, body, blocks, category });
                      if (res.success) {
                        setStatus("IN_REVIEW");
                        alert("Submitted to Reviewer approval queue!");
                      }
                    });
                  }}
                  className="w-full text-xs gap-1.5"
                >
                  <Send size={13} /> Submit for Editorial Review
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-paper rounded-2xl p-6 shadow-lift border border-mist">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3 mb-4">
              <h3 className="font-display text-lg font-bold text-ink">Choose Media Asset to Insert</h3>
              <button onClick={() => setIsMediaPickerOpen(false)} className="text-ink-soft hover:text-ink">
                ✕
              </button>
            </div>
            <CmsMediaManagerClient
              initialItems={[]}
              totalCount={0}
              userRole="CONTENT_EDITOR"
              selectionMode={true}
              onSelectAsset={handleInsertMedia}
            />
          </div>
        </div>
      )}
    </div>
  );
}

