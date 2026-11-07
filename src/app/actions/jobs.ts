"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoster, requireUser } from "@/lib/auth";
import { syncExpiredJobs, isJobAcceptingApplications, type JobStatus } from "@/lib/jobs";
import { cleanLinkedIn } from "@/lib/contact";
import { checkActionRateLimit } from "@/lib/rate-limit";
import { validateProjectUrl, sanitizeProjectTitle } from "@/lib/applications";
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
  const useSavedCv = formData.get("useSavedCv") === "on" || formData.get("useSavedCv") === "true";
  const saveCvToProfile = formData.get("saveCvToProfile") === "on" || formData.get("saveCvToProfile") === "true";

  if (linkedin) {
    linkedin = cleanLinkedIn(linkedin) ?? linkedin;
  }
  if (portfolio) {
    portfolio = sanitizeUrl(portfolio) ?? portfolio;
  }
  if (cvUrl) {
    cvUrl = sanitizeUrl(cvUrl) ?? cvUrl;
  }

  // Prevent duplicate application
  const existingApp = await db.application.findUnique({
    where: { jobId_studentId: { jobId, studentId: user.id } },
  });
  if (existingApp && existingApp.status !== "WITHDRAWN") {
    return { error: "You have already submitted an application for this job posting." };
  }

  await syncExpiredJobs();
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      active: true,
      status: true,
      deadline: true,
      deletedAt: true,
      postedById: true,
      title: true,
      company: true,
    },
  });

  if (!job || !isJobAcceptingApplications(job)) {
    return { error: "This job is no longer open or its deadline has passed." };
  }

  // Handle saved CV resolution
  let finalCvFileName = cvFileName;
  let finalCvUrl = cvUrl;
  const finalCvData = cvData;

  if (useSavedCv && user.savedCvUrl) {
    finalCvFileName = user.savedCvName || "Saved_Resume.pdf";
    finalCvUrl = user.savedCvUrl;
  }

  if (!coverNote && !finalCvData && !finalCvUrl) {
    return { error: "Please write why you're a good fit or attach your CV before submitting." };
  }

  // Save CV to user profile for 1-click future reuse if requested
  if (saveCvToProfile && (finalCvUrl || finalCvData)) {
    await db.user.update({
      where: { id: user.id },
      data: {
        savedCvUrl: finalCvUrl || finalCvData,
        savedCvName: finalCvFileName || "My_Resume.pdf",
        savedCvDate: new Date(),
      },
    }).catch(() => {});
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

  // Extract and validate optional project links
  const projectLinksRaw = formData.get("projectLinks");
  const validatedProjects: Array<{ title: string | null; url: string }> = [];

  if (typeof projectLinksRaw === "string" && projectLinksRaw.trim()) {
    try {
      const parsedProjects = JSON.parse(projectLinksRaw);
      if (Array.isArray(parsedProjects)) {
        for (const p of parsedProjects) {
          if (!p || typeof p !== "object") continue;
          const urlRaw = typeof p.url === "string" ? p.url.trim() : "";
          if (!urlRaw) continue; // Optional empty fields are skipped

          const urlCheck = validateProjectUrl(urlRaw);
          if (!urlCheck.valid) {
            return { error: `Project Link Error: ${urlCheck.error}` };
          }

          const cleanTitle = sanitizeProjectTitle(p.title);
          validatedProjects.push({
            title: cleanTitle,
            url: urlCheck.url,
          });
        }
      }
    } catch {
      return { error: "Malformed project links data." };
    }
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
    cvFileName: finalCvFileName || null,
    cvUrl: finalCvUrl || null,
    cvData: finalCvData || null,
    projects: validatedProjects.length > 0 ? validatedProjects : null,
  });

  const savedApp = await db.application.upsert({
    where: { jobId_studentId: { jobId, studentId: user.id } },
    create: {
      jobId,
      studentId: user.id,
      note: structuredPayload,
      status: "APPLIED",
      statusUpdatedAt: new Date(),
    },
    update: {
      note: structuredPayload,
      status: "APPLIED",
      withdrawnAt: null,
      statusUpdatedAt: new Date(),
    },
  });

  // Synchronize normalized child table ApplicationProject
  await db.applicationProject.deleteMany({
    where: { applicationId: savedApp.id },
  }).catch(() => {});

  if (validatedProjects.length > 0) {
    await db.applicationProject.createMany({
      data: validatedProjects.map((p) => ({
        applicationId: savedApp.id,
        title: p.title,
        url: p.url,
      })),
    }).catch(() => {});
  }

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
  revalidatePath(`/alumni/jobs/${jobId}`);
  return {};
}

