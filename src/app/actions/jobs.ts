"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoster, requireUser } from "@/lib/auth";
import { syncExpiredJobs, isJobAcceptingApplications, type JobStatus } from "@/lib/jobs";
import { cleanLinkedIn } from "@/lib/contact";
import { checkActionRateLimit } from "@/lib/rate-limit";
import { fail, type FormState } from "./auth";

const jobSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title (at least 3 characters)."),
  company: z.string().trim().min(1, "Enter the hiring company or institution name."),
  location: z.string().trim().min(1, "Enter a location (e.g. Dhaka (Hybrid), Onsite, Remote)."),
  type: z.string().min(1, "Select an employment type."),
  category: z.string().min(1, "Select a job category."),
  description: z.string().trim().min(20, "Describe the role in at least 20 characters."),
  requirements: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  salary: z.string().trim().optional(),
  experienceLevel: z.string().trim().optional(),
  deadline: z.string().optional(),
  externalUrl: z.string().trim().optional(),
  referral: z.string().optional(),
  contactEmail: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED"]).optional(),
});

function sanitizeUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function createJob(_: FormState, formData: FormData): Promise<FormState> {
  const { user, base } = await requirePoster();
  if (user.status !== "APPROVED") {
    return { error: "You can post jobs once your account is verified by the alumni office." };
  }

  // Rate limit protection against automated spam submissions
  const rateCheck = checkActionRateLimit(`job-create-${user.id}`, 10, 60 * 1000);
  if (!rateCheck.allowed) {
    return { error: rateCheck.error };
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { deadline, referral, externalUrl, contactEmail, status: requestedStatus, ...data } = parsed.data;

  // Deadline validation: if published with a deadline, deadline must be in the future
  let deadlineDate: Date | null = null;
  if (deadline) {
    deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return fail("Please provide a valid application deadline.", raw);
    }
    if (deadlineDate.getTime() < Date.now() && requestedStatus !== "DRAFT") {
      return fail("Application deadline cannot be in the past for published jobs.", raw);
    }
  }

  // Validate contact email if provided
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return fail("Please enter a valid contact email address.", raw);
  }

  // Determine final status
  const finalStatus: JobStatus = requestedStatus === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const isActive = finalStatus === "PUBLISHED" && (!deadlineDate || deadlineDate.getTime() >= Date.now());

  await syncExpiredJobs();

  await db.job.create({
    data: {
      ...data,
      requirements: data.requirements || null,
      skills: data.skills || null,
      salary: data.salary || null,
      experienceLevel: data.experienceLevel || "Entry",
      deadline: deadlineDate,
      referral: referral === "on" || referral === "true",
      externalUrl: sanitizeUrl(externalUrl),
      contactEmail: contactEmail || null,
      status: finalStatus,
      active: isActive,
      postedById: user.id,
    },
  });

  revalidatePath(base);
  revalidatePath(`${base}/jobs`);
  revalidatePath("/student/jobs");
  revalidatePath("/admin/jobs");
  redirect(`${base}/jobs?posted=1`);
}

export async function updateJob(jobId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { user, base } = await requirePoster();
  
  const existingJob = await db.job.findUnique({
    where: { id: jobId },
    select: { id: true, postedById: true },
  });

  if (!existingJob) {
    return { error: "Job posting not found." };
  }

  // Strict authorization: Only the author or super admin can edit
  if (existingJob.postedById !== user.id && user.role !== "ADMIN") {
    return { error: "Unauthorized: You do not have permission to modify this job posting." };
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { deadline, referral, externalUrl, contactEmail, status: requestedStatus, ...data } = parsed.data;

  let deadlineDate: Date | null = null;
  if (deadline) {
    deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return fail("Please provide a valid application deadline.", raw);
    }
    if (deadlineDate.getTime() < Date.now() && requestedStatus === "PUBLISHED") {
      return fail("Application deadline cannot be in the past for published jobs.", raw);
    }
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return fail("Please enter a valid contact email address.", raw);
  }

  const finalStatus: JobStatus = (requestedStatus as JobStatus) || "PUBLISHED";
  const isActive = finalStatus === "PUBLISHED" && (!deadlineDate || deadlineDate.getTime() >= Date.now());

  await db.job.update({
    where: { id: jobId },
    data: {
      ...data,
      requirements: data.requirements || null,
      skills: data.skills || null,
      salary: data.salary || null,
      experienceLevel: data.experienceLevel || "Entry",
      deadline: deadlineDate,
      referral: referral === "on" || referral === "true",
      externalUrl: sanitizeUrl(externalUrl),
      contactEmail: contactEmail || null,
      status: finalStatus,
      active: isActive,
    },
  });

  revalidatePath(`${base}/jobs`);
  revalidatePath(`${base}/jobs/${jobId}`);
  revalidatePath(`/student/jobs/${jobId}`);
  revalidatePath("/student/jobs");
  revalidatePath("/admin/jobs");
  redirect(`${base}/jobs/${jobId}?updated=1`);
}

