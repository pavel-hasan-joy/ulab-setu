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

export type SessionFormat = "ONLINE" | "IN_PERSON" | "HYBRID";

export type MentorAvailabilityStatus =
  | "AVAILABLE"
  | "TEMPORARILY_UNAVAILABLE"
  | "FULLY_BOOKED";

export type CareerMentorProfileData = {
  isActive: boolean;
  status?: MentorAvailabilityStatus;
  bio?: string;
  careerField?: string;
  company?: string;
  position?: string;
  department?: string;
  expertise?: string;
  skills?: string;
  topics?: string[] | string;
  yearsOfExperience?: number;
  preferredSessionType?: string;
  availableDays?: string[] | string;
  communicationMethod?: string;
  maxMentees?: number;
  availabilityNote?: string;
  // Faculty specific fields
  academicExpertise?: string;
  researchInterests?: string;
  teachingAreas?: string;
  academicGuidanceTopics?: string;
};

/**
 * Check if a user is authorized to be a Career Mentor.
 * STRICT SECURITY REQUIREMENT:
 * Only verified Alumni (role === 'ALUMNI' && alumniVerified) and authorized Faculty (role === 'TEACHER')
 * are permitted to become Career Mentors. Students must NEVER be able to activate Mentor mode.
 */
export async function verifyMentorEligibility(user: {
  id: string;
  role: string;
  status: string;
  alumniVerified: boolean;
}): Promise<{ eligible: boolean; error?: string }> {
  if (user.role === "STUDENT") {
    return {
      eligible: false,
      error: "Students are strictly prohibited from activating Career Mentor mode.",
    };
  }

  if (user.role === "ALUMNI") {
    if (user.status !== "APPROVED") {
      return {
        eligible: false,
        error: "Your Alumni account must be approved before activating Mentor mode.",
      };
    }
    // Alumni must have verified status
    if (!user.alumniVerified) {
      return {
        eligible: false,
        error: "Only verified Alumni accounts can activate Career Mentor mode.",
      };
    }
    return { eligible: true };
  }

  if (user.role === "TEACHER") {
    if (user.status !== "APPROVED") {
      return {
        eligible: false,
        error: "Your Faculty account must be in active status before activating Mentor mode.",
      };
    }
    return { eligible: true };
  }

  if (user.role === "ADMIN") {
    return { eligible: true };
  }

  return {
    eligible: false,
    error: "Unauthorized user role for Career Mentorship enrollment.",
  };
}

/**
 * Retrieve or automatically initialize a Career Mentor profile for an authorized user.
 */
export async function getCareerMentorProfile(targetUserId?: string) {
  const currentUser = await requireUser();
  const userId = targetUserId || currentUser.id;

  // Authorization: users can view only their own profile unless they are admin
  if (userId !== currentUser.id && currentUser.role !== "ADMIN") {
    return { error: "Unauthorized access to mentor profile." };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { mentorProfile: true },
  });

  if (!user) return { error: "User not found." };

  const eligibility = await verifyMentorEligibility(user);
  if (!eligibility.eligible && userId === currentUser.id) {
    return { error: eligibility.error, eligible: false };
  }

  // Active mentees count (PENDING, ACCEPTED, SCHEDULED)
  const activeMenteesCount = await db.mentorshipRequest.count({
    where: {
      mentorId: user.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
  });

  const completedSessionsCount = await db.mentorshipRequest.count({
    where: {
      mentorId: user.id,
      status: "COMPLETED",
    },
  });

  // If MentorProfile does not exist yet, construct baseline from User record
  const profile = user.mentorProfile || {
    id: "",
    userId: user.id,
    isActive: user.isMentor,
    status: (user.isMentor && user.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE") as MentorAvailabilityStatus,
    bio: user.bio || "",
    careerField: "",
    company: user.company || "",
    position: user.designation || "",
    department: user.department || "",
    expertise: user.mentorExpertise || "",
    skills: user.skills || "",
    topics: user.mentorTopics || "",
    yearsOfExperience: null,
    preferredSessionType: user.mentorSessionFormat || "ONLINE",
    availableDays: "Sunday, Tuesday, Thursday",
    communicationMethod: "GOOGLE_MEET",
    maxMentees: user.mentorMaxMentees || 3,
    availabilityNote: user.mentorAvailabilityNote || "",
    academicExpertise: "",
    researchInterests: "",
    teachingAreas: "",
    academicGuidanceTopics: "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    eligible: true,
    userRole: user.role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      department: user.department,
      company: user.company,
      designation: user.designation,
      alumniVerified: user.alumniVerified,
    },
    profile,
    activeMenteesCount,
    completedSessionsCount,
  };
}

