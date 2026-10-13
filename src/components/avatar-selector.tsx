"use client";

import { useState, useRef } from "react";
import { Camera, Check, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { Avatar, Button } from "./ui";

export function AvatarSelector({
  name,
  currentImage,
  onChange,
}: {
  name: string;
  currentImage?: string | null;
  onChange: (image: string | null) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImage ?? null);
  const [mode, setMode] = useState<"presets" | "upload">("presets");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (src: string | null) => {
    setSelectedImage(src);
    onChange(src);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Max 3MB for avatar images
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Image must be smaller than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setSelectedImage(dataUri);
      onChange(dataUri);
    };
    reader.onerror = () => {
      setUploadError("Failed to read image.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-mist p-5 bg-surface space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Camera size={15} className="text-ulab" /> Profile Picture & Avatar
          </h4>
          <p className="text-xs text-ink-soft">
            Choose a stylish university avatar or upload your own photo.
          </p>
        </div>
        {selectedImage && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="text-xs font-medium text-rose hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw size={11} /> Reset to Initials
          </button>
        )}
      </div>

      {/* Preview and Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
        <div className="relative group">
          <Avatar name={name || "?"} size={76} src={selectedImage} className="ring-4 ring-mist/60 shadow-soft" />
          {selectedImage && (
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-sage text-white text-[10px] shadow-xs">
              <Check size={12} />
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="flex rounded-xl border border-mist bg-paper/60 p-1 w-fit">
            <button
              type="button"
              onClick={() => setMode("presets")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "presets"
                  ? "bg-surface text-ink shadow-soft"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Sparkles size={13} className="text-gold-ink" /> Curated Avatars
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "upload"
                  ? "bg-surface text-ink shadow-soft"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Upload size={13} className="text-ulab" /> Upload Photo
            </button>
          </div>

          {mode === "presets" ? (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-1">
              {AVATAR_PRESETS.map((p) => {
                const isSelected = selectedImage === p.svg;
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={p.label}
                    onClick={() => handleSelect(p.svg)}
                    className={`group relative aspect-square rounded-full p-1 transition-all hover:scale-105 ${
                      isSelected
                        ? "ring-2 ring-ulab shadow-md scale-105"
                        : "ring-1 ring-mist/50 hover:ring-ulab-light"
                    }`}
                  >
                    <img src={p.svg} alt={p.label} className="size-full rounded-full object-cover" />
                    {isSelected && (
                      <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/20 text-white">
                        <Check size={14} className="stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                id="avatar-photo-input"
              />
              <label
                htmlFor="avatar-photo-input"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-mist bg-paper/50 px-4 py-3 text-center transition hover:border-ulab hover:bg-sky/20"
              >
                <Upload size={16} className="text-ulab" />
                <span className="text-xs font-semibold text-ink">Choose image from your computer / phone</span>
              </label>
              {uploadError && <p className="text-[11px] text-rose">{uploadError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
