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
    label: "Applied",
    tone: "blue",
    description: "Your application has been received and queued for recruiter review.",
    stageIndex: 1,
  },
  VIEWED: {
    label: "Viewed",
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
    label: "Selected 🎉",
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

/** Determines if a student is permitted to withdraw their application */
export function canWithdrawApplication(status: string | null | undefined): boolean {
  if (!status) return false;
  return status === "APPLIED" || status === "VIEWED";
}

/** Determines if a status is terminal / finalized */
export function isTerminalStatus(status: string | null | undefined): boolean {
  return status === "SELECTED" || status === "REJECTED" || status === "WITHDRAWN";
}
