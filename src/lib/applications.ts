export type ApplicationPayload = {
  coverNote?: string | null;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  department?: string | null;
  batch?: string | null;
  studentId?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  availability?: string | null;
  cvFileName?: string | null;
  cvUrl?: string | null;
  cvData?: string | null;
  isStructured?: boolean;
};

/**
 * Safely parses the application note field.
 * Supports structured JSON payload containing full professional details + CV,
 * while seamlessly supporting legacy plain-text notes.
 */
export function parseApplicationNote(raw: string | null): ApplicationPayload {
  if (!raw) return { isStructured: false };
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return { ...parsed, isStructured: true };
    }
  } catch {
    // Legacy plain string note
  }
  return { coverNote: raw, isStructured: false };
}
