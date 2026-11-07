import { db } from "./db";

export type JobStatus = "DRAFT" | "PUBLISHED" | "FILLED" | "PAUSED" | "CLOSED" | "EXPIRED" | "REMOVED";

export const FULL_CAPACITY_NOTIFICATION_BODY =
  "Thank you for your interest in this position. The job has currently reached its hiring capacity, and the maximum number of candidates has been selected. Your application remains on record. If a selected candidate is later rejected or a position becomes available before the application deadline, your application may be reconsidered. No additional application is required.";

export const REOPENED_NOTIFICATION_BODY =
  "An additional hiring opportunity has become available for this position. Your existing application remains under consideration.";

export const JOB_STATUS_LABELS: Record<JobStatus, { label: string; tone: "emerald" | "amber" | "gray" | "rose" | "indigo" | "gold" | "lilac" }> = {
  PUBLISHED: { label: "Published", tone: "emerald" },
  FILLED: { label: "Fully Filled", tone: "lilac" },
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
          in: ["PUBLISHED", "PAUSED", "FILLED"],
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
  hiringCapacity?: number | null;
  selectedCount?: number;
}): boolean {
  if (job.deletedAt) return false;
  if (job.status && job.status !== "PUBLISHED") return false;
  if (job.active === false) return false;
  if (job.deadline) {
    const deadlineTime = new Date(job.deadline).getTime();
    if (deadlineTime < Date.now()) return false;
  }
  if (job.hiringCapacity && job.selectedCount !== undefined && job.selectedCount >= job.hiringCapacity) {
    return false;
  }
  return true;
}

/**
 * Evaluates whether a job has reached its hiring capacity or can be reopened.
 * Handles automatic transition to FILLED or back to PUBLISHED, and dispatches
 * deduplicated notifications to affected non-rejected/non-withdrawn applicants.
 */
export async function syncJobCapacityStatus(
  tx: any,
  jobId: string,
  actorId?: string
): Promise<{
  status: JobStatus;
  selectedCount: number;
  hiringCapacity: number | null;
  transitionedToFilled: boolean;
  transitionedToReopened: boolean;
}> {
  const job = await tx.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      company: true,
      status: true,
      active: true,
      deadline: true,
      deletedAt: true,
      hiringCapacity: true,
      capacityFilledEvents: true,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const selectedCount = await tx.application.count({
    where: { jobId, status: "SELECTED" },
  });

  let transitionedToFilled = false;
  let transitionedToReopened = false;
  let currentStatus = job.status as JobStatus;

  // If hiringCapacity is configured and positive
  if (job.hiringCapacity && job.hiringCapacity > 0) {
    if (selectedCount >= job.hiringCapacity) {
      // Reached capacity: only transition if currently PUBLISHED or active
      if (job.status === "PUBLISHED" || (job.active && job.status !== "PAUSED" && job.status !== "CLOSED" && job.status !== "EXPIRED")) {
        currentStatus = "FILLED";
        transitionedToFilled = true;

        await tx.job.update({
          where: { id: jobId },
          data: {
            status: "FILLED",
            active: false,
            capacityFilledEvents: { increment: 1 },
          },
        });

        // Notify non-rejected, non-withdrawn, non-selected existing applicants
        const waitlistedApps = await tx.application.findMany({
          where: {
            jobId,
            status: { in: ["APPLIED", "VIEWED", "SHORTLISTED", "INTERVIEW"] },
          },
          select: { studentId: true },
        });

        for (const app of waitlistedApps) {
          await tx.notification.create({
            data: {
              userId: app.studentId,
              actorId: actorId || null,
              title: `Hiring Capacity Reached: ${job.title}`,
              body: FULL_CAPACITY_NOTIFICATION_BODY,
              type: "APPLICATION",
              link: `/student/applications`,
            },
          }).catch(() => {});
        }
      }
    } else {
      // selectedCount < job.hiringCapacity
      // Only automatically reopen if it was FILLED (do not override manual pause or closed)
      if (job.status === "FILLED") {
        const isExpired = job.deadline && job.deadline.getTime() < Date.now();
        if (isExpired) {
          currentStatus = "EXPIRED";
          await tx.job.update({
            where: { id: jobId },
            data: { status: "EXPIRED", active: false },
          });
        } else if (!job.deletedAt) {
          // Reopen the job!
          currentStatus = "PUBLISHED";
          transitionedToReopened = true;
          await tx.job.update({
            where: { id: jobId },
            data: { status: "PUBLISHED", active: true },
          });

          // Notify remaining eligible applicants that a spot reopened
          const waitlistedApps = await tx.application.findMany({
            where: {
              jobId,
              status: { in: ["APPLIED", "VIEWED", "SHORTLISTED", "INTERVIEW"] },
            },
            select: { studentId: true },
          });

          for (const app of waitlistedApps) {
            await tx.notification.create({
              data: {
                userId: app.studentId,
                actorId: actorId || null,
                title: `Opportunity Update: ${job.title}`,
                body: REOPENED_NOTIFICATION_BODY,
                type: "APPLICATION",
                link: `/student/applications`,
              },
            }).catch(() => {});
          }
        }
      }
    }
  }

  return {
    status: currentStatus,
    selectedCount,
    hiringCapacity: job.hiringCapacity,
    transitionedToFilled,
    transitionedToReopened,
  };
}
