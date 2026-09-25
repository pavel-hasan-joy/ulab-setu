import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { NewJobForm } from "./new-job-form";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJob() {
  const user = await requireUser("ALUMNI");
  if (user.status !== "APPROVED") redirect("/alumni");
  return <NewJobForm company={user.company ?? ""} />;
}
