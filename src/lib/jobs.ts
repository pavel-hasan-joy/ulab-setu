import { db } from "./db";

/**
 * Automatically deletes any job whose application deadline has passed.
 * Thanks to Prisma cascade delete, any applications associated with expired jobs
 * are also deleted cleanly without leaving orphaned records.
 */
export async function cleanExpiredJobs(): Promise<number> {
  const now = new Date();
  try {
    const result = await db.job.deleteMany({
      where: {
        deadline: {
          not: null,
          lt: now,
        },
      },
    });
    return result.count;
  } catch (err) {
    console.error("Error auto-deleting expired jobs:", err);
    return 0;
  }
}

/**
 * Filter condition to ensure that only jobs with valid (non-expired) deadlines
 * are returned.
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