export async function withdrawApplication(applicationId: string) {
  const user = await requireUser("STUDENT");
  const app = await db.application.findFirst({
    where: { id: applicationId, studentId: user.id },
    include: { job: { select: { title: true, id: true, postedById: true } } },
  });

  if (!app) return { error: "Application record not found." };
  if (app.status !== "APPLIED" && app.status !== "VIEWED") {
    return { error: `Applications marked as "${app.status}" cannot be withdrawn.` };
  }

  await db.application.update({
    where: { id: applicationId },
    data: {
      status: "WITHDRAWN",
      withdrawnAt: new Date(),
      statusUpdatedAt: new Date(),
    },
  });

  // Notify the job poster
  await db.notification.create({
    data: {
      userId: app.job.postedById,
      actorId: user.id,
      title: "Application Withdrawn",
      body: `${user.name} has withdrawn their application for "${app.job.title}".`,
      type: "APPLICATION",
      link: `/alumni/jobs/${app.job.id}`,
    },
  }).catch(() => {});

  revalidatePath("/student/applications");
  revalidatePath(`/student/jobs/${app.job.id}`);
  revalidatePath(`/alumni/jobs/${app.job.id}`);
  return { success: true };
}

export async function setApplicationStatus(
  applicationId: string,
  status: "APPLIED" | "VIEWED" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED",
  interviewNotes?: string
) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const base = user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/alumni";
  const whereClause = user.role === "ADMIN"
    ? { id: applicationId }
    : { id: applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
    include: { job: { select: { title: true, id: true, postedById: true, company: true } } },
  });
  if (!app) return { error: "Application not found or unauthorized" };

  // Block interview transition for rejected applications
  if (status === "INTERVIEW" && app.status === "REJECTED") {
    return { error: "Cannot schedule an interview for a rejected applicant. Please reopen the application first." };
  }

  await db.application.update({
    where: { id: applicationId },
    data: {
      status,
      statusUpdatedAt: new Date(),
      ...(interviewNotes ? { hiringNotes: interviewNotes.trim() } : {}),
    },
  });

  // Formulate human-friendly in-app notification for the student
  let notificationTitle = "Application Update";
  let notificationBody = `Your application for "${app.job.title}" has been updated to ${status}.`;

  if (status === "SHORTLISTED") {
    notificationTitle = "Application Shortlisted! 🎉";
    notificationBody = `Great news! You have been shortlisted for "${app.job.title}".`;
  } else if (status === "INTERVIEW") {
    notificationTitle = "Interview Invitation 💼";
    notificationBody = `You have been invited for an interview for "${app.job.title}". Check your application details for schedule and venue!`;
  } else if (status === "SELECTED") {
    notificationTitle = "Congratulations! Selected for Role 🌟";
    notificationBody = `Congratulations! You have been selected for the position of "${app.job.title}".`;
  } else if (status === "VIEWED") {
    notificationTitle = "Application Reviewed 👀";
    notificationBody = `The recruiter reviewed your CV and profile for "${app.job.title}".`;
  } else if (status === "REJECTED") {
    notificationTitle = `Application Update: ${app.job.title}`;
    notificationBody = `Thank you for applying for "${app.job.title}" at ${app.job.company}. The employer decided not to move forward with this application at this time.`;
  }

  await db.notification.create({
    data: {
      userId: app.studentId,
      actorId: user.id,
      title: notificationTitle,
      body: notificationBody,
      type: "APPLICATION",
      link: `/student/applications`,
    },
  }).catch(() => {});

  revalidatePath(`${base}/jobs/${app.job.id}`);
  revalidatePath(`/student/applications`);
  return { success: true };
}