/**
 * Toggle Career Mentor activation status (ON/OFF).
 * When OFF:
 * - Hides the mentor profile from new searches
 * - Prevents new requests
 * - Preserves existing accepted relationships and history
 */
export async function toggleMentorActivation(isActive: boolean) {
  const user = await requireUser();
  const eligibility = await verifyMentorEligibility(user);

  if (!eligibility.eligible) {
    return { error: eligibility.error || "You are not authorized to activate Mentor mode." };
  }

  // Active mentees count
  const activeCount = await db.mentorshipRequest.count({
    where: {
      mentorId: user.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
  });

  const existingProfile = await db.mentorProfile.findUnique({
    where: { userId: user.id },
  });

  const maxMentees = existingProfile?.maxMentees ?? user.mentorMaxMentees ?? 3;

  let newStatus: MentorAvailabilityStatus = "AVAILABLE";
  if (!isActive) {
    newStatus = "TEMPORARILY_UNAVAILABLE";
  } else if (activeCount >= maxMentees) {
    newStatus = "FULLY_BOOKED";
  }

  await db.mentorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      isActive,
      status: newStatus,
      company: user.company || null,
      position: user.designation || null,
      department: user.department || null,
      expertise: user.mentorExpertise || null,
      skills: user.skills || null,
      topics: user.mentorTopics || null,
      preferredSessionType: user.mentorSessionFormat || "ONLINE",
      maxMentees,
    },
    update: {
      isActive,
      status: newStatus,
    },
  });

  // Sync User model for fast querying
  await db.user.update({
    where: { id: user.id },
    data: {
      isMentor: isActive,
      mentorAvailable: isActive && newStatus === "AVAILABLE",
    },
  });

  revalidatePath("/alumni/mentorship");
  revalidatePath("/alumni");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/teacher");
  revalidatePath("/student/mentorship");
  revalidatePath("/admin/mentorship");

  return {
    success: true,
    isActive,
    status: newStatus,
    message: isActive
      ? "Career Mentor mode is now ON. Your profile is discoverable by students."
      : "Career Mentor mode is now OFF. New mentorship requests are paused, while existing sessions remain active.",
  };
}

/**
 * Update comprehensive Career Mentor Profile.
 * Strictly verifies eligibility, validates active capacity, and updates MentorProfile table.
 */
