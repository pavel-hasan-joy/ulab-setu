import { execSync } from "child_process";

if (process.env.DATABASE_URL) {
  try {
    console.log("DATABASE_URL found, synchronizing database schema via prisma db push...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("Database schema synchronized successfully.");
  } catch (err) {
    console.warn("prisma db push warning:", err?.message || err);
  }
} else {
  console.log("No DATABASE_URL set, skipping database push.");
}