export type ScheduleInterviewInput = {
  applicationId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM" or "14:30"
  location: string;
  type: "Physical" | "Online";
  meetingLink?: string;
  message?: string;
};

/**
 * Schedules or reschedules an interview with date, time, location, type, and optional meeting link.
 * Strictly enforces Asia/Dhaka timezone, ownership checks, future-time checks, and notification dispatch.
 */
export async function scheduleInterview(input: ScheduleInterviewInput) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const base = user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/alumni";
  const whereClause = user.role === "ADMIN"
    ? { id: input.applicationId }
    : { id: input.applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
    include: {
      job: { select: { id: true, title: true, company: true, postedById: true } },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  if (!app) return { error: "Application not found or unauthorized." };

  if (app.status === "REJECTED") {
    return { error: "Cannot schedule an interview for a rejected application. Reopen application first." };
  }
  if (app.status === "WITHDRAWN") {
    return { error: "Cannot schedule an interview for an application that has been withdrawn." };
  }

  const dateStr = (input.date || "").trim();
  const timeStr = (input.time || "").trim();
  const locationStr = (input.location || "").trim();
  const typeStr = input.type === "Online" ? "Online" : "Physical";
  const meetingLinkStr = (input.meetingLink || "").trim();
  const messageStr = (input.message || "").trim();

  if (!dateStr) return { error: "Interview date is required." };
  if (!timeStr) return { error: "Interview time is required." };
  if (!locationStr) return { error: "Interview location / place is required." };

  // Parse YYYY-MM-DD
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  // Parse hours and minutes
  let hours = 10;
  let minutes = 0;
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  // Build Date object in Asia/Dhaka (+06:00)
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoDhaka = `${dateStr}T${pad(hours)}:${pad(minutes)}:00+06:00`;
  const scheduledDate = new Date(isoDhaka);

  if (isNaN(scheduledDate.getTime())) {
    return { error: "Invalid interview date or time." };
  }

  // Must not be in the past (allow 2-minute buffer)
  const now = new Date();
  if (scheduledDate.getTime() < now.getTime() - 2 * 60 * 1000) {
    return { error: "Interview date and time cannot be in the past." };
  }

  const isReschedule = app.status === "INTERVIEW" && app.interviewDate != null;

  await db.application.update({
    where: { id: input.applicationId },
    data: {
      status: "INTERVIEW",
      statusUpdatedAt: new Date(),
      interviewDate: scheduledDate,
      interviewTime: timeStr,
      interviewType: typeStr,
      interviewLocation: locationStr,
      interviewMeetingLink: meetingLinkStr || null,
      interviewMessage: messageStr || null,
      interviewScheduledAt: new Date(),
      interviewCancelledAt: null,
    },
  });

  // Human readable date in Asia/Dhaka
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(scheduledDate);

  const notifTitle = isReschedule
    ? `Interview Rescheduled: ${app.job.title}`
    : `Interview Invitation: ${app.job.title} 💼`;

  const notifBody = isReschedule
    ? `Your interview for "${app.job.title}" has been rescheduled to ${formattedDate} at ${timeStr} (${typeStr}). Location: ${locationStr}.`
    : `You are invited for an interview on ${formattedDate} at ${timeStr} (${typeStr}). Location: ${locationStr}. Check your applications for full details!`;

  await db.notification.create({
    data: {
      userId: app.studentId,
      actorId: user.id,
      title: notifTitle,
      body: notifBody,
      type: "APPLICATION",
      link: "/student/applications",
    },
  }).catch(() => {});

  revalidatePath(`${base}/jobs/${app.job.id}`);
  revalidatePath("/student/applications");
  revalidatePath(`/student/jobs/${app.job.id}`);
  return { success: true, isReschedule };
}

/**
 * Cancels a scheduled interview and moves application back to candidate review.
 */
export async function cancelInterview(applicationId: string, reason?: string) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const base = user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/alumni";
  const whereClause = user.role === "ADMIN"
    ? { id: applicationId }
    : { id: applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
    include: {
      job: { select: { id: true, title: true, company: true } },
    },
  });

  if (!app) return { error: "Application not found or unauthorized." };
  if (app.status !== "INTERVIEW") {
    return { error: "This application does not currently have a scheduled interview." };
  }

  const reasonStr = (reason || "").trim();

  await db.application.update({
    where: { id: applicationId },
    data: {
      status: "SHORTLISTED",
      statusUpdatedAt: new Date(),
      interviewCancelledAt: new Date(),
      ...(reasonStr ? { hiringNotes: app.hiringNotes ? `${app.hiringNotes}\n[Cancellation Note]: ${reasonStr}` : `[Cancellation Note]: ${reasonStr}` } : {}),
    },
  });

  await db.notification.create({
    data: {
      userId: app.studentId,
      actorId: user.id,
      title: `Interview Cancelled: ${app.job.title}`,
      body: `Your scheduled interview for "${app.job.title}" has been cancelled. ${reasonStr ? `Reason: ${reasonStr}` : "The recruiter will update you if a new date opens."}`,
      type: "APPLICATION",
      link: "/student/applications",
    },
  }).catch(() => {});

  revalidatePath(`${base}/jobs/${app.job.id}`);
  revalidatePath("/student/applications");
  revalidatePath(`/student/jobs/${app.job.id}`);
  return { success: true };
}

