"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Heading,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Grid,
  Sparkles,
  HelpCircle,
  Quote,
  Calendar,
  Eye,
  Edit3,
} from "lucide-react";
import {
  type CmsBlock,
  type CmsBlockType,
  CMS_BLOCK_TYPES,
  CMS_BLOCK_TYPE_META,
} from "@/lib/cms-blocks";
import { CmsBlocksRenderer } from "./cms-blocks-renderer";
import { cn } from "@/components/ui";

const BLOCK_ICONS: Record<CmsBlockType, React.ComponentType<{ size?: number }>> = {
  heading: Heading,
  richText: FileText,
  image: ImageIcon,
  imageWithText: LayoutTemplate,
  featureCards: Grid,
  cta: Sparkles,
  faqAccordion: HelpCircle,
  testimonial: Quote,
  eventPreview: Calendar,
};

type BlockEditorProps = {
  blocks: CmsBlock[];
  onChange: (updated: CmsBlock[]) => void;
};

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(
    blocks[0]?.id || null
  );

  const addBlock = (type: CmsBlockType) => {
    const id = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let newBlock: CmsBlock;

    switch (type) {
      case "heading":
        newBlock = {
          id,
          type: "heading",
          level: "h2",
          text: "New Section Heading",
          subtitle: "Optional Subtitle",
          alignment: "left",
        };
        break;
      case "richText":
        newBlock = {
          id,
          type: "richText",
          body: "Enter your informative paragraph copy here. You can separate paragraphs with double newlines.",
          isLead: false,
        };
        break;
      case "image":
        newBlock = {
          id,
          type: "image",
          url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
          altText: "Campus photography",
          caption: "University campus life",
          aspectRatio: "wide",
        };
        break;
      case "imageWithText":
        newBlock = {
          id,
          type: "imageWithText",
          imageUrl:
            "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
          altText: "Students collaborating",
          heading: "Connect with Your Alumni Network",
          body: "Direct access to thousands of verified graduates leading innovation across multinational enterprises and emerging startups.",
          layout: "image-left",
          ctaText: "Discover Mentors",
          ctaLink: "/student/mentors",
        };
        break;
      case "featureCards":
        newBlock = {
          id,
          type: "featureCards",
          title: "Platform Capabilities",
          subtitle: "Designed for the entire ULAB community",
          cards: [
            {
              icon: "Users",
              title: "Verified Community",
              description: "Connect exclusively with authenticated ULAB students, alumni, and professors.",
              badge: "Trusted",
            },
            {
              icon: "Briefcase",
              title: "Campus Job Board",
              description: "Exclusive recruitment openings and employee referrals directly from seniors.",
              badge: "Careers",
            },
            {
              icon: "ShieldCheck",
              title: "1-on-1 Mentorship",
              description: "Book guidance sessions for career transitions, resume reviews, and research advice.",
              badge: "Guidance",
            },
          ],
        };
        break;
      case "cta":
        newBlock = {
          id,
          type: "cta",
          title: "Ready to Bridge Academia & Industry?",
          description: "Sign in with your official @ulab.edu.bd email and unlock exclusive career networks.",
          primaryLabel: "Get Started Now",
          primaryUrl: "/signup",
          secondaryLabel: "Learn More",
          secondaryUrl: "/p/how-it-works",
          tone: "navy",
        };
        break;
      case "faqAccordion":
        newBlock = {
          id,
          type: "faqAccordion",
          title: "Frequently Asked Questions",
          description: "Quick answers to common questions about the platform.",
          items: [
            {
              question: "How do alumni verify their accounts?",
              answer: "Alumni register with their graduation credentials, which are automatically reconciled against official university rosters or reviewed by the Alumni Office.",
            },
            {
              question: "Is ULAB Setu free for all students?",
              answer: "Yes, ULAB Setu is fully accessible to all currently enrolled undergraduate and graduate students.",
            },
          ],
        };
        break;
      case "testimonial":
        newBlock = {
          id,
          type: "testimonial",
          quote: "ULAB Setu connected me with an alumnus at a top tech company who guided me through technical interview preparation.",
          authorName: "Farhana Akter",
          authorRole: "Software Engineer",
          authorCompany: "CSE Class of 2024",
          avatarUrl: "",
        };
        break;
      case "eventPreview":
        newBlock = {
          id,
          type: "eventPreview",
          title: "ULAB Tech Symposium & Alumni Networking Night",
          eventDate: "Friday, November 28, 2026 • 5:00 PM BST",
          location: "Main Auditorium, Permanent Campus, Mohammadpur",
          description: "Join industry leaders and fellow alumni for keynotes on artificial intelligence, cloud architecture, and career development.",
          rsvpLink: "https://ulab.edu.bd/events",
          badge: "Networking",
        };
        break;
    }

    const updated = [...blocks, newBlock];
    onChange(updated);
    setExpandedBlockId(id);
    setAddDropdownOpen(false);
  };

  const removeBlock = (index: number) => {
    if (!confirm("Are you sure you want to remove this block?")) return;
    const updated = blocks.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange(updated);
  };

  const updateBlock = (index: number, partial: Partial<CmsBlock>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...partial } as CmsBlock;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Editor / Preview Toolbar */}
      <div className="flex items-center justify-between border-b border-mist/70 pb-3 dark:border-white/10">
        <div className="flex items-center gap-1 rounded-xl bg-paper p-1 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "edit"
                ? "bg-ulab-deep text-white shadow-xs"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Edit3 size={14} /> Block Editor ({blocks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "preview"
                ? "bg-ulab-deep text-white shadow-xs"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Eye size={14} /> Live Canvas Preview
          </button>
        </div>

        {/* Add Block Button */}
        {activeTab === "edit" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3 py-1.5 text-xs font-bold text-white shadow-lift transition hover:bg-ulab-deep active:scale-98"
            >
              <Plus size={14} /> Add Content Block
            </button>

            {addDropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-mist bg-surface p-2 shadow-lift dark:border-white/10 dark:bg-[#0f172a]">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  Select Block Type
                </p>
                <div className="space-y-0.5">
                  {CMS_BLOCK_TYPES.map((type) => {
                    const meta = CMS_BLOCK_TYPE_META[type];
                    const Icon = BLOCK_ICONS[type];

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addBlock(type)}
                        className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-xs transition hover:bg-paper dark:hover:bg-white/10"
                      >
                        <div className="size-6 rounded-lg bg-mist/60 grid place-items-center text-ink-soft shrink-0 dark:bg-white/10">
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{meta.label}</p>
                          <p className="text-[10px] text-ink-soft truncate leading-tight">
                            {meta.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Canvas or Live Preview */}
      {activeTab === "preview" ? (
        <div className="rounded-3xl border border-mist/80 bg-paper/60 p-6 md:p-8 dark:border-white/10 dark:bg-white/5">
          {blocks.length === 0 ? (
            <p className="text-center py-12 text-xs text-ink-soft">
              No blocks in this page yet. Switch to the editor to add your first content block.
            </p>
          ) : (
            <CmsBlocksRenderer blocks={blocks} />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-mist p-10 text-center dark:border-white/10">
              <Sparkles className="size-8 mx-auto text-ink-soft/40 mb-3" />
              <p className="font-bold text-xs text-ink">Canvas is Empty</p>
              <p className="text-[11px] text-ink-soft mt-1">
                Click the &ldquo;Add Content Block&rdquo; button above to begin structuring this page.
              </p>
            </div>
          ) : (
            blocks.map((block, idx) => {
              const meta = CMS_BLOCK_TYPE_META[block.type];
              const Icon = BLOCK_ICONS[block.type];
              const isExpanded = expandedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  className="rounded-2xl border border-mist/80 bg-surface shadow-xs transition dark:border-white/10 dark:bg-white/5"
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-mist/50 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                      className="flex items-center gap-2.5 text-left text-xs font-bold text-ink"
                    >
                      <div className="size-6 rounded-lg bg-ulab/10 text-ulab grid place-items-center dark:bg-ulab/20 dark:text-sky-300">
                        <Icon size={13} />
                      </div>
                      <span>
                        #{idx + 1} {meta.label}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveBlock(idx, "up")}
                        title="Move Up"
                        className="rounded p-1 text-ink-soft hover:bg-paper disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === blocks.length - 1}
                        onClick={() => moveBlock(idx, "down")}
                        title="Move Down"
                        className="rounded p-1 text-ink-soft hover:bg-paper disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(idx)}
                        title="Delete Block"
                        className="rounded p-1 text-rose hover:bg-rose-wash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Block Form Fields */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 text-xs bg-paper/40 rounded-b-2xl dark:bg-transparent">
                      {renderBlockEditorFields(block, idx, updateBlock)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function renderBlockEditorFields(
  block: CmsBlock,
  idx: number,
  updateBlock: (idx: number, partial: Partial<CmsBlock>) => void
) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-ink">Heading Text</label>
            <input
              type="text"
              value={block.text}
              onChange={(e) => updateBlock(idx, { text: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Subtitle</label>
            <input
              type="text"
              value={block.subtitle || ""}
              onChange={(e) => updateBlock(idx, { subtitle: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Tag Level</label>
            <select
              value={block.level}
              onChange={(e) => updateBlock(idx, { level: e.target.value as any })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            >
              {["h1", "h2", "h3", "h4", "h5", "h6"].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-ink">Alignment</label>
            <select
              value={block.alignment}
              onChange={(e) => updateBlock(idx, { alignment: e.target.value as any })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case "richText":
      return (
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-ink">Body Copy</label>
            <textarea
              rows={4}
              value={block.body}
              onChange={(e) => updateBlock(idx, { body: e.target.value })}
              className="mt-1 w-full rounded-xl border border-mist/80 bg-surface p-3 text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <label className="flex items-center gap-2 font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={block.isLead}
              onChange={(e) => updateBlock(idx, { isLead: e.target.checked })}
              className="size-4 text-ulab rounded"
            />
            <span>Render as Lead / Emphasis Paragraph</span>
          </label>
        </div>
      );

    case "image":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-ink">Image URL</label>
            <input
              type="url"
              value={block.url}
              onChange={(e) => updateBlock(idx, { url: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Alt Text (Accessibility)</label>
            <input
              type="text"
              value={block.altText}
              onChange={(e) => updateBlock(idx, { altText: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Caption (Optional)</label>
            <input
              type="text"
              value={block.caption || ""}
              onChange={(e) => updateBlock(idx, { caption: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>
      );

    case "imageWithText":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-ink">Image URL</label>
              <input
                type="url"
                value={block.imageUrl}
                onChange={(e) => updateBlock(idx, { imageUrl: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Layout Alignment</label>
              <select
                value={block.layout}
                onChange={(e) => updateBlock(idx, { layout: e.target.value as any })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              >
                <option value="image-left">Image on Left</option>
                <option value="image-right">Image on Right</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-ink">Section Heading</label>
            <input
              type="text"
              value={block.heading}
              onChange={(e) => updateBlock(idx, { heading: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Description Copy</label>
            <textarea
              rows={3}
              value={block.body}
              onChange={(e) => updateBlock(idx, { body: e.target.value })}
              className="mt-1 w-full rounded-xl border border-mist/80 bg-surface p-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-ink">Button Label</label>
              <input
                type="text"
                value={block.ctaText || ""}
                onChange={(e) => updateBlock(idx, { ctaText: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Button URL</label>
              <input
                type="text"
                value={block.ctaLink || ""}
                onChange={(e) => updateBlock(idx, { ctaLink: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-ink">CTA Title</label>
            <input
              type="text"
              value={block.title}
              onChange={(e) => updateBlock(idx, { title: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink">Description Copy</label>
            <textarea
              rows={2}
              value={block.description || ""}
              onChange={(e) => updateBlock(idx, { description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-mist/80 bg-surface p-2.5 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-ink">Primary Button Label</label>
              <input
                type="text"
                value={block.primaryLabel}
                onChange={(e) => updateBlock(idx, { primaryLabel: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Primary Button URL</label>
              <input
                type="text"
                value={block.primaryUrl}
                onChange={(e) => updateBlock(idx, { primaryUrl: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Secondary Label (Optional)</label>
              <input
                type="text"
                value={block.secondaryLabel || ""}
                onChange={(e) => updateBlock(idx, { secondaryLabel: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Secondary URL (Optional)</label>
              <input
                type="text"
                value={block.secondaryUrl || ""}
                onChange={(e) => updateBlock(idx, { secondaryUrl: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>
        </div>
      );

    case "testimonial":
      return (
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-ink">Testimonial Quote</label>
            <textarea
              rows={3}
              value={block.quote}
              onChange={(e) => updateBlock(idx, { quote: e.target.value })}
              className="mt-1 w-full rounded-xl border border-mist/80 bg-surface p-2.5 text-ink dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-ink">Author Name</label>
              <input
                type="text"
                value={block.authorName}
                onChange={(e) => updateBlock(idx, { authorName: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink">Author Role / Batch</label>
              <input
                type="text"
                value={block.authorRole}
                onChange={(e) => updateBlock(idx, { authorRole: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-mist/80 bg-surface px-3 text-ink dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-ink-soft italic">
          Block settings editor for &ldquo;{block.type}&rdquo; configured.
        </p>
      );
  }
}