export async function setJobStatus(jobId: string, status: JobStatus) {
  const { user, base } = await requirePoster();
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) return { error: "Job not found" };

  if (job.postedById !== user.id && user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const isExpired = job.deadline && job.deadline.getTime() < Date.now();
  const newStatus = status === "PUBLISHED" && isExpired ? "EXPIRED" : status;
  const active = newStatus === "PUBLISHED";

  await db.job.update({
    where: { id: jobId },
    data: {
      status: newStatus,
      active,
      ...(status === "REMOVED" ? { deletedAt: new Date() } : {}),
    },
  });

  revalidatePath(`${base}/jobs`);
  revalidatePath(`${base}/jobs/${jobId}`);
  revalidatePath("/student/jobs");
  revalidatePath(`/student/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  return { success: true, status: newStatus };
}

export async function toggleJobReferral(jobId: string) {
  const { user, base } = await requirePoster();
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || (job.postedById !== user.id && user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const updated = await db.job.update({
    where: { id: jobId },
    data: { referral: !job.referral },
  });

  revalidatePath(`${base}/jobs`);
  revalidatePath(`${base}/jobs/${jobId}`);
  revalidatePath(`/student/jobs/${jobId}`);
  return { referral: updated.referral };
}

export async function deleteJob(jobId: string) {
  const { user, base } = await requirePoster();
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || (job.postedById !== user.id && user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  // Soft delete to preserve integrity of any existing audit logs or reports
  await db.job.update({
    where: { id: jobId },
    data: {
      status: "REMOVED",
      active: false,
      deletedAt: new Date(),
    },
  });

  revalidatePath(`${base}/jobs`);
  revalidatePath("/student/jobs");
  revalidatePath("/admin/jobs");
  redirect(`${base}/jobs`);
}

/** Backward-compatible toggle */
export async function toggleJob(jobId: string) {
  const { user, base } = await requirePoster();
  await syncExpiredJobs();
  const job = await db.job.findFirst({ where: { id: jobId, postedById: user.id } });
  if (!job) return;

  const nextActive = !job.active;
  const nextStatus = nextActive ? "PUBLISHED" : "CLOSED";

  await db.job.update({
    where: { id: jobId },
    data: { active: nextActive, status: nextStatus },
  });
  revalidatePath(`${base}/jobs`);
}

/** Student reports an inappropriate or spam job */
export async function reportJob(jobId: string, reason: string, details?: string) {
  const user = await requireUser();
  const rate = checkActionRateLimit(`report-job-${user.id}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return { error: rate.error };
  }

  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, company: true, postedById: true },
  });
  if (!job) return { error: "Job posting not found" };

  await db.userReport.create({
    data: {
      reporterId: user.id,
      reportedUserId: job.postedById,
      targetType: "JOB",
      targetId: jobId,
      reason: reason || "SPAM",
      details: details ? `${details.trim()} (Job: ${job.title} at ${job.company})` : `Reported job: ${job.title} at ${job.company}`,
      status: "PENDING",
    },
  });

  // Notify system administrators about the new job report
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "APPROVED" },
    select: { id: true },
    take: 5,
  });

  for (const admin of admins) {
    await db.notification.create({
      data: {
        userId: admin.id,
        actorId: user.id,
        title: "Job Report Received",
        body: `${user.name} reported job "${job.title}" at ${job.company} for ${reason}.`,
        type: "REPORT",
        link: `/admin/jobs?search=${encodeURIComponent(job.title)}`,
      },
    }).catch(() => {});
  }

  return { success: true };
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
    portfolio = sanitizeUrl(portfolio) ?? portfolio;
  }
  if (cvUrl) {
    cvUrl = sanitizeUrl(cvUrl) ?? cvUrl;
  }

  await syncExpiredJobs();
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { id: true, active: true, status: true, deadline: true, deletedAt: true, postedById: true, title: true, company: true },
  });

  if (!job || !isJobAcceptingApplications(job)) {
    return { error: "This job is no longer open or its deadline has passed." };
  }

  if (!coverNote && !cvData && !cvUrl) {
    return { error: "Please write why you're a good fit or attach your CV before submitting." };
  }

  // Auto-sync phone, linkedin, or github to user profile if newly provided
  const isGithubPortfolio = portfolio && portfolio.includes("github.com");
  if ((phone && !user.phone) || (linkedin && !user.linkedin) || (isGithubPortfolio && !user.github)) {
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(phone && !user.phone ? { phone } : {}),
        ...(linkedin && !user.linkedin ? { linkedin } : {}),
        ...(isGithubPortfolio && !user.github ? { github: portfolio } : {}),
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
    portfolio: portfolio || user.github || null,
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

  // Notify job poster of new application
  await db.notification.create({
    data: {
      userId: job.postedById,
      actorId: user.id,
      title: "New Application Received",
      body: `${user.name} applied for "${job.title}".`,
      type: "APPLICATION",
      link: `/alumni/jobs/${job.id}`,
    },
  }).catch(() => {});

  revalidatePath(`/student/jobs/${jobId}`);
  revalidatePath("/student/applications");
  return {};
}

export async function setApplicationStatus(applicationId: string, status: "SHORTLISTED" | "REJECTED" | "APPLIED") {
  const { user, base } = await requirePoster();
  const app = await db.application.findFirst({
    where: { id: applicationId, job: { postedById: user.id } },
    include: { job: { select: { title: true, id: true } } },
  });
  if (!app) return;

  await db.application.update({ where: { id: applicationId }, data: { status } });

  // In-app notification to the applicant
  await db.notification.create({
    data: {
      userId: app.studentId,
      actorId: user.id,
      title: status === "SHORTLISTED" ? "Application Shortlisted! 🎉" : "Application Update",
      body: status === "SHORTLISTED" 
        ? `Congratulations! You have been shortlisted for "${app.job.title}".`
        : `Your application status for "${app.job.title}" has been updated to ${status}.`,
      type: "APPLICATION",
      link: `/student/applications`,
    },
  }).catch(() => {});

  revalidatePath(`${base}/jobs/${app.jobId}`);
}