/**
 * Rejects an applicant with an optional private internal hiring note.
 * Never leaks private recruiter notes to the applicant.
 */
export async function rejectApplication(applicationId: string, internalNotes?: string) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const base = user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/alumni";
  const whereClause = user.role === "ADMIN"
    ? { id: applicationId }
    : { id: applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
    include: {
      job: { select: { id: true, title: true, company: true } },
    },
  });

  if (!app) return { error: "Application not found or unauthorized." };

  const notesStr = (internalNotes || "").trim();

  await db.application.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      statusUpdatedAt: new Date(),
      ...(notesStr ? { hiringNotes: notesStr } : {}),
    },
  });

  await db.notification.create({
    data: {
      userId: app.studentId,
      actorId: user.id,
      title: `Application Update: ${app.job.title}`,
      body: `Thank you for taking the time to apply for "${app.job.title}" at ${app.job.company}. The employer decided to move forward with other candidates.`,
      type: "APPLICATION",
      link: "/student/applications",
    },
  }).catch(() => {});

  revalidatePath(`${base}/jobs/${app.job.id}`);
  revalidatePath("/student/applications");
  revalidatePath(`/student/jobs/${app.job.id}`);
  return { success: true };
}

export async function updateApplicationHiringNotes(applicationId: string, hiringNotes: string) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const whereClause = user.role === "ADMIN"
    ? { id: applicationId }
    : { id: applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
  });
  if (!app) return { error: "Application not found or unauthorized" };

  await db.application.update({
    where: { id: applicationId },
    data: { hiringNotes: hiringNotes.trim() || null },
  });

  return { success: true };
}

export async function markApplicationViewed(applicationId: string) {
  const user = await requireUser(["ALUMNI", "TEACHER", "ADMIN"]);
  const whereClause = user.role === "ADMIN"
    ? { id: applicationId }
    : { id: applicationId, job: { postedById: user.id } };

  const app = await db.application.findFirst({
    where: whereClause,
    include: { job: { select: { title: true } } },
  });
  if (!app) return;

  if (app.status === "APPLIED") {
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "VIEWED",
        viewedAt: new Date(),
        statusUpdatedAt: new Date(),
      },
    });

    await db.notification.create({
      data: {
        userId: app.studentId,
        actorId: user.id,
        title: "Application Reviewed 👀",
        body: `The recruiter reviewed your CV for "${app.job.title}".`,
        type: "APPLICATION",
        link: `/student/applications`,
      },
    }).catch(() => {});
  }
}
