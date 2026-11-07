export type ApplicationStatus =
  | "APPLIED"
  | "VIEWED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

export const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    tone: "blue" | "sage" | "gold" | "rose" | "gray" | "lilac";
    description: string;
    stageIndex: number;
  }
> = {
  APPLIED: {
    label: "Application Submitted",
    tone: "blue",
    description: "Your application has been received and queued for recruiter review.",
    stageIndex: 1,
  },
  VIEWED: {
    label: "Under Review",
    tone: "lilac",
    description: "The hiring alumni has opened and reviewed your profile and CV.",
    stageIndex: 2,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    tone: "gold",
    description: "Congratulations! Your profile has been moved to the candidate shortlist.",
    stageIndex: 3,
  },
  INTERVIEW: {
    label: "Interview Scheduled",
    tone: "blue",
    description: "You have been invited for an interview. Please review the schedule and venue details below.",
    stageIndex: 4,
  },
  SELECTED: {
    label: "Selected",
    tone: "sage",
    description: "Congratulations! You have been selected or offered the position.",
    stageIndex: 5,
  },
  REJECTED: {
    label: "Rejected",
    tone: "rose",
    description: "The employer decided not to move forward with this application at this time.",
    stageIndex: 5,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    tone: "gray",
    description: "You have voluntarily withdrawn your application for this position.",
    stageIndex: 0,
  },
};

export type InterviewSchedule = {
  interviewDate?: Date | string | null;
  interviewTime?: string | null;
  interviewType?: "Physical" | "Online" | string | null;
  interviewLocation?: string | null;
  interviewMeetingLink?: string | null;
  interviewMessage?: string | null;
  interviewScheduledAt?: Date | string | null;
  interviewCancelledAt?: Date | string | null;
};

/**
 * Formats date and time into Asia/Dhaka local display format.
 */
export function formatDhakaDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Checks if an application can have an interview scheduled.
 * Rejection and Withdrawn states strictly block interview scheduling.
 */
export function canScheduleInterview(status: string | null | undefined): boolean {
  if (!status) return true;
  return status !== "REJECTED" && status !== "WITHDRAWN" && status !== "SELECTED";
}

export type ProjectLink = {
  id?: string;
  title?: string | null;
  url: string;
};

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
  projects?: ProjectLink[] | null;
  isStructured?: boolean;
};

/**
 * Validates and sanitizes a project URL submitted in an application.
 * Rejects javascript:, data:, and all non-HTTP/HTTPS URLs.
 * Trims excess whitespace and validates domain format.
 */
export function validateProjectUrl(rawUrl: unknown): {
  valid: boolean;
  url: string;
  error?: string;
} {
  if (typeof rawUrl !== "string") {
    return { valid: false, url: "", error: "Project URL must be a valid text string." };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, url: "", error: "Project URL cannot be blank." };
  }

  if (trimmed.length > 1000) {
    return { valid: false, url: "", error: "Project URL exceeds the 1000 character limit." };
  }

  // Reject unsafe schemes explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return {
      valid: false,
      url: "",
      error: "Unsafe URL scheme detected. Only HTTP and HTTPS web addresses are permitted.",
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        url: "",
        error: "Invalid protocol. Only HTTP and HTTPS URLs are allowed (e.g. https://...).",
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return {
        valid: false,
        url: "",
        error: "Invalid domain address in project URL.",
      };
    }

    return { valid: true, url: trimmed };
  } catch {
    return {
      valid: false,
      url: "",
      error: "Please enter a valid HTTP or HTTPS URL (e.g. https://github.com/your-project).",
    };
  }
}

/**
 * Sanitizes project title to prevent abuse or excessive length.
 */
export function sanitizeProjectTitle(rawTitle: unknown): string | null {
  if (typeof rawTitle !== "string") return null;
  const trimmed = rawTitle.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 150);
}

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

/** Determines if a student is permitted to withdraw their application */
export function canWithdrawApplication(status: string | null | undefined): boolean {
  if (!status) return false;
  return status === "APPLIED" || status === "VIEWED";
}

/** Determines if a status is terminal / finalized */
export function isTerminalStatus(status: string | null | undefined): boolean {
  return status === "SELECTED" || status === "REJECTED" || status === "WITHDRAWN";
}
