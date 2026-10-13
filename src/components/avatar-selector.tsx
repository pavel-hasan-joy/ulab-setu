"use client";

import { useState, useRef } from "react";
import { Camera, Check, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { Avatar, Button } from "./ui";

/** Resizes and compresses photo to a lightweight 256x256 square (typically ~20KB) */
function processAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 256;

        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        canvas.width = maxDim;
        canvas.height = maxDim;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

        // Convert to high-quality compressed JPEG (lightweight ~20KB)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        reject(new Error("Could not decode image"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (src: string | null) => {
    setSelectedImage(src);
    onChange(src);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);

    try {
      const compressedUri = await processAvatarFile(file);
      setSelectedImage(compressedUri);
      onChange(compressedUri);
    } catch {
      setUploadError("Failed to process image. Please try another photo.");
    } finally {
      setIsProcessing(false);
    }
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
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
                id="avatar-photo-input"
              />
              <label
                htmlFor="avatar-photo-input"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-mist bg-paper/50 px-4 py-3 text-center transition hover:border-ulab hover:bg-sky/20"
              >
                <Upload size={16} className="text-ulab" />
                <span className="text-xs font-semibold text-ink">
                  {isProcessing ? "Optimizing image…" : "Choose image from your computer / phone"}
                </span>
              </label>
              {uploadError && <p className="text-[11px] text-rose">{uploadError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
