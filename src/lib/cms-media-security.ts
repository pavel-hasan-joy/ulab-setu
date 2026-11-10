import { z } from "zod";

// Max upload size: 5MB for images/documents (safe for serverless/edge payload limits)
export const MAX_MEDIA_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"] as const;

export const MEDIA_FOLDERS = [
  "General",
  "Campus",
  "Banners",
  "Events",
  "Alumni",
  "Documents",
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const mediaMetadataSchema = z.object({
  title: z.string().trim().min(1, "Asset title is required").max(150),
  altText: z.string().trim().max(250).optional().or(z.literal("")),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  folder: z.string().trim().default("General"),
  isDecorative: z.boolean().default(false),
});

export type MediaMetadata = z.infer<typeof mediaMetadataSchema>;

/**
 * Validates a file's mime type and magic number signature to prevent executable spoofing.
 */
export function validateFileBuffer(
  buffer: Buffer,
  declaredMimeType: string
): { valid: boolean; detectedMime: string | null; error?: string } {
  if (buffer.length === 0) {
    return { valid: false, detectedMime: null, error: "Uploaded file is empty." };
  }

  if (buffer.length > MAX_MEDIA_FILE_SIZE) {
    return {
      valid: false,
      detectedMime: null,
      error: `File size exceeds the 5MB maximum limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // Magic bytes inspection
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // PNG: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  // GIF: 47 49 46 38
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  // WebP: RIFF ... WEBP
  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  // PDF: %PDF (25 50 44 46)
  const isPdf = buffer.toString("ascii", 0, 4) === "%PDF";

  let detectedMime: string | null = null;
  if (isJpeg) detectedMime = "image/jpeg";
  else if (isPng) detectedMime = "image/png";
  else if (isGif) detectedMime = "image/gif";
  else if (isWebp) detectedMime = "image/webp";
  else if (isPdf) detectedMime = "application/pdf";

  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      error: "File format could not be verified by binary inspection. Executable and script formats are strictly rejected.",
    };
  }

  if (declaredMimeType && declaredMimeType !== detectedMime) {
    // Tolerant check for jpeg variants (e.g. image/jpg vs image/jpeg)
    const isJpegVariant =
      (declaredMimeType === "image/jpg" || declaredMimeType === "image/jpeg") &&
      detectedMime === "image/jpeg";
    if (!isJpegVariant) {
      return {
        valid: false,
        detectedMime,
        error: `MIME type mismatch: declared '${declaredMimeType}' but detected '${detectedMime}'.`,
      };
    }
  }

  return { valid: true, detectedMime };
}

