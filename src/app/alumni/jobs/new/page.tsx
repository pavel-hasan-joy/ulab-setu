import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePoster } from "@/lib/auth";
import { NewJobForm } from "./new-job-form";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJob() {
  const { user, base } = await requirePoster();
  if (user.status !== "APPROVED") redirect(base);
  return <NewJobForm company={user.company ?? ""} />;
}
