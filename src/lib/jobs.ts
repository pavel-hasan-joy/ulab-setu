import { db } from "./db";

export type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "EXPIRED" | "REMOVED";

export const JOB_STATUS_LABELS: Record<JobStatus, { label: string; tone: "emerald" | "amber" | "gray" | "rose" | "indigo" | "gold" }> = {
  PUBLISHED: { label: "Published", tone: "emerald" },
  DRAFT: { label: "Draft", tone: "gray" },
  PAUSED: { label: "Paused", tone: "amber" },
  CLOSED: { label: "Closed", tone: "gray" },
  EXPIRED: { label: "Expired", tone: "rose" },
  REMOVED: { label: "Removed", tone: "rose" },
};

let lastSyncTimestamp = 0;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown to prevent blocking DB writes on page navigation

/**
 * Automatically transitions any published job whose application deadline has passed
 * to EXPIRED status, setting active to false so students can no longer apply while
 * preserving application data and metrics for the posting alumni.
 */
export async function syncExpiredJobs(): Promise<number> {
  const nowMs = Date.now();
  if (nowMs - lastSyncTimestamp < SYNC_COOLDOWN_MS) {
    return 0; // Skip redundant DB writes
  }
  lastSyncTimestamp = nowMs;

  const now = new Date();
  try {
    const result = await db.job.updateMany({
      where: {
        deadline: {
          not: null,
          lt: now,
        },
        status: {
          in: ["PUBLISHED", "PAUSED"],
        },
      },
      data: {
        status: "EXPIRED",
        active: false,
      },
    });
    return result.count;
  } catch (err) {
    console.error("Error auto-updating expired jobs:", err);
    return 0;
  }
}

/** Backward-compatible alias for existing callers */
export const cleanExpiredJobs = syncExpiredJobs;

/**
 * Filter condition to ensure that only published, active jobs with valid (non-expired)
 * deadlines are returned to students.
 */
export function activeDeadlineCondition() {
  const now = new Date();
  return {
    OR: [
      { deadline: null },
      { deadline: { gte: now } },
    ],
  };
}

/** Check if a job is actively accepting student applications */
export function isJobAcceptingApplications(job: {
  status?: string | null;
  active?: boolean;
  deadline?: Date | string | null;
  deletedAt?: Date | string | null;
}): boolean {
  if (job.deletedAt) return false;
  if (job.status && job.status !== "PUBLISHED") return false;
  if (job.active === false) return false;
  if (job.deadline) {
    const deadlineTime = new Date(job.deadline).getTime();
    if (deadlineTime < Date.now()) return false;
  }
  return true;
}
