"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layout,
  MessageSquare,
  Briefcase,
  HelpCircle,
  RefreshCw,
  Compass,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { saveHomepageContent } from "@/app/actions/cms";
import type { HomepageContent } from "@/lib/cms-homepage";
import type { CmsContentStatus } from "@/lib/cms-types";

interface HomepageManagerClientProps {
  initialContent: HomepageContent;
  status: CmsContentStatus;
  lastUpdated?: string;
  lastEditorName?: string;
}

export function HomepageManagerClient({
  initialContent,
  status,
  lastUpdated,
  lastEditorName,
}: HomepageManagerClientProps) {
  const [content, setContent] = useState<HomepageContent>(initialContent);
  const [currentStatus, setCurrentStatus] = useState<CmsContentStatus>(status);
  const [activeTab, setActiveTab] = useState<"hero" | "quote" | "how" | "jobs" | "cta" | "footer">("hero");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const updateField = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (publishImmediately: boolean) => {
    startTransition(async () => {
      const res = await saveHomepageContent(content, publishImmediately);
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Homepage updated!" });
        if (publishImmediately) setCurrentStatus("PUBLISHED");
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save homepage content." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Homepage Content Manager
            </h1>
            <Badge tone={currentStatus === "PUBLISHED" ? "sage" : "gold"}>
              {currentStatus === "PUBLISHED" ? "Live on Website" : "Draft Changes"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Directly customize homepage copy, promotional calls to action, and section highlights while preserving animations and 3D visual effects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-mist/50 transition-colors"
          >
            <ExternalLink size={14} /> View Live Homepage
          </Link>

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
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-mist/70 pb-3">
        {[
          { id: "hero", label: "Hero & Headline", icon: Sparkles },
          { id: "quote", label: "Introductory Quote", icon: MessageSquare },
          { id: "how", label: "How It Works Steps", icon: Compass },
          { id: "jobs", label: "Job Stream Teaser", icon: Briefcase },
          { id: "cta", label: "Bottom CTA Banner", icon: Layout },
          { id: "footer", label: "Footer Info", icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-ulab text-white shadow-soft"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Form Tabs */}
      <Card className="p-6">
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Hero Section Configuration</h3>
              <p className="text-xs text-ink-soft">
                Controls the main headline, subtitle, action buttons, and floating cards over the 3D Anime Sky.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Hero Top Pill Badge
                </label>
                <Input
                  value={content.heroBadge}
                  onChange={(e) => updateField("heroBadge", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Main Headline (Animated word-by-word)
                </label>
                <Input
                  value={content.heroHeadline}
                  onChange={(e) => updateField("heroHeadline", e.target.value)}
                  className="mt-1.5 text-base font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Hero Subtitle Paragraph
                </label>
                <textarea
                  value={content.heroSubtitle}
                  onChange={(e) => updateField("heroSubtitle", e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Student CTA Button Text & Link
                </label>
                <div className="mt-1.5 space-y-2">
                  <Input
                    value={content.heroStudentCtaText}
                    onChange={(e) => updateField("heroStudentCtaText", e.target.value)}
                    placeholder="Button text"
                  />
                  <Input
                    value={content.heroStudentCtaLink}
                    onChange={(e) => updateField("heroStudentCtaLink", e.target.value)}
                    placeholder="/signup?role=student"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Alumni CTA Button Text & Link
                </label>
                <div className="mt-1.5 space-y-2">
                  <Input
                    value={content.heroAlumniCtaText}
                    onChange={(e) => updateField("heroAlumniCtaText", e.target.value)}
                    placeholder="Button text"
                  />
                  <Input
                    value={content.heroAlumniCtaLink}
                    onChange={(e) => updateField("heroAlumniCtaLink", e.target.value)}
                    placeholder="/signup?role=alumni"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Teacher CTA Button Text & Link
                </label>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                  <Input
                    value={content.heroTeacherCtaText}
                    onChange={(e) => updateField("heroTeacherCtaText", e.target.value)}
                    placeholder="Button text"
                  />
                  <Input
                    value={content.heroTeacherCtaLink}
                    onChange={(e) => updateField("heroTeacherCtaLink", e.target.value)}
                    placeholder="/signup?role=teacher"
                  />
                </div>
              </div>

              {/* Floating Cards */}
              <div className="rounded-xl border border-mist bg-surface/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ulab">Floating Card 1 (Top Right)</h4>
                <div className="mt-2 space-y-2">
                  <Input
                    value={content.floatCard1Title}
                    onChange={(e) => updateField("floatCard1Title", e.target.value)}
                    placeholder="Title"
                  />
                  <Input
                    value={content.floatCard1Body}
                    onChange={(e) => updateField("floatCard1Body", e.target.value)}
                    placeholder="Subtitle/description"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-mist bg-surface/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ulab">Floating Card 2 (Bottom Center)</h4>
                <div className="mt-2 space-y-2">
                  <Input
                    value={content.floatCard2Title}
                    onChange={(e) => updateField("floatCard2Title", e.target.value)}
                    placeholder="Title"
                  />
                  <Input
                    value={content.floatCard2Body}
                    onChange={(e) => updateField("floatCard2Body", e.target.value)}
                    placeholder="Subtitle/description"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quote" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Emotional Quote Section</h3>
              <p className="text-xs text-ink-soft">
                The large focal quotation displayed between the story animations and the process steps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Quotation Copy
              </label>
              <textarea
                value={content.quoteText}
                onChange={(e) => updateField("quoteText", e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-base text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
              />
            </div>
          </div>
        )}

        {activeTab === "how" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">How It Works Section</h3>
              <p className="text-xs text-ink-soft">
                Customize the 3-step pathway explaining how students connect with alumni and land opportunities.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Section Title
                </label>
                <Input
                  value={content.howTitle}
                  onChange={(e) => updateField("howTitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Section Subtitle
                </label>
                <Input
                  value={content.howSubtitle}
                  onChange={(e) => updateField("howSubtitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Step 1 */}
              <div className="rounded-xl border border-mist bg-surface/50 p-4">
                <span className="font-bold text-xs text-ulab">Step 1</span>
                <Input
                  value={content.step1Title}
                  onChange={(e) => updateField("step1Title", e.target.value)}
                  placeholder="Title"
                  className="mt-2"
                />
                <textarea
                  value={content.step1Body}
                  onChange={(e) => updateField("step1Body", e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink outline-none"
                />
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-mist bg-surface/50 p-4">
                <span className="font-bold text-xs text-ulab">Step 2</span>
                <Input
                  value={content.step2Title}
                  onChange={(e) => updateField("step2Title", e.target.value)}
                  placeholder="Title"
                  className="mt-2"
                />
                <textarea
                  value={content.step2Body}
                  onChange={(e) => updateField("step2Body", e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink outline-none"
                />
              </div>

              {/* Step 3 */}
              <div className="md:col-span-2 rounded-xl border border-mist bg-surface/50 p-4">
                <span className="font-bold text-xs text-ulab">Step 3</span>
                <Input
                  value={content.step3Title}
                  onChange={(e) => updateField("step3Title", e.target.value)}
                  placeholder="Title"
                  className="mt-2"
                />
                <textarea
                  value={content.step3Body}
                  onChange={(e) => updateField("step3Body", e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-xs text-ink outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Job Stream Teaser</h3>
              <p className="text-xs text-ink-soft">
                Titles and descriptions for the live alumni job listings section on the homepage.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Jobs Heading
                </label>
                <Input
                  value={content.jobsTitle}
                  onChange={(e) => updateField("jobsTitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Jobs Subtitle
                </label>
                <Input
                  value={content.jobsSubtitle}
                  onChange={(e) => updateField("jobsSubtitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "cta" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Bottom Call to Action Banner</h3>
              <p className="text-xs text-ink-soft">
                The gradient banner at the bottom encouraging alumni to sign up and mentor juniors.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Banner Headline
                </label>
                <Input
                  value={content.ctaTitle}
                  onChange={(e) => updateField("ctaTitle", e.target.value)}
                  className="mt-1.5 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Banner Subtitle
                </label>
                <Input
                  value={content.ctaSubtitle}
                  onChange={(e) => updateField("ctaSubtitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Primary Button (Text & Link)
                </label>
                <div className="mt-1.5 space-y-2">
                  <Input
                    value={content.ctaPrimaryText}
                    onChange={(e) => updateField("ctaPrimaryText", e.target.value)}
                    placeholder="Button text"
                  />
                  <Input
                    value={content.ctaPrimaryLink}
                    onChange={(e) => updateField("ctaPrimaryLink", e.target.value)}
                    placeholder="/signup?role=alumni"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Secondary Button (Text & Link)
                </label>
                <div className="mt-1.5 space-y-2">
                  <Input
                    value={content.ctaSecondaryText}
                    onChange={(e) => updateField("ctaSecondaryText", e.target.value)}
                    placeholder="Button text"
                  />
                  <Input
                    value={content.ctaSecondaryLink}
                    onChange={(e) => updateField("ctaSecondaryLink", e.target.value)}
                    placeholder="/student/mentors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "footer" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Footer Institutional Info</h3>
              <p className="text-xs text-ink-soft">
                Footer attribution line and institutional tagline.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Footer Tagline
              </label>
              <Input
                value={content.footerTagline}
                onChange={(e) => updateField("footerTagline", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

