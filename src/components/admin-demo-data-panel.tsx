"use client";

import { useState, useTransition } from "react";
import {
  Globe2,
  Database,
  Sparkles,
  Trash2,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import {
  generateDemoAlumniAction,
  deleteDemoAlumniAction,
  type DemoAlumniManagementStats,
} from "@/app/actions/demo-alumni";

interface AdminDemoDataPanelProps {
  initialStats: DemoAlumniManagementStats;
}

export function AdminDemoDataPanel({ initialStats }: AdminDemoDataPanelProps) {
  const [stats, setStats] = useState<DemoAlumniManagementStats>(initialStats);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const handleGenerate = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await generateDemoAlumniAction();
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setStats((prev) => ({
          ...prev,
          totalDemoProfiles: 500,
          totalCountries: 55,
          totalCities: 170,
          lastGenerationDate: new Date().toISOString(),
        }));
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to remove all 500 synthetic demo alumni profiles? Real university accounts will not be affected."
      )
    ) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteDemoAlumniAction();
      if (res.success) {
        setFeedback({ type: "info", text: res.message });
        setStats((prev) => ({
          ...prev,
          totalDemoProfiles: 0,
          totalCountries: 0,
          totalCities: 0,
          lastGenerationDate: null,
        }));
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-mist/80 bg-paper p-5 shadow-soft dark:border-white/10 dark:bg-slate-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mist/70 pb-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Globe2 size={20} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Synthetic Demo Alumni & Global Map Management
            </h3>
            <p className="text-xs text-ink-soft">
              Controls the 500 synthetic demo alumni profiles used for university presentation and Global Alumni Map showcasing.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {stats.totalDemoProfiles === 0 ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ulab px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-ulab-deep disabled:opacity-50"
            >
              <Sparkles size={14} className={isPending ? "animate-spin" : ""} />
              <span>{isPending ? "Generating 500 Profiles..." : "Generate 500 Demo Alumni"}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-xs transition hover:bg-mist/40 disabled:opacity-50 dark:border-white/10"
              >
                <RefreshCw size={13} className={isPending ? "animate-spin" : ""} />
                <span>{isPending ? "Processing..." : "Regenerate Demo Data"}</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Trash2 size={13} />
                <span>Delete All Demo Alumni</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <Database size={13} />
            <span>Demo Profiles</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            {stats.totalDemoProfiles}{" "}
            <span className="text-[10px] font-normal text-ink-soft">/ 500</span>
          </p>
        </div>

        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <Globe2 size={13} />
            <span>Countries</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-ink">{stats.totalCountries}</p>
        </div>

        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <ShieldCheck size={13} />
            <span>City Centers</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-ink">{stats.totalCities}</p>
        </div>

        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <FileCheck size={13} />
            <span>Avatars Stored</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            {stats.totalImages} <span className="text-[10px] font-normal text-ink-soft">WebP</span>
          </p>
        </div>

        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <HardDrive size={13} />
            <span>Disk Size</span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            {stats.imageStorageSizeMb}{" "}
            <span className="text-[10px] font-normal text-ink-soft">MB</span>
          </p>
        </div>

        <div className="rounded-xl border border-mist/70 bg-surface/70 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-1.5 text-ink-soft">
            <ShieldCheck size={13} />
            <span>Size Limit</span>
          </div>
          <p className="mt-1 font-display text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {stats.allImagesUnder500Kb ? "All < 500 KB" : "Review Sizes"}
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {feedback && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : feedback.type === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
              : "border border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={15} className="shrink-0" />
          ) : (
            <AlertCircle size={15} className="shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-soft">
        <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
        <span>
          <strong>Data Isolation:</strong> Demo accounts carry <code>isDemo: true</code> and are strictly excluded from official university alumni counts, real job applications, and mentorship statistics.
        </span>
      </div>
    </div>
  );
}

