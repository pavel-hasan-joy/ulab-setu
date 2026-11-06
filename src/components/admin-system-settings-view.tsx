"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Bell,
  Shield,
  Users,
  Briefcase,
  LifeBuoy,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  SYSTEM_SETTING_DEFINITIONS,
  type SettingCategory,
  type SettingDefinition,
} from "@/lib/settings";
import { saveSystemSettings, resetSystemSettingsCategory } from "@/app/actions/settings";

type AdminSystemSettingsViewProps = {
  initialSettings: Record<string, string>;
  lastUpdated?: string | null;
  updatedByName?: string | null;
};

const CATEGORIES: {
  id: SettingCategory;
  label: string;
  description: string;
  icon: typeof Globe;
  tone: "gold" | "blue" | "sage" | "lilac" | "gray";
}[] = [
  {
    id: "PLATFORM",
    label: "Platform Information",
    description: "Institutional identity, branding, domain policies, and announcements.",
    icon: Globe,
    tone: "blue",
  },
  {
    id: "NOTIFICATION",
    label: "Notification Preferences",
    description: "Email delivery gateways, retention windows, and digest frequencies.",
    icon: Bell,
    tone: "gold",
  },
  {
    id: "PRIVACY",
    label: "User Privacy Settings",
    description: "Default member visibility, phone masking, and direct messaging access.",
    icon: Shield,
    tone: "sage",
  },
  {
    id: "ROLES",
    label: "Roles & Permissions",
    description: "Alumni auto-approval, student application quotas, and faculty mentors.",
    icon: Users,
    tone: "lilac",
  },
  {
    id: "JOBS",
    label: "Job Configuration",
    description: "Default posting lifespan, external link rules, and salary transparency.",
    icon: Briefcase,
    tone: "gold",
  },
  {
    id: "SUPPORT",
    label: "Support Configuration",
    description: "Ticket auto-close thresholds, SLA escalation, and auto-flagging.",
    icon: LifeBuoy,
    tone: "blue",
  },
  {
    id: "SECURITY",
    label: "Security & Cryptography",
    description: "Brute-force lockout thresholds, token TTL, and password complexity.",
    icon: Lock,
    tone: "sage",
  },
];

export function AdminSystemSettingsView({
  initialSettings,
  lastUpdated,
  updatedByName,
}: AdminSystemSettingsViewProps) {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>("PLATFORM");
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const currentDefs = SYSTEM_SETTING_DEFINITIONS.filter((d) => d.category === activeCategory);

  const isDirty = Object.keys(settings).some(
    (key) => (settings[key] ?? "") !== (initialSettings[key] ?? "")
  );

  const handleValueChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSystemSettings({ settings });
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Settings updated successfully." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update settings." });
      }
    });
  };

  const handleResetCategory = () => {
    if (!confirm(`Are you sure you want to reset all "${activeCategory}" settings to system defaults?`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await resetSystemSettingsCategory(activeCategory);
      if (res.success) {
        // Update local state with category defaults
        const updated = { ...settings };
        for (const def of currentDefs) {
          updated[def.key] = def.defaultValue;
        }
        setSettings(updated);
        setFeedback({ type: "success", message: res.message || "Category reset to defaults." });
      } else {
        setFeedback({ type: "error", message: res.error || "Reset failed." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Info */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-ulab/10 text-ulab">
              <Sparkles size={16} />
            </span>
            <h2 className="text-base font-bold text-ink">System Governance & Global Settings</h2>
            <Badge tone="blue">Production Database Connected</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {lastUpdated
              ? `Last persisted: ${new Date(lastUpdated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}${updatedByName ? ` by ${updatedByName}` : ""}`
              : "Institutional policies currently active with baseline configurations."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="animate-pulse text-xs font-semibold text-amber-600 dark:text-amber-400">
              ● Unsaved Changes
            </span>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-ulab text-white hover:bg-ulab-deep"
          >
            <Save size={16} />
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>

      {/* Feedback Alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-medium ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="font-bold underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Settings Layout: Left Category Navigation, Right Settings Form */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
            Settings Modules
          </p>
          <div className="flex flex-row overflow-x-auto gap-1 pb-2 lg:flex-col lg:overflow-x-visible">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition whitespace-nowrap lg:whitespace-normal ${
                    isActive
                      ? "bg-ulab text-white shadow-soft font-semibold"
                      : "border border-mist/60 bg-surface text-ink hover:bg-paper/70 hover:border-mist"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                      isActive ? "bg-white/20 text-white" : "bg-paper text-ink-soft"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{cat.label}</p>
                    <p
                      className={`hidden text-[11px] line-clamp-1 lg:block ${
                        isActive ? "text-white/80" : "text-ink-soft"
                      }`}
                    >
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Panel */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="p-6">
            <div className="flex flex-col gap-2 border-b border-mist/70 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </h3>
                <p className="text-xs text-ink-soft">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCategory}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-mist/80 bg-paper/60 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink transition"
              >
                <RotateCcw size={13} />
                Reset Category
              </button>
            </div>

            {/* Individual Setting Inputs */}
            <div className="mt-6 divide-y divide-mist/60 dark:divide-white/5 space-y-6">
              {currentDefs.map((def, index) => {
                const currentVal = settings[def.key] ?? def.defaultValue;
                return (
                  <div
                    key={def.key}
                    className={`pt-6 first:pt-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`setting-${def.key}`}
                          className="text-sm font-semibold text-ink"
                        >
                          {def.label}
                        </label>
                        <span className="font-mono text-[10px] text-ink-soft/70">
                          ({def.key})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                        {def.description}
                      </p>
                    </div>

                    {/* Controls by type */}
                    <div className="shrink-0 sm:w-64">
                      {def.type === "boolean" ? (
                        <div className="flex items-center justify-end gap-3">
                          <Badge tone={currentVal === "true" ? "sage" : "gray"}>
                            {currentVal === "true" ? "Enabled" : "Disabled"}
                          </Badge>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={currentVal === "true"}
                            onClick={() =>
                              handleValueChange(
                                def.key,
                                currentVal === "true" ? "false" : "true"
                              )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              currentVal === "true" ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                currentVal === "true" ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      ) : def.type === "select" ? (
                        <select
                          id={`setting-${def.key}`}
                          value={currentVal}
                          onChange={(e) => handleValueChange(def.key, e.target.value)}
                          className="w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                        >
                          {def.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : def.type === "number" ? (
                        <input
                          id={`setting-${def.key}`}
                          type="number"
                          value={currentVal}
                          onChange={(e) => handleValueChange(def.key, e.target.value)}
                          className="w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs font-semibold text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5 text-right font-mono"
                        />
                      ) : (
                        <input
                          id={`setting-${def.key}`}
                          type="text"
                          value={currentVal}
                          onChange={(e) => handleValueChange(def.key, e.target.value)}
                          className="w-full rounded-xl border border-mist/80 bg-paper/60 px-3 py-2 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Reminder */}
            <div className="mt-8 flex items-center justify-between border-t border-mist/70 pt-5 dark:border-white/10">
              <span className="text-xs text-ink-soft">
                All settings are enforced immediately across the active server runtime.
              </span>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 bg-ulab text-white hover:bg-ulab-deep"
              >
                <Save size={15} />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
