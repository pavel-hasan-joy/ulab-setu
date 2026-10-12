import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_URL) {
  try {
    console.log("DATABASE_URL found, synchronizing database schema via prisma db push...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("Database schema synchronized successfully.");

    // Clean up expired jobs and extra demo jobs from live database
    const db = new PrismaClient();
    try {
      // 1. Delete jobs with expired deadline
      const expired = await db.job.deleteMany({
        where: {
          deadline: {
            not: null,
            lt: new Date(),
          },
        },
      });
      if (expired.count > 0) {
        console.log(`Cleaned up ${expired.count} expired deadline jobs.`);
      }

      // 2. Remove extra demo jobs, keeping only the 2 main demo jobs
      const extraDemoTitles = [
        "Management Trainee, Marketing",
        "Graduate Engineer, Substations",
        "Editorial Intern",
        "Field Research Assistant",
        "Part-time Teaching Assistant",
        "Research Assistant, ML Lab",
      ];
      const deletedDemo = await db.job.deleteMany({
        where: {
          title: { in: extraDemoTitles },
        },
      });
      if (deletedDemo.count > 0) {
        console.log(`Removed ${deletedDemo.count} extra demo jobs.`);
      }
    } catch (cleanupErr) {
      console.warn("Live DB job cleanup warning:", cleanupErr?.message || cleanupErr);
    } finally {
      await db.$disconnect();
    }
  } catch (err) {
    console.warn("prisma db push warning:", err?.message || err);
  }
} else {
  console.log("No DATABASE_URL set, skipping database push.");
}
