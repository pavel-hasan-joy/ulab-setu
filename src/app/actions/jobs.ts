"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoster, requireUser } from "@/lib/auth";
import { cleanExpiredJobs } from "@/lib/jobs";
import { cleanLinkedIn } from "@/lib/contact";
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
  const { user, base } = await requirePoster();
  if (user.status !== "APPROVED") return { error: "You can post jobs once your account is verified by the alumni office." };

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { deadline, referral, ...data } = parsed.data;
  if (deadline && new Date(deadline).getTime() < Date.now()) {
    return fail("Deadline cannot be in the past.", raw);
  }

  await cleanExpiredJobs();
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
  revalidatePath(base);
  redirect(`${base}/jobs?posted=1`);
}

export async function toggleJob(jobId: string) {
  const { user, base } = await requirePoster();
  await cleanExpiredJobs();
  const job = await db.job.findFirst({ where: { id: jobId, postedById: user.id } });
  if (!job) return;
  await db.job.update({ where: { id: jobId }, data: { active: !job.active } });
  revalidatePath(`${base}/jobs`);
}

export async function applyToJob(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("STUDENT");
  const jobId = String(formData.get("jobId"));
  const coverNote = String(formData.get("note") ?? formData.get("coverNote") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  let linkedin = String(formData.get("linkedin") ?? "").trim();
  let portfolio = String(formData.get("portfolio") ?? "").trim();
  const availability = String(formData.get("availability") ?? "").trim();
  const cvFileName = String(formData.get("cvFileName") ?? "").trim();
  let cvUrl = String(formData.get("cvUrl") ?? "").trim();
  const cvData = String(formData.get("cvData") ?? "").trim();

  if (linkedin) {
    linkedin = cleanLinkedIn(linkedin) ?? linkedin;
  }
  if (portfolio) {
    if (!portfolio.startsWith("http://") && !portfolio.startsWith("https://")) {
      if (portfolio.startsWith("github.com/")) {
        portfolio = `https://${portfolio}`;
      } else if (!portfolio.includes(".") && !portfolio.includes("/")) {
        portfolio = `https://github.com/${portfolio.replace(/^@/, "")}`;
      } else {
        portfolio = `https://${portfolio}`;
      }
    }
  }
  if (cvUrl && !cvUrl.startsWith("http://") && !cvUrl.startsWith("https://")) {
    cvUrl = `https://${cvUrl}`;
  }

  await cleanExpiredJobs();
  const job = await db.job.findFirst({
    where: {
      id: jobId,
      active: true,
      OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
    },
  });
  if (!job) return { error: "This job is no longer open or its deadline has passed." };

  if (!coverNote && !cvData && !cvUrl) {
    return { error: "Please write why you're a good fit or attach your CV before submitting." };
  }

  // Auto-sync phone or linkedin to user profile if newly provided
  if ((phone && !user.phone) || (linkedin && !user.linkedin)) {
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(phone && !user.phone ? { phone } : {}),
        ...(linkedin && !user.linkedin ? { linkedin } : {}),
      },
    }).catch(() => {});
  }

  const structuredPayload = JSON.stringify({
    coverNote: coverNote || null,
    phone: phone || user.phone || null,
    email: user.email,
    name: user.name,
    department: user.department,
    batch: user.batch,
    studentId: user.studentId,
    linkedin: linkedin || user.linkedin || null,
    portfolio: portfolio || null,
    availability: availability || null,
    cvFileName: cvFileName || null,
    cvUrl: cvUrl || null,
    cvData: cvData || null,
  });

  await db.application.upsert({
    where: { jobId_studentId: { jobId, studentId: user.id } },
    create: { jobId, studentId: user.id, note: structuredPayload },
    update: { note: structuredPayload },
  });
  revalidatePath(`/student/jobs/${jobId}`);
  revalidatePath("/student/applications");
  return {};
}

export async function setApplicationStatus(applicationId: string, status: "SHORTLISTED" | "REJECTED" | "APPLIED") {
  const { user, base } = await requirePoster();
  const app = await db.application.findFirst({
    where: { id: applicationId, job: { postedById: user.id } },
  });
  if (!app) return;
  await db.application.update({ where: { id: applicationId }, data: { status } });
  revalidatePath(`${base}/jobs/${app.jobId}`);
}
