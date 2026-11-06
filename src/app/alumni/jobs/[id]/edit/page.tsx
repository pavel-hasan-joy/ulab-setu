import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePoster } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditJobForm } from "@/components/edit-job-form";
import type { JobStatus } from "@/lib/jobs";

export const metadata: Metadata = { title: "Edit Job Posting | ULAB Setu" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, base } = await requirePoster();

  const job = await db.job.findUnique({
    where: { id },
  });

  if (!job || job.deletedAt) notFound();

  // Ensure only author or admin can access edit form
  if (job.postedById !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  const formattedJob = {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    category: job.category,
    description: job.description,
    requirements: job.requirements,
    skills: job.skills,
    salary: job.salary,
    experienceLevel: job.experienceLevel,
    deadline: job.deadline ? job.deadline.toISOString().split("T")[0] : null,
    externalUrl: job.externalUrl,
    contactEmail: job.contactEmail,
    referral: job.referral,
    status: (job.status as JobStatus) || (job.active ? "PUBLISHED" : "CLOSED"),
  };

  return <EditJobForm job={formattedJob} base={base} />;
}