export async function updateCareerMentorProfile(data: CareerMentorProfileData) {
  const user = await requireUser();
  const eligibility = await verifyMentorEligibility(user);

  if (!eligibility.eligible) {
    return { error: eligibility.error || "Only verified Alumni and Faculty can offer career mentorship." };
  }

  const topicsString = Array.isArray(data.topics)
    ? data.topics.join(", ")
    : data.topics?.trim() || null;

  const daysString = Array.isArray(data.availableDays)
    ? data.availableDays.join(", ")
    : data.availableDays?.trim() || null;

  const maxMentees = Math.min(Math.max(Number(data.maxMentees) || 3, 1), 10);
  const yearsExp = data.yearsOfExperience ? Number(data.yearsOfExperience) : null;

  // Active mentees count
  const activeCount = await db.mentorshipRequest.count({
    where: {
      mentorId: user.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
  });

  // Automated Availability State
  let computedStatus: MentorAvailabilityStatus = data.status || "AVAILABLE";
  if (!data.isActive) {
    computedStatus = "TEMPORARILY_UNAVAILABLE";
  } else if (activeCount >= maxMentees) {
    computedStatus = "FULLY_BOOKED";
  }

  // 1. Upsert MentorProfile table
  const profile = await db.mentorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      isActive: Boolean(data.isActive),
      status: computedStatus,
      bio: data.bio?.trim() || null,
      careerField: data.careerField?.trim() || null,
      company: data.company?.trim() || user.company || null,
      position: data.position?.trim() || user.designation || null,
      department: data.department?.trim() || user.department || null,
      expertise: data.expertise?.trim() || null,
      skills: data.skills?.trim() || user.skills || null,
      topics: topicsString,
      yearsOfExperience: yearsExp,
      preferredSessionType: data.preferredSessionType || "ONLINE",
      availableDays: daysString,
      communicationMethod: data.communicationMethod || "GOOGLE_MEET",
      maxMentees,
      availabilityNote: data.availabilityNote?.trim() || null,
      academicExpertise: data.academicExpertise?.trim() || null,
      researchInterests: data.researchInterests?.trim() || null,
      teachingAreas: data.teachingAreas?.trim() || null,
      academicGuidanceTopics: data.academicGuidanceTopics?.trim() || null,
    },
    update: {
      isActive: Boolean(data.isActive),
      status: computedStatus,
      bio: data.bio?.trim() || null,
      careerField: data.careerField?.trim() || null,
      company: data.company?.trim() || user.company || null,
      position: data.position?.trim() || user.designation || null,
      department: data.department?.trim() || user.department || null,
      expertise: data.expertise?.trim() || null,
      skills: data.skills?.trim() || user.skills || null,
      topics: topicsString,
      yearsOfExperience: yearsExp,
      preferredSessionType: data.preferredSessionType || "ONLINE",
      availableDays: daysString,
      communicationMethod: data.communicationMethod || "GOOGLE_MEET",
      maxMentees,
      availabilityNote: data.availabilityNote?.trim() || null,
      academicExpertise: data.academicExpertise?.trim() || null,
      researchInterests: data.researchInterests?.trim() || null,
      teachingAreas: data.teachingAreas?.trim() || null,
      academicGuidanceTopics: data.academicGuidanceTopics?.trim() || null,
    },
  });

  // 2. Sync User model fields for backwards compatibility
  await db.user.update({
    where: { id: user.id },
    data: {
      isMentor: Boolean(data.isActive),
      mentorAvailable: Boolean(data.isActive) && computedStatus === "AVAILABLE",
      mentorTopics: topicsString,
      mentorExpertise: data.expertise?.trim() || null,
      mentorSessionFormat: data.preferredSessionType || "ONLINE",
      mentorAvailabilityNote: data.availabilityNote?.trim() || null,
      mentorMaxMentees: maxMentees,
      ...(data.company ? { company: data.company.trim() } : {}),
      ...(data.position ? { designation: data.position.trim() } : {}),
      ...(data.bio ? { bio: data.bio.trim() } : {}),
    },
  });

  revalidatePath("/alumni/mentorship");
  revalidatePath("/alumni/profile");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/teacher/profile");
  revalidatePath("/student/mentorship");
  revalidatePath("/admin/mentorship");

  return {
    success: true,
    profile,
    computedStatus,
    activeMenteesCount: activeCount,
    message: "Mentor profile successfully saved and updated.",
  };
}

