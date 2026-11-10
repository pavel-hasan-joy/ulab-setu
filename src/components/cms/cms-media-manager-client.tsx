"use client";

import { useState, useTransition, useRef } from "react";
import {
  Image as ImageIcon,
  FileText,
  Upload,
  Search,
  Grid,
  List,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  FileDown,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
  uploadCmsMedia,
  updateCmsMediaMetadata,
  replaceCmsMediaFile,
  deleteCmsMedia,
  checkMediaAssetUsage,
} from "@/app/actions/cms";
import { MEDIA_FOLDERS, MAX_MEDIA_FILE_SIZE } from "@/lib/cms-media-security";
import Image from "next/image";

export type MediaAsset = {
  id: string;
  title: string;
  url: string;
  altText: string | null;
  fileType: string;
  fileSize: number | null;
  createdAt: string | Date;
  uploadedBy: { id: string; name: string | null; email: string | null; image: string | null } | null;
};

interface CmsMediaManagerClientProps {
  initialItems: MediaAsset[];
  totalCount: number;
  userRole: string;
  onSelectAsset?: (asset: MediaAsset) => void;
  selectionMode?: boolean;
}

export function CmsMediaManagerClient({
  initialItems,
  totalCount,
  userRole,
  onSelectAsset,
  selectionMode = false,
}: CmsMediaManagerClientProps) {
  const [items, setItems] = useState<MediaAsset[]>(initialItems);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [assetUsages, setAssetUsages] = useState<any[]>([]);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadFolder, setUploadFolder] = useState<string>("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.altText && item.altText.toLowerCase().includes(searchQuery.toLowerCase()));

    const isImage = item.fileType.startsWith("image/");
    const matchesType =
      fileTypeFilter === "ALL" ||
      (fileTypeFilter === "IMAGE" && isImage) ||
      (fileTypeFilter === "DOCUMENT" && !isImage);

    return matchesQuery && matchesType;
  });

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_FILE_SIZE) {
      alert("File exceeds maximum allowed limit of 5MB.");
      return;
    }
    setSelectedFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: "error", message: "Please select an image or PDF document to upload." });
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("title", uploadTitle);
      fd.append("altText", uploadAlt);
      fd.append("folder", uploadFolder);

      const res = await uploadCmsMedia(fd);
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Upload successful!" });
        const newAsset: MediaAsset = {
          id: res.mediaId || `media-${Date.now()}`,
          title: uploadTitle,
          url: res.url || "",
          altText: uploadAlt || null,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          createdAt: new Date().toISOString(),
          uploadedBy: { id: "me", name: "You", email: null, image: null },
        };
        setItems((prev) => [newAsset, ...prev]);
        setSelectedFile(null);
        setUploadTitle("");
        setUploadAlt("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setIsUploadOpen(false), 1200);
      } else {
        setFeedback({ type: "error", message: res.error || "Upload failed." });
      }
    });
  };

  const handleInspectUsage = async (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setEditTitle(asset.title);
    setEditAlt(asset.altText || "");
    const res = await checkMediaAssetUsage(asset.id);
    setAssetUsages(res.usages);
    setIsUsageModalOpen(true);
  };

  const handleUpdateMetadata = () => {
    if (!selectedAsset) return;
    startTransition(async () => {
      const res = await updateCmsMediaMetadata({
        id: selectedAsset.id,
        title: editTitle,
        altText: editAlt,
      });

      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === selectedAsset.id ? { ...i, title: editTitle, altText: editAlt } : i))
        );
        setSelectedAsset((prev) => (prev ? { ...prev, title: editTitle, altText: editAlt } : null));
        setFeedback({ type: "success", message: "Metadata updated!" });
      } else {
        setFeedback({ type: "error", message: res.error || "Update failed." });
      }
    });
  };

  const handleDelete = (asset: MediaAsset) => {
    startTransition(async () => {
      const res = await deleteCmsMedia({ id: asset.id });
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== asset.id));
        setIsUsageModalOpen(false);
        setSelectedAsset(null);
      } else {
        alert(res.error || "Cannot delete asset.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {selectionMode ? "Insert Media from Library" : "Centralized Media Library"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Securely upload, organize, inspect usages, and embed photography, badges, and PDF circulars across the CMS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsUploadOpen(!isUploadOpen)} className="gap-2 shadow-soft">
            <Upload size={16} /> Upload New Asset
          </Button>
        </div>
      </div>

      {/* Upload Drawer */}
      {isUploadOpen && (
        <Card className="border-2 border-ulab/20 bg-paper p-6 shadow-lift transition-all">
          <div className="flex items-center justify-between border-b border-mist/70 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Upload Media File</h2>
              <p className="text-xs text-ink-soft">
                Supported: JPEG, PNG, WebP, GIF, PDF (Max 5MB). Executables & unsafe scripts are strictly rejected.
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="px-3 py-1.5 text-xs">
              Cancel
            </Button>
          </div>

          {feedback && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                File Selector <span className="text-rose-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileSelect}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-sky file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ulab hover:file:bg-mist"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Asset Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Campus Beribadh Auditorium Fest"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Accessibility Alt Text (For Images)
              </label>
              <Input
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
                placeholder="Descriptive text for visually impaired readers and SEO"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Folder Category
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mist bg-surface px-3 py-2 text-sm text-ink outline-none"
              >
                {MEDIA_FOLDERS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 border-t border-mist/70 pt-4">
              <Button type="submit" disabled={isPending || !selectedFile} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending && <RefreshCw size={14} className="animate-spin" />}
                Confirm & Upload to Library
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "IMAGE", "DOCUMENT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFileTypeFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                fileTypeFilter === tab
                  ? "bg-ulab text-white shadow-sm"
                  : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
              }`}
            >
              {tab === "ALL" ? "All Media" : tab === "IMAGE" ? "Images Only" : "PDFs & Docs"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by title or alt text..."
              className="w-full rounded-xl border border-mist bg-surface py-2 pl-9 pr-4 text-xs text-ink outline-none focus:border-ulab focus:ring-2 focus:ring-ulab/10"
            />
          </div>

          <div className="flex items-center rounded-xl border border-mist bg-surface p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-paper text-ulab shadow-sm" : "text-ink-soft"}`}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-paper text-ulab shadow-sm" : "text-ink-soft"}`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* Asset Grid / List View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredItems.map((asset) => {
            const isImage = asset.fileType.startsWith("image/");
            return (
              <Card
                key={asset.id}
                className="group relative flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-lift"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-mist/20">
                  {isImage ? (
                    <Image
                      src={asset.url}
                      alt={asset.altText || asset.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-soft">
                      <FileText size={36} className="text-ulab/70" />
                      <span className="text-[10px] font-bold uppercase mt-1">PDF</span>
                    </div>
                  )}

                  {selectionMode && onSelectAsset && (
                    <button
                      onClick={() => onSelectAsset(asset)}
                      className="absolute inset-0 bg-ulab/80 text-white font-semibold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      Insert Asset
                    </button>
                  )}
                </div>

                <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-ink line-clamp-1" title={asset.title}>
                      {asset.title}
                    </h3>
                    <p className="text-[11px] text-ink-soft mt-0.5">
                      {asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)} KB` : "Asset"}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-mist/50 pt-2">
                    <button
                      onClick={() => handleCopyUrl(asset.url, asset.id)}
                      className="text-ink-soft hover:text-ulab"
                      title="Copy URL"
                    >
                      {copiedId === asset.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleInspectUsage(asset)}
                      className="text-ink-soft hover:text-ulab"
                      title="Asset Details & Usage"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-mist bg-surface/50 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-6 py-3.5">Type & Size</th>
                  <th className="px-6 py-3.5">Alt Text</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 bg-paper text-xs">
                {filteredItems.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface/50">
                    <td className="px-6 py-3 font-semibold text-ink flex items-center gap-3">
                      <div className="size-8 rounded overflow-hidden relative bg-mist/30 shrink-0">
                        {asset.fileType.startsWith("image/") ? (
                          <Image src={asset.url} alt={asset.title} fill className="object-cover" />
                        ) : (
                          <FileText size={18} className="m-auto text-ulab" />
                        )}
                      </div>
                      <span>{asset.title}</span>
                    </td>
                    <td className="px-6 py-3 text-ink-soft font-mono">
                      {asset.fileType} · {asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)} KB` : ""}
                    </td>
                    <td className="px-6 py-3 text-ink-soft">{asset.altText || "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {selectionMode && onSelectAsset && (
                          <Button onClick={() => onSelectAsset(asset)} className="h-7 text-xs px-2">
                            Select
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleInspectUsage(asset)}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <Edit2 size={12} /> Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Asset Detail & Usages Modal */}
      {isUsageModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-mist/70 pb-3">
              <h2 className="font-display text-lg font-bold text-ink">Asset Details & Usage Tracking</h2>
              <button onClick={() => setIsUsageModalOpen(false)} className="text-ink-soft hover:text-ink">
                ✕
              </button>
            </div>

            {/* Asset Preview */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-mist/20 border border-mist">
              {selectedAsset.fileType.startsWith("image/") ? (
                <Image src={selectedAsset.url} alt={selectedAsset.title} fill className="object-contain" />
              ) : (
                <div className="grid h-full place-items-center text-ink-soft">
                  <FileText size={48} className="text-ulab" />
                  <span className="text-xs font-semibold mt-2">PDF Document</span>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Asset Title
                </label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Accessibility Alt Text
                </label>
                <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="mt-1" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateMetadata} disabled={isPending} className="text-xs px-3 py-1.5">
                  Update Metadata
                </Button>
              </div>
            </div>

            {/* Usage Tracking List */}
            <div className="rounded-xl border border-mist bg-surface/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Eye size={14} className="text-ulab" /> Active Content Referencing This Asset
              </h4>
              {assetUsages.length === 0 ? (
                <p className="mt-2 text-xs text-ink-soft">
                  No published or draft content currently references this asset. It is safe to archive or delete.
                </p>
              ) : (
                <ul className="mt-2 space-y-2 text-xs">
                  {assetUsages.map((usage, idx) => (
                    <li key={idx} className="flex items-center justify-between border-b border-mist/40 pb-1.5">
                      <span className="font-semibold text-ink">{usage.title}</span>
                      <Badge tone="blue">{usage.contentType}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Danger Zone: Delete Safeguard */}
            <div className="border-t border-mist/70 pt-4 flex items-center justify-between">
              {assetUsages.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <ShieldAlert size={16} />
                  <span>Deletion locked: Asset is used in {assetUsages.length} item(s).</span>
                </div>
              ) : (
                <div />
              )}

              <Button
                variant="ghost"
                disabled={assetUsages.length > 0 || isPending}
                onClick={() => handleDelete(selectedAsset)}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 size={14} className="mr-1" /> Delete Asset
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

