"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import { saveSiteNavigationConfig } from "@/app/actions/cms";
import {
  type SiteNavigationConfig,
  type NavigationLink,
  type FooterColumn,
  isSafeNavigationUrl,
} from "@/lib/cms-navigation";

interface CmsNavigationClientProps {
  initialConfig: SiteNavigationConfig;
  currentRole: string;
}

export function CmsNavigationClient({ initialConfig, currentRole }: CmsNavigationClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState<SiteNavigationConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"HEADER" | "FOOTER" | "CONTACT">("HEADER");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const canEdit = currentRole === "CMS_ADMIN" || currentRole === "CONTENT_EDITOR";

  // Header Links Management
  const addHeaderLink = () => {
    const newId = `nav-${Date.now()}`;
    setConfig((prev) => ({
      ...prev,
      headerLinks: [
        ...prev.headerLinks,
        {
          id: newId,
          label: "New Link",
          href: "/p/about-ulab-setu",
          openInNewTab: false,
          enabled: true,
          order: prev.headerLinks.length,
        },
      ],
    }));
  };

  const updateHeaderLink = (index: number, updates: Partial<NavigationLink>) => {
    setConfig((prev) => {
      const links = [...prev.headerLinks];
      links[index] = { ...links[index], ...updates };
      return { ...prev, headerLinks: links };
    });
  };

  const moveHeaderLink = (index: number, direction: "up" | "down") => {
    setConfig((prev) => {
      const links = [...prev.headerLinks];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= links.length) return prev;
      const temp = links[index];
      links[index] = links[target];
      links[target] = temp;
      return { ...prev, headerLinks: links.map((l, i) => ({ ...l, order: i })) };
    });
  };

  const removeHeaderLink = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      headerLinks: prev.headerLinks.filter((_, i) => i !== index),
    }));
  };

  // Footer Column Management
  const addFooterLink = (columnIndex: number) => {
    setConfig((prev) => {
      const columns = [...prev.footerColumns];
      const col = { ...columns[columnIndex] };
      col.links = [
        ...col.links,
        {
          id: `f-${Date.now()}`,
          label: "Footer Link",
          href: "/",
          openInNewTab: false,
        },
      ];
      columns[columnIndex] = col;
      return { ...prev, footerColumns: columns };
    });
  };

  const updateFooterLink = (columnIndex: number, linkIndex: number, updates: any) => {
    setConfig((prev) => {
      const columns = [...prev.footerColumns];
      const col = { ...columns[columnIndex] };
      const links = [...col.links];
      links[linkIndex] = { ...links[linkIndex], ...updates };
      col.links = links;
      columns[columnIndex] = col;
      return { ...prev, footerColumns: columns };
    });
  };

  const removeFooterLink = (columnIndex: number, linkIndex: number) => {
    setConfig((prev) => {
      const columns = [...prev.footerColumns];
      const col = { ...columns[columnIndex] };
      col.links = col.links.filter((_, i) => i !== linkIndex);
      columns[columnIndex] = col;
      return { ...prev, footerColumns: columns };
    });
  };

  const handleSave = () => {
    // Client-side scheme security check
    for (const l of config.headerLinks) {
      if (!isSafeNavigationUrl(l.href)) {
        setMessage({ text: `Header link "${l.label}" contains an unsafe URL scheme.`, error: true });
        return;
      }
    }
    for (const col of config.footerColumns) {
      for (const l of col.links) {
        if (!isSafeNavigationUrl(l.href)) {
          setMessage({ text: `Footer link "${l.label}" contains an unsafe URL scheme.`, error: true });
          return;
        }
      }
    }

    startTransition(async () => {
      setMessage(null);
      const res = await saveSiteNavigationConfig(config);
      if (!res.success) {
        setMessage({ text: res.error || "Failed to save navigation.", error: true });
      } else {
        setMessage({ text: res.message || "Navigation saved and published." });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-mist/80 bg-surface/80 p-6 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/40 text-ulab shadow-xs">
                <Compass size={18} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Navigation & Footer Manager
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Manage website header navigation links, footer directory columns, official contact info, and social media channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                <Save size={14} /> Save Navigation Settings
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-6 flex items-center gap-2 border-t border-mist/60 pt-4">
          <button
            onClick={() => setActiveTab("HEADER")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "HEADER"
                ? "bg-ink text-paper shadow-xs"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            Header Navigation Menu ({config.headerLinks.length})
          </button>
          <button
            onClick={() => setActiveTab("FOOTER")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "FOOTER"
                ? "bg-ink text-paper shadow-xs"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            Footer Link Columns ({config.footerColumns.length})
          </button>
          <button
            onClick={() => setActiveTab("CONTACT")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "CONTACT"
                ? "bg-ink text-paper shadow-xs"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            Contact & Social Info
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-medium ${
            message.error
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              : "border-sage-200 bg-sage-50 text-sage-800 dark:border-sage-900/60 dark:bg-sage-950/40 dark:text-sage-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* HEADER NAVIGATION TAB */}
      {activeTab === "HEADER" && (
        <div className="rounded-2xl border border-mist bg-paper p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-mist pb-3">
            <div>
              <h3 className="font-semibold text-sm text-ink">Main Header Navigation Menu</h3>
              <p className="text-xs text-ink-soft">
                Reorder or modify the top navbar links shown to all visitors.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={addHeaderLink}
                className="inline-flex items-center gap-1 rounded-lg border border-mist px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface"
              >
                <Plus size={13} /> Add Header Link
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {config.headerLinks.map((link, idx) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-mist/80 bg-surface/40 p-3 text-xs"
              >
                <span className="font-mono text-ink-soft font-bold w-4 text-center">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-semibold text-ink-soft">Label</label>
                  <input
                    type="text"
                    value={link.label}
                    disabled={!canEdit}
                    onChange={(e) => updateHeaderLink(idx, { label: e.target.value })}
                    className="w-full rounded-lg border border-mist bg-paper px-2.5 py-1 text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                </div>

                <div className="flex-2 min-w-[200px]">
                  <label className="block text-[10px] font-semibold text-ink-soft">
                    Destination URL (e.g. /news, /p/about, or https://...)
                  </label>
                  <input
                    type="text"
                    value={link.href}
                    disabled={!canEdit}
                    onChange={(e) => updateHeaderLink(idx, { href: e.target.value })}
                    className="w-full rounded-lg border border-mist bg-paper px-2.5 py-1 font-mono text-xs text-ink focus:border-ulab focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      disabled={!canEdit}
                      onChange={(e) => updateHeaderLink(idx, { enabled: e.target.checked })}
                      className="rounded border-mist text-ulab focus:ring-0"
                    />
                    <span className="text-[11px] text-ink-soft">Active</span>
                  </label>

                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.openInNewTab}
                      disabled={!canEdit}
                      onChange={(e) => updateHeaderLink(idx, { openInNewTab: e.target.checked })}
                      className="rounded border-mist text-ulab focus:ring-0"
                    />
                    <span className="text-[11px] text-ink-soft">New Tab</span>
                  </label>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 pt-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => moveHeaderLink(idx, "up")}
                      disabled={idx === 0}
                      className="rounded p-1 text-ink-soft hover:bg-surface disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHeaderLink(idx, "down")}
                      disabled={idx === config.headerLinks.length - 1}
                      className="rounded p-1 text-ink-soft hover:bg-surface disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHeaderLink(idx)}
                      className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER TAB */}
      {activeTab === "FOOTER" && (
        <div className="grid gap-6 md:grid-cols-2">
          {config.footerColumns.map((col, colIdx) => (
            <div
              key={col.id}
              className="rounded-2xl border border-mist bg-paper p-5 shadow-soft space-y-3"
            >
              <div className="flex items-center justify-between border-b border-mist pb-2">
                <input
                  type="text"
                  value={col.title}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const columns = [...config.footerColumns];
                    columns[colIdx].title = e.target.value;
                    setConfig((prev) => ({ ...prev, footerColumns: columns }));
                  }}
                  className="font-bold text-sm text-ink bg-transparent focus:border-b focus:border-ulab focus:outline-none"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => addFooterLink(colIdx)}
                    className="inline-flex items-center gap-1 rounded border border-mist px-2 py-0.5 text-[11px] text-ink hover:bg-surface"
                  >
                    <Plus size={11} /> Add
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {col.links.map((link, lIdx) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 rounded-lg border border-mist/60 bg-surface/40 p-2 text-xs"
                  >
                    <input
                      type="text"
                      value={link.label}
                      disabled={!canEdit}
                      onChange={(e) => updateFooterLink(colIdx, lIdx, { label: e.target.value })}
                      placeholder="Link label"
                      className="w-1/3 rounded border border-mist bg-paper px-2 py-1 text-xs text-ink focus:outline-none"
                    />
                    <input
                      type="text"
                      value={link.href}
                      disabled={!canEdit}
                      onChange={(e) => updateFooterLink(colIdx, lIdx, { href: e.target.value })}
                      placeholder="/destination"
                      className="w-2/3 rounded border border-mist bg-paper px-2 py-1 font-mono text-[11px] text-ink focus:outline-none"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeFooterLink(colIdx, lIdx)}
                        className="text-ink-soft hover:text-rose-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTACT & SOCIAL TAB */}
      {activeTab === "CONTACT" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Official Contact Info */}
          <div className="rounded-2xl border border-mist bg-paper p-6 shadow-soft space-y-4">
            <h3 className="font-semibold text-sm text-ink border-b border-mist pb-2">
              Official University Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-soft font-medium mb-1">University Name</label>
                <input
                  type="text"
                  value={config.contactInfo.universityName}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, universityName: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-medium mb-1">Campus Address</label>
                <input
                  type="text"
                  value={config.contactInfo.address}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, address: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-ink-soft font-medium mb-1">Official Email</label>
                  <input
                    type="email"
                    value={config.contactInfo.email}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-mist bg-surface/50 p-2 text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={config.contactInfo.phone}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-mist bg-surface/50 p-2 text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-soft font-medium mb-1">Helpdesk Hours</label>
                <input
                  type="text"
                  value={config.contactInfo.helpdeskHours}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, helpdeskHours: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="rounded-2xl border border-mist bg-paper p-6 shadow-soft space-y-4">
            <h3 className="font-semibold text-sm text-ink border-b border-mist pb-2">
              Official Social Media Channels
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-soft font-medium mb-1">Facebook Page URL</label>
                <input
                  type="text"
                  value={config.socialLinks.facebook || ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value },
                    }))
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 font-mono text-[11px] text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-medium mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={config.socialLinks.linkedin || ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                    }))
                  }
                  placeholder="https://linkedin.com/school/..."
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 font-mono text-[11px] text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-medium mb-1">YouTube Channel</label>
                <input
                  type="text"
                  value={config.socialLinks.youtube || ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                    }))
                  }
                  placeholder="https://youtube.com/@..."
                  className="w-full rounded-lg border border-mist bg-surface/50 p-2 font-mono text-[11px] text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

