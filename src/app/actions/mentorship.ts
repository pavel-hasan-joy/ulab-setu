"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-auth";
import { dispatchNotification } from "./notifications";

export const MENTORSHIP_TOPICS = [
  "Career Guidance",
  "Resume & CV Review",
  "Technical Interview Preparation",
  "Software Engineering Best Practices",
  "Industry & Role Transition",
  "Higher Studies & Scholarships",
  "Academic Research & Publications",
  "Startup & Entrepreneurship",
  "Networking & Communication",
] as const;

export type MentorshipTopic = (typeof MENTORSHIP_TOPICS)[number];

export type MentorshipStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type SessionFormat = "ONLINE" | "IN_PERSON" | "FLEXIBLE";

/** Update Alumni or Teacher Mentor Profile */
export async function updateMentorProfile(data: {
  isMentor: boolean;
  mentorAvailable: boolean;
  mentorTopics?: string[];
  mentorExpertise?: string;
  mentorSessionFormat?: string;
  mentorAvailabilityNote?: string;
  mentorMaxMentees?: number;
}) {
  const user = await requireUser();

  if (user.role !== "ALUMNI" && user.role !== "TEACHER" && user.role !== "ADMIN") {
    return { error: "Only verified Alumni and Faculty members can offer mentorship." };
  }

  const topicsString = Array.isArray(data.mentorTopics)
    ? data.mentorTopics.join(", ")
    : data.mentorTopics || null;

  await db.user.update({
    where: { id: user.id },
    data: {
      isMentor: Boolean(data.isMentor),
      mentorAvailable: Boolean(data.mentorAvailable),
      mentorTopics: topicsString,
      mentorExpertise: data.mentorExpertise?.trim() || null,
      mentorSessionFormat: data.mentorSessionFormat || "ONLINE",
      mentorAvailabilityNote: data.mentorAvailabilityNote?.trim() || null,
      mentorMaxMentees: Number(data.mentorMaxMentees) || 3,
    },
  });

  revalidatePath("/alumni/mentorship");
  revalidatePath("/alumni/profile");
  revalidatePath("/student/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/** Student sends a 1-on-1 mentorship request */
export async function sendMentorshipRequest(data: {
  mentorId: string;
  topic: string;
  message: string;
  careerGoals?: string;
  sessionFormat?: string;
}) {
  const student = await requireUser("STUDENT");

  if (data.mentorId === student.id) {
    return { error: "You cannot request mentorship from yourself." };
  }

  const mentor = await db.user.findFirst({
    where: { id: data.mentorId, status: "APPROVED", isMentor: true },
  });

  if (!mentor) {
    return { error: "Mentor not found or is currently not enrolled as an active mentor." };
  }

  if (!mentor.mentorAvailable) {
    return { error: "This mentor is currently not taking new mentorship requests." };
  }

  // Prevent duplicate active requests to the same mentor
  const existingActive = await db.mentorshipRequest.findFirst({
    where: {
      studentId: student.id,
      mentorId: mentor.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
  });

  if (existingActive) {
    return {
      error: `You already have an active mentorship request (${existingActive.status}) with this mentor.`,
    };
  }

  const req = await db.mentorshipRequest.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
      topic: data.topic.trim(),
      message: data.message.trim().slice(0, 2000),
      careerGoals: data.careerGoals?.trim().slice(0, 1000) || null,
      sessionFormat: data.sessionFormat || mentor.mentorSessionFormat || "ONLINE",
      status: "PENDING",
    },
  });

  // Notify mentor
  await dispatchNotification({
    userId: mentor.id,
    actorId: student.id,
    title: `New Mentorship Request! 🎓`,
    body: `${student.name} requested mentorship on "${data.topic.trim()}".`,
    type: "MENTORSHIP",
    link: `/alumni/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true, requestId: req.id };
}

/** Mentor accepts a pending request */
export async function acceptMentorshipRequest(requestId: string, note?: string) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship request not found." };

  const isAuthorized = req.mentorId === user.id || user.role === "ADMIN";
  if (!isAuthorized) return { error: "Unauthorized access to this mentorship request." };

  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "ACCEPTED",
      mentorNotes: note?.trim() || req.mentorNotes,
      updatedAt: new Date(),
    },
  });

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Request Accepted! 🎉`,
    body: `${user.name} accepted your request on "${req.topic}". Check your mentorship schedule for details.`,
    type: "MENTORSHIP",
    link: `/student/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/** Mentor declines a mentorship request with optional explanation */
export async function declineMentorshipRequest(requestId: string, reason?: string) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship request not found." };

  const isAuthorized = req.mentorId === user.id || user.role === "ADMIN";
  if (!isAuthorized) return { error: "Unauthorized access to this mentorship request." };

  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "DECLINED",
      mentorNotes: reason?.trim() || null,
      updatedAt: new Date(),
    },
  });

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Request Update`,
    body: reason
      ? `${user.name} was unable to accept your request: "${reason.slice(0, 80)}"`
      : `${user.name} was unable to accept your mentorship request at this time.`,
    type: "MENTORSHIP",
    link: `/student/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/** Schedule a mentorship session with datetime and virtual link / location */
export async function scheduleMentorshipSession(
  requestId: string,
  data: {
    scheduledAt: string;
    sessionLink?: string;
    note?: string;
    sessionFormat?: string;
  }
) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship request not found." };

  const isAuthorized = req.mentorId === user.id || user.role === "ADMIN";
  if (!isAuthorized) return { error: "Unauthorized access to this mentorship request." };

  const parsedDate = new Date(data.scheduledAt);
  if (isNaN(parsedDate.getTime())) {
    return { error: "Invalid scheduled date and time." };
  }

  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "SCHEDULED",
      scheduledAt: parsedDate,
      sessionLink: data.sessionLink?.trim() || null,
      sessionFormat: data.sessionFormat || req.sessionFormat,
      mentorNotes: data.note?.trim() || req.mentorNotes,
      updatedAt: new Date(),
    },
  });

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Session Scheduled! 📅`,
    body: `Session with ${user.name} scheduled for ${parsedDate.toLocaleString()}.`,
    type: "MENTORSHIP",
    link: `/student/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/** Complete a mentorship session with feedback notes */
export async function completeMentorshipSession(requestId: string, feedbackNotes?: string) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship request not found." };

  const isAuthorized = req.mentorId === user.id || user.role === "ADMIN";
  if (!isAuthorized) return { error: "Unauthorized access to this mentorship request." };

  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      mentorNotes: feedbackNotes?.trim() || req.mentorNotes,
      updatedAt: new Date(),
    },
  });

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Session Completed 🌟`,
    body: `Thank you for completing your mentorship session on "${req.topic}" with ${user.name}!`,
    type: "MENTORSHIP",
    link: `/student/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/** Cancel a mentorship request (by student or admin) */
export async function cancelMentorshipRequest(requestId: string) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship request not found." };

  const isStudent = req.studentId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isStudent && !isAdmin) {
    return { error: "Only the student applicant or an administrator can cancel this request." };
  }

  if (req.status === "COMPLETED") {
    return { error: "Completed mentorship sessions cannot be cancelled." };
  }

  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "CANCELLED",
      updatedAt: new Date(),
    },
  });

  // If student cancels, notify mentor if request was active
  if (isStudent && (req.status === "PENDING" || req.status === "ACCEPTED" || req.status === "SCHEDULED")) {
    await dispatchNotification({
      userId: req.mentorId,
      actorId: user.id,
      title: `Mentorship Request Cancelled`,
      body: `${user.name} cancelled their mentorship request for "${req.topic}".`,
      type: "MENTORSHIP",
      link: `/alumni/mentorship`,
    });
  }

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}
