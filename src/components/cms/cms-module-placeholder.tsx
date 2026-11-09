import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Newspaper,
  HelpCircle,
  Award,
  FolderGit2,
  Image as ImageIcon,
  CheckSquare,
  Archive,
  Database,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui";

type ModulePlaceholderProps = {
  title: string;
  moduleKey: string;
  phaseNumber: number;
  phaseTitle: string;
  description: string;
  modelsSupported: string[];
  capabilitiesPlanned: string[];
};

export function CmsModulePlaceholder({
  title,
  moduleKey,
  phaseNumber,
  phaseTitle,
  description,
  modelsSupported,
  capabilitiesPlanned,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div>
        <Link
          href="/admin/cms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to CMS Overview
        </Link>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="blue" className="text-[10px]">
                Phase {phaseNumber} Roadmap
              </Badge>
              <span className="text-xs text-ink-soft">• {phaseTitle}</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
          </div>
          <Link
            href="/admin/cms"
            className="inline-flex items-center gap-2 rounded-xl bg-ulab-deep px-4 py-2 text-xs font-bold text-white transition hover:bg-ulab"
          >
            <Layers size={14} /> Return to CMS Dashboard
          </Link>
        </div>
      </div>

      {/* Main Roadmap Card */}
      <div className="relative overflow-hidden rounded-3xl border border-mist/80 bg-surface/90 p-6 shadow-xs dark:border-white/10 dark:bg-white/5 md:p-8">
        <div className="max-w-2xl space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-ulab/10 text-ulab dark:bg-ulab/20 dark:text-sky-300">
            <Sparkles size={24} />
          </div>

          <h2 className="font-display text-lg font-bold text-ink">
            {title} Architecture & Data Foundation Ready
          </h2>

          <p className="text-xs text-ink-soft leading-relaxed md:text-sm">
            {description}
          </p>

          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            {/* Database Foundation Ready */}
            <div className="rounded-2xl border border-mist/70 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Database size={16} />
                <h3 className="text-xs font-bold">Database Foundation Ready</h3>
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Phase 1 has established the underlying Prisma models:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {modelsSupported.map((model) => (
                  <span
                    key={model}
                    className="rounded bg-surface px-2 py-0.5 text-[10px] font-mono font-semibold text-ink dark:bg-white/10"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions & Security */}
            <div className="rounded-2xl border border-mist/70 bg-paper/60 p-4 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-2 text-gold-ink dark:text-gold-soft">
                <ShieldCheck size={16} />
                <h3 className="text-xs font-bold">RBAC & Lifecycle Ready</h3>
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                Protected by server-side authorization and strict 8-stage lifecycle transitions:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {capabilitiesPlanned.map((cap) => (
                  <span
                    key={cap}
                    className="rounded bg-surface px-2 py-0.5 text-[10px] font-mono font-semibold text-ink dark:bg-white/10"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-8 rounded-2xl border border-dashed border-mist p-4 text-xs text-ink-soft dark:border-white/10">
          <p className="font-semibold text-ink">
            Scheduled Implementation: Phase {phaseNumber} ({phaseTitle})
          </p>
          <p className="mt-0.5 text-[11px]">
            The full editing canvas, rich text editor, drag-and-drop ordering, and front-facing view templates for this module will be activated in Phase {phaseNumber}. You can create initial draft entries from the CMS Overview.
          </p>
        </div>
      </div>
    </div>
  );
}