/** Legacy wrapper for backwards compatibility */
export async function updateMentorProfile(data: {
  isMentor: boolean;
  mentorAvailable: boolean;
  mentorTopics?: string[];
  mentorExpertise?: string;
  mentorSessionFormat?: string;
  mentorAvailabilityNote?: string;
  mentorMaxMentees?: number;
}) {
  return updateCareerMentorProfile({
    isActive: data.isMentor,
    status: data.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE",
    topics: data.mentorTopics,
    expertise: data.mentorExpertise,
    preferredSessionType: data.mentorSessionFormat,
    availabilityNote: data.mentorAvailabilityNote,
    maxMentees: data.mentorMaxMentees,
  });
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

  const [mentor, mentorProfile] = await Promise.all([
    db.user.findFirst({
      where: { id: data.mentorId, status: "APPROVED" },
    }),
    db.mentorProfile.findUnique({
      where: { userId: data.mentorId },
    }),
  ]);

  if (!mentor || (!mentor.isMentor && !mentorProfile?.isActive)) {
    return { error: "Mentor not found or is currently not enrolled as an active mentor." };
  }

  // Check availability status
  const isProfileActive = mentorProfile ? mentorProfile.isActive : mentor.isMentor;
  const profileStatus = mentorProfile?.status || (mentor.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE");

  if (!isProfileActive || profileStatus === "TEMPORARILY_UNAVAILABLE") {
    return { error: "This mentor is currently not taking new mentorship requests." };
  }

  // Active mentees limit check
  const maxLimit = mentorProfile?.maxMentees ?? mentor.mentorMaxMentees ?? 3;
  const activeCount = await db.mentorshipRequest.count({
    where: {
      mentorId: mentor.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
  });

  if (activeCount >= maxLimit || profileStatus === "FULLY_BOOKED") {
    // Ensure marked as fully booked
    if (mentorProfile) {
      await db.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { status: "FULLY_BOOKED" },
      }).catch(() => {});
    }
    await db.user.update({
      where: { id: mentor.id },
      data: { mentorAvailable: false },
    }).catch(() => {});

    return { error: "This mentor has reached their maximum active mentee capacity and is currently fully booked." };
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
      sessionFormat: data.sessionFormat || mentorProfile?.preferredSessionType || mentor.mentorSessionFormat || "ONLINE",
      status: "PENDING",
    },
  });

  // If this new request reaches the limit, auto mark as fully booked
  if (activeCount + 1 >= maxLimit) {
    if (mentorProfile) {
      await db.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { status: "FULLY_BOOKED" },
      }).catch(() => {});
    }
    await db.user.update({
      where: { id: mentor.id },
      data: { mentorAvailable: false },
    }).catch(() => {});
  }

  // Notify mentor
  const notifyTarget = mentor.role === "TEACHER" ? "/teacher/mentorship" : "/alumni/mentorship";
  await dispatchNotification({
    userId: mentor.id,
    actorId: student.id,
    title: `New Mentorship Request! 🎓`,
    body: `${student.name} requested career guidance on "${data.topic.trim()}".`,
    type: "MENTORSHIP",
    link: notifyTarget,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
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
  revalidatePath("/teacher/mentorship");
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

  // Re-check capacity: if was fully booked, declining a pending request frees up a slot!
  await checkAndRestoreAvailability(req.mentorId);

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
  revalidatePath("/teacher/mentorship");
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
  revalidatePath("/teacher/mentorship");
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

  // Completing a session frees an active slot!
  await checkAndRestoreAvailability(req.mentorId);

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Session Completed 🌟`,
    body: `Thank you for completing your career mentorship session on "${req.topic}" with ${user.name}!`,
    type: "MENTORSHIP",
    link: `/student/mentorship`,
  });

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
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
  const isMentor = req.mentorId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isStudent && !isMentor && !isAdmin) {
    return { error: "Only the student applicant, mentor, or an administrator can cancel this request." };
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

  // Cancelling frees an active slot!
  await checkAndRestoreAvailability(req.mentorId);

  // If student cancels, notify mentor if request was active
  if (isStudent && (req.status === "PENDING" || req.status === "ACCEPTED" || req.status === "SCHEDULED")) {
    const notifyTarget = req.mentor.role === "TEACHER" ? "/teacher/mentorship" : "/alumni/mentorship";
    await dispatchNotification({
      userId: req.mentorId,
      actorId: user.id,
      title: `Mentorship Request Cancelled`,
      body: `${user.name} cancelled their mentorship request for "${req.topic}".`,
      type: "MENTORSHIP",
      link: notifyTarget,
    });
  }

  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/**
 * Internal helper to check mentor's capacity and restore status from FULLY_BOOKED to AVAILABLE
 * when active slots become available.
 */
async function checkAndRestoreAvailability(mentorId: string) {
  try {
    const profile = await db.mentorProfile.findUnique({
      where: { userId: mentorId },
    });

    if (!profile || !profile.isActive) return;

    const activeCount = await db.mentorshipRequest.count({
      where: {
        mentorId,
        status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
      },
    });

    if (activeCount < profile.maxMentees && profile.status === "FULLY_BOOKED") {
      await db.mentorProfile.update({
        where: { id: profile.id },
        data: { status: "AVAILABLE" },
      });
      await db.user.update({
        where: { id: mentorId },
        data: { mentorAvailable: true },
      });
    }
  } catch (err) {
    console.error("Error restoring mentor availability:", err);
  }
}
