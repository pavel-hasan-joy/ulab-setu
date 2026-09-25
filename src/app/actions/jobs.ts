"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, type FormState } from "./auth";

const jobSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title."),
  company: z.string().trim().min(1, "Enter the company name."),
  location: z.string().trim().min(1, "Enter a location."),
  type: z.string().min(1),
  category: z.string().min(1),
  description: z.string().trim().min(30, "Describe the role in at least 30 characters."),
  requirements: z.string().trim().optional(),
  salary: z.string().trim().optional(),
  deadline: z.string().optional(),
  referral: z.string().optional(),
});

export async function createJob(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("ALUMNI");
  if (user.status !== "APPROVED") return { error: "You can post jobs once your alumni account is verified." };

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { deadline, referral, ...data } = parsed.data;
  await db.job.create({
    data: {
      ...data,
      requirements: data.requirements || null,
      salary: data.salary || null,
      deadline: deadline ? new Date(deadline) : null,
      referral: referral === "on",
      postedById: user.id,
    },
  });
  revalidatePath("/alumni");
  redirect("/alumni/jobs?posted=1");
}

export async function toggleJob(jobId: string) {
  const user = await requireUser("ALUMNI");
  const job = await db.job.findFirst({ where: { id: jobId, postedById: user.id } });
  if (!job) return;
  await db.job.update({ where: { id: jobId }, data: { active: !job.active } });
  revalidatePath("/alumni/jobs");
}

export async function applyToJob(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("STUDENT");
  const jobId = String(formData.get("jobId"));
  const note = String(formData.get("note") ?? "").trim();

  const job = await db.job.findFirst({ where: { id: jobId, active: true } });
  if (!job) return { error: "This job is no longer open." };
  if (!user.skills || !user.bio) {
    return { error: "Add a short bio and your skills to your profile before applying." };
  }

  await db.application.upsert({
    where: { jobId_studentId: { jobId, studentId: user.id } },
    create: { jobId, studentId: user.id, note: note || null },
    update: {},
  });
  revalidatePath(`/student/jobs/${jobId}`);
  revalidatePath("/student/applications");
  return {};
}

export async function setApplicationStatus(applicationId: string, status: "SHORTLISTED" | "REJECTED" | "APPLIED") {
  const user = await requireUser("ALUMNI");
  const app = await db.application.findFirst({
    where: { id: applicationId, job: { postedById: user.id } },
  });
  if (!app) return;
  await db.application.update({ where: { id: applicationId }, data: { status } });
  revalidatePath(`/alumni/jobs/${app.jobId}`);
}
