"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-auth";
import { dispatchNotification } from "./notifications";

import {
  MENTORSHIP_TOPICS,
  type MentorshipTopic,
  type MentorshipStatus,
  type SessionFormat,
  type MentorAvailabilityStatus,
} from "@/lib/mentorship-constants";

export type { MentorshipTopic, MentorshipStatus, SessionFormat, MentorAvailabilityStatus };

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
 * Record mentorship lifecycle audit log with actor ID and action payload.
 */
export async function logMentorshipAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string
) {
  try {
    await db.mentorshipAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId || null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("Failed to write mentorship audit log:", err);
  }
}

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

  await logMentorshipAudit(
    user.id,
    isActive ? "MENTOR_ACTIVATION" : "MENTOR_DEACTIVATION",
    "MENTOR_PROFILE",
    user.id,
    `Mentor ${user.name} set availability mode to ${isActive ? "ON" : "OFF"} (status: ${newStatus})`
  );

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
  message?: string;
  careerGoals?: string;
  reason?: string;
  introduction?: string;
  sessionFormat?: string;
  preferredAvailability?: string;
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

  const fallbackMessage =
    data.message?.trim() ||
    data.introduction?.trim() ||
    data.reason?.trim() ||
    `Mentorship request on ${data.topic.trim()}`;

  const req = await db.mentorshipRequest.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
      topic: data.topic.trim(),
      message: fallbackMessage.slice(0, 2000),
      careerGoals: data.careerGoals?.trim().slice(0, 1000) || null,
      reason: data.reason?.trim().slice(0, 1000) || null,
      introduction: data.introduction?.trim().slice(0, 1000) || null,
      preferredAvailability: data.preferredAvailability?.trim().slice(0, 500) || null,
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

  await logMentorshipAudit(
    student.id,
    "REQUEST_CREATION",
    "MENTORSHIP_REQUEST",
    req.id,
    `Student ${student.name} requested mentorship on "${data.topic.trim()}" from ${mentor.name}`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/student/mentors");
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

  if (req.status !== "PENDING") {
    return { error: `Cannot accept a request with status ${req.status}. Only PENDING requests can be accepted.` };
  }

  // 1. Capacity Enforcement: Check mentor's active mentee count
  const mentorProfile = await db.mentorProfile.findUnique({
    where: { userId: req.mentorId },
  });
  const maxLimit = mentorProfile?.maxMentees ?? req.mentor.mentorMaxMentees ?? 3;

  const currentActiveCount = await db.mentorshipRequest.count({
    where: {
      mentorId: req.mentorId,
      status: { in: ["ACCEPTED", "SCHEDULED"] },
    },
  });

  if (currentActiveCount >= maxLimit) {
    if (mentorProfile) {
      await db.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { status: "FULLY_BOOKED" },
      }).catch(() => {});
    }
    return {
      error: `Cannot accept request: You have reached your maximum active mentee capacity (${maxLimit}). Conclude an existing mentorship session before accepting new ones.`,
    };
  }

  const now = new Date();

  // 2. Dedicated Mentorship Conversation (Connection with type="mentorship" for this request)
  let connection = req.connectionId
    ? await db.connection.findUnique({ where: { id: req.connectionId } })
    : null;

  if (!connection) {
    connection = await db.connection.findFirst({
      where: {
        type: "mentorship",
        mentorshipRequestId: req.id,
      },
    });
  }

  if (!connection) {
    connection = await db.connection.create({
      data: {
        fromId: user.id,
        toId: req.studentId,
        type: "mentorship",
        topic: req.topic,
        mentorshipRequestId: req.id,
        status: "ACCEPTED",
        isCompleted: false,
        note: `Mentorship: ${req.topic}`,
      },
    });
  } else {
    await db.connection.update({
      where: { id: connection.id },
      data: {
        status: "ACCEPTED",
        type: "mentorship",
        topic: req.topic,
        mentorshipRequestId: req.id,
        isCompleted: false,
      },
    });
  }

  // 3. Update Request status to ACCEPTED
  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "ACCEPTED",
      startedAt: now,
      connectionId: connection.id,
      mentorNotes: note?.trim() || req.mentorNotes,
      updatedAt: now,
    },
  });

  // 4. Create or update MentorshipRelationship
  await db.mentorshipRelationship.upsert({
    where: { requestId: req.id },
    create: {
      requestId: req.id,
      studentId: req.studentId,
      mentorId: user.id,
      status: "ACTIVE",
      startedAt: now,
      connectionId: connection.id,
    },
    update: {
      status: "ACTIVE",
      startedAt: now,
      connectionId: connection.id,
    },
  });

  // 5. Update Fully Booked status if this fills the last slot
  if (currentActiveCount + 1 >= maxLimit) {
    if (mentorProfile) {
      await db.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { status: "FULLY_BOOKED" },
      }).catch(() => {});
    }
    await db.user.update({
      where: { id: user.id },
      data: { mentorAvailable: false },
    }).catch(() => {});
  }

  // 6. Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Request Accepted! 🎉`,
    body: `${user.name} accepted your request on "${req.topic}". You can now communicate directly and view your mentorship under My Mentors.`,
    type: "MENTORSHIP",
    link: `/student/my-mentors`,
  });

  await logMentorshipAudit(
    user.id,
    "REQUEST_ACCEPTANCE",
    "MENTORSHIP_REQUEST",
    req.id,
    `Mentor ${user.name} accepted mentorship request on "${req.topic}" from student ${req.student.name}`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/student/mentors");
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

  const now = new Date();
  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "DECLINED",
      declinedAt: now,
      mentorNotes: reason?.trim() || req.mentorNotes,
      updatedAt: now,
    },
  });

  // Re-check capacity: declining frees up any locked state
  await checkAndRestoreAvailability(req.mentorId);

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Request Declined`,
    body: reason
      ? `${user.name} was unable to accept your request: "${reason.slice(0, 100)}"`
      : `${user.name} was unable to accept your mentorship request at this time.`,
    type: "MENTORSHIP",
    link: `/student/my-mentors`,
  });

  await logMentorshipAudit(
    user.id,
    "REQUEST_DECLINE",
    "MENTORSHIP_REQUEST",
    req.id,
    `Mentor ${user.name} declined request from student ${req.student.name}. Reason: ${reason || "None"}`
  );

  revalidatePath("/student/my-mentors");
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

/** Complete a mentorship session with feedback notes without terminating the overall mentorship */
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
      status: "ACCEPTED", // Remains ACTIVE so further sessions and chatting can happen
      completedAt: new Date(),
      scheduledAt: null, // Clears the current schedule so next session can be set
      mentorNotes: feedbackNotes?.trim() || req.mentorNotes,
      updatedAt: new Date(),
    },
  });

  // Note: We DO NOT set connection.isCompleted = true here,
  // so messaging and further sessions remain fully open!

  // Notify student
  await dispatchNotification({
    userId: req.studentId,
    actorId: user.id,
    title: `Mentorship Session Completed 🌟`,
    body: `Your mentorship session on "${req.topic}" with ${user.name} is complete! You can continue chatting and schedule more sessions together anytime.`,
    type: "MENTORSHIP",
    link: `/student/mentorship-messages`,
  });

  await logMentorshipAudit(
    user.id,
    "SESSION_COMPLETED",
    "MENTORSHIP_REQUEST",
    req.id,
    `Completed mentorship session on "${req.topic}" for student ${req.student.name}. Relationship remains active for further sessions.`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/admin/mentorship");
  revalidatePath("/student/mentorship-messages");
  revalidatePath("/alumni/messages");
  revalidatePath("/teacher/messages");

  return { success: true };
}

/** Cancel a mentorship request (by student applicant or mentor or admin) */
export async function cancelMentorshipRequest(requestId: string, reason?: string) {
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

  const now = new Date();
  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      endReason: reason?.trim() || null,
      updatedAt: now,
    },
  });

  await db.mentorshipRelationship.updateMany({
    where: { requestId: req.id },
    data: {
      status: "CANCELLED",
      endedAt: now,
      endReason: reason?.trim() || "Request cancelled",
    },
  }).catch(() => {});

  if (req.connectionId) {
    await db.connection.update({
      where: { id: req.connectionId },
      data: { isCompleted: true },
    }).catch(() => {});
  }

  // Cancelling frees an active slot!
  await checkAndRestoreAvailability(req.mentorId);

  // If student cancels, notify mentor
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
  } else if (isMentor) {
    // If mentor cancels, notify student
    await dispatchNotification({
      userId: req.studentId,
      actorId: user.id,
      title: `Mentorship Request Cancelled`,
      body: `${user.name} cancelled the mentorship request on "${req.topic}".`,
      type: "MENTORSHIP",
      link: `/student/my-mentors`,
    });
  }

  await logMentorshipAudit(
    user.id,
    "RELATIONSHIP_CANCELLATION",
    "MENTORSHIP_REQUEST",
    req.id,
    `Mentorship request ${req.id} cancelled by ${user.name}. Reason: ${reason || "None"}`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/admin/mentorship");

  return { success: true };
}

/**
 * Either party (Student, Mentor, or Admin) can delete / remove a mentorship relationship.
 * Cleans up the active relationship, archives the connection, frees up capacity, and notifies both parties.
 */
export async function deleteMentorshipRelationship(requestId: string, reason?: string) {
  const user = await requireUser();

  const req = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: true, mentor: true },
  });

  if (!req) return { error: "Mentorship record not found." };

  const isStudent = req.studentId === user.id;
  const isMentor = req.mentorId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isStudent && !isMentor && !isAdmin) {
    return { error: "Unauthorized access. You cannot delete this mentorship." };
  }

  const now = new Date();
  const deleteReason = reason?.trim() || (isStudent ? "Removed by student" : "Removed by mentor");

  // 1. Preserve historical relationship record by updating status to CANCELLED instead of hard deleting
  await db.mentorshipRelationship.updateMany({
    where: { requestId: req.id },
    data: {
      status: "CANCELLED",
      endedAt: now,
      endReason: deleteReason,
    },
  }).catch(() => {});

  // 2. Mark request as CANCELLED so it moves out of active views
  await db.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      endReason: deleteReason,
      updatedAt: now,
    },
  });

  // 3. Mark connection as completed/archived
  if (req.connectionId) {
    await db.connection.update({
      where: { id: req.connectionId },
      data: { isCompleted: true },
    }).catch(() => {});
  }

  // 4. Free up mentor capacity!
  await checkAndRestoreAvailability(req.mentorId);

  // 5. Notify the other party
  if (isStudent) {
    const notifyTarget = req.mentor.role === "TEACHER" ? "/teacher/mentorship" : "/alumni/mentorship";
    await dispatchNotification({
      userId: req.mentorId,
      actorId: user.id,
      title: `Mentorship Removed`,
      body: `Student ${user.name} has deleted/removed the mentorship on "${req.topic}".`,
      type: "MENTORSHIP",
      link: notifyTarget,
    });
  } else if (isMentor) {
    await dispatchNotification({
      userId: req.studentId,
      actorId: user.id,
      title: `Mentorship Concluded`,
      body: `Mentor ${user.name} has concluded/removed the mentorship on "${req.topic}".`,
      type: "MENTORSHIP",
      link: `/student/my-mentors`,
    });
  }

  await logMentorshipAudit(
    user.id,
    "RELATIONSHIP_CANCELLATION",
    "MENTORSHIP_RELATIONSHIP",
    req.id,
    `Mentorship ${req.id} deleted by ${user.name} (${user.role}). Reason: ${deleteReason}`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/student/mentorship");
  revalidatePath("/alumni/mentorship");
  revalidatePath("/teacher/mentorship");
  revalidatePath("/admin/mentorship");
  revalidatePath("/student/mentorship-messages");
  revalidatePath("/alumni/messages");
  revalidatePath("/teacher/messages");

  return { success: true };
}

/** Mentor or Admin ends an active mentorship relationship with confirmation and optional notes */
export async function endMentorshipRelationship(requestId: string, endReason?: string) {
  return deleteMentorshipRelationship(requestId, endReason);
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

export type FindMentorsFilters = {
  searchQuery?: string;
  role?: "ALL" | "ALUMNI" | "TEACHER";
  department?: string;
  topic?: string;
  sessionType?: string;
  experienceLevel?: "ALL" | "ENTRY" | "MID" | "SENIOR";
  sortBy?: "RECENT" | "EXPERIENCE" | "NAME" | "RELEVANT";
  page?: number;
  pageSize?: number;
};

/**
 * Find eligible and available Career Mentors for student discovery.
 * Strictly enforces:
 * - Verified Alumni or Faculty accounts
 * - Activated Mentor mode (isActive: true)
 * - Available status (not temporarily paused, not fully booked)
 * - Has not reached maximum active mentee capacity
 */
export async function findEligibleMentors(filters: FindMentorsFilters = {}) {
  const user = await requireUser("STUDENT");

  const {
    searchQuery = "",
    role = "ALL",
    department = "ALL",
    topic = "ALL",
    sessionType = "ALL",
    experienceLevel = "ALL",
    sortBy = "RELEVANT",
    page = 1,
    pageSize = 9,
  } = filters;

  // Query eligible users with mentor mode enabled
  const rawMentors = await db.user.findMany({
    where: {
      status: "APPROVED",
      isMentor: true,
      deletedAt: null,
      id: { not: user.id },
      ...(role !== "ALL"
        ? role === "ALUMNI"
          ? { role: "ALUMNI", alumniVerified: true }
          : { role: "TEACHER" }
        : {
            OR: [
              { role: "ALUMNI", alumniVerified: true },
              { role: "TEACHER" },
            ],
          }),
    },
    include: {
      mentorProfile: true,
      _count: {
        select: {
          mentorRequests: {
            where: {
              status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
            },
          },
        },
      },
    },
    orderBy:
      sortBy === "NAME"
        ? { name: "asc" }
        : sortBy === "RECENT"
        ? { updatedAt: "desc" }
        : { createdAt: "desc" },
  });

  // Filter in memory for rich multi-model criteria & availability capacity
  const eligible = rawMentors.filter((m) => {
    const mp = m.mentorProfile;

    // 1. Must be active & available
    const isActive = mp ? mp.isActive : m.isMentor;
    if (!isActive) return false;

    const status = mp ? mp.status : m.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE";
    if (status !== "AVAILABLE") return false;

    // 2. Must not exceed maximum active mentee capacity
    const maxCapacity = mp?.maxMentees ?? m.mentorMaxMentees ?? 3;
    const activeCount = m._count.mentorRequests;
    if (activeCount >= maxCapacity) return false;

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchCompany = (m.company || "").toLowerCase().includes(q) || (mp?.company || "").toLowerCase().includes(q);
      const matchPosition = (m.designation || "").toLowerCase().includes(q) || (mp?.position || "").toLowerCase().includes(q);
      const matchDept = (m.department || "").toLowerCase().includes(q);
      const matchSkills = (m.skills || "").toLowerCase().includes(q) || (mp?.skills || "").toLowerCase().includes(q);
      const matchExpertise = (mp?.expertise || "").toLowerCase().includes(q) || (m.mentorExpertise || "").toLowerCase().includes(q);
      const matchField = (mp?.careerField || "").toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchPosition && !matchDept && !matchSkills && !matchExpertise && !matchField) {
        return false;
      }
    }

    // 4. Department filter
    if (department !== "ALL" && m.department !== department && mp?.department !== department) {
      return false;
    }

    // 5. Topic filter
    if (topic !== "ALL") {
      const mentorTopics = (mp?.topics || m.mentorTopics || "").toLowerCase();
      const hasSpecificTopic = mentorTopics.includes(topic.toLowerCase());
      const hasAllTopics = mentorTopics.includes("all topics");
      if (!hasSpecificTopic && !hasAllTopics) return false;
    }

    // 6. Session type filter
    if (sessionType !== "ALL") {
      const sType = mp?.preferredSessionType || m.mentorSessionFormat || "ONLINE";
      if (sType !== sessionType) return false;
    }

    // 7. Experience level filter
    if (experienceLevel !== "ALL") {
      const yrs = mp?.yearsOfExperience ?? 0;
      if (experienceLevel === "ENTRY" && (yrs < 1 || yrs > 3)) return false;
      if (experienceLevel === "MID" && (yrs < 3 || yrs > 5)) return false;
      if (experienceLevel === "SENIOR" && yrs < 5) return false;
    }

    return true;
  });

  // Sorting
  if (sortBy === "EXPERIENCE") {
    eligible.sort((a, b) => (b.mentorProfile?.yearsOfExperience ?? 0) - (a.mentorProfile?.yearsOfExperience ?? 0));
  }

  // Pagination calculation
  const totalCount = eligible.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = eligible.slice(startIndex, startIndex + pageSize);

  const formattedMentors = paginated.map((m) => {
    const mp = m.mentorProfile;
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      image: m.image,
      role: m.role,
      alumniVerified: m.alumniVerified,
      company: mp?.company || m.company || (m.role === "TEACHER" ? "ULAB Faculty" : "Alumni Network"),
      position: mp?.position || m.designation || (m.role === "TEACHER" ? "Faculty Member" : "Professional"),
      department: mp?.department || m.department || "General",
      careerField: mp?.careerField || (m.role === "TEACHER" ? "Academia & Research" : "Industry"),
      yearsOfExperience: mp?.yearsOfExperience ?? null,
      bio: mp?.bio || m.bio || "",
      expertise: mp?.expertise || m.mentorExpertise || "",
      skills: mp?.skills || m.skills || "",
      topics: (mp?.topics || m.mentorTopics || "").split(",").map((s) => s.trim()).filter(Boolean),
      preferredSessionType: mp?.preferredSessionType || m.mentorSessionFormat || "ONLINE",
      availableDays: (mp?.availableDays || "Sunday, Tuesday, Thursday").split(",").map((s) => s.trim()).filter(Boolean),
      communicationMethod: mp?.communicationMethod || "GOOGLE_MEET",
      availabilityNote: mp?.availabilityNote || m.mentorAvailabilityNote || null,
      maxMentees: mp?.maxMentees ?? m.mentorMaxMentees ?? 3,
      activeMenteesCount: m._count.mentorRequests,
      status: (mp?.status || "AVAILABLE") as MentorAvailabilityStatus,
      // Faculty specific
      academicExpertise: mp?.academicExpertise || "",
      researchInterests: mp?.researchInterests || "",
      teachingAreas: mp?.teachingAreas || "",
      academicGuidanceTopics: mp?.academicGuidanceTopics || "",
    };
  });

  return {
    mentors: formattedMentors,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
  };
}

/**
 * Retrieve a specific mentor's complete public profile for the details page.
 */
export async function getMentorPublicProfile(mentorId: string) {
  const user = await requireUser("STUDENT");

  const mentor = await db.user.findFirst({
    where: {
      id: mentorId,
      status: "APPROVED",
      isMentor: true,
      deletedAt: null,
      OR: [
        { role: "ALUMNI", alumniVerified: true },
        { role: "TEACHER" },
      ],
    },
    include: {
      mentorProfile: true,
      _count: {
        select: {
          mentorRequests: {
            where: {
              status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
            },
          },
        },
      },
    },
  });

  if (!mentor) {
    return { error: "Mentor not found or is currently not enrolled as an active mentor." };
  }

  const mp = mentor.mentorProfile;

  // Check viewing student's existing request with this mentor
  const existingRequest = await db.mentorshipRequest.findFirst({
    where: {
      studentId: user.id,
      mentorId: mentor.id,
      status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
    },
    select: {
      id: true,
      status: true,
      topic: true,
      createdAt: true,
    },
  });

  const activeMenteesCount = mentor._count.mentorRequests;
  const maxCapacity = mp?.maxMentees ?? mentor.mentorMaxMentees ?? 3;
  const isAvailable =
    (mp ? mp.isActive && mp.status === "AVAILABLE" : mentor.mentorAvailable) &&
    activeMenteesCount < maxCapacity;

  return {
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    image: mentor.image,
    role: mentor.role,
    alumniVerified: mentor.alumniVerified,
    company: mp?.company || mentor.company || (mentor.role === "TEACHER" ? "University of Liberal Arts Bangladesh" : ""),
    position: mp?.position || mentor.designation || (mentor.role === "TEACHER" ? "Faculty Member" : ""),
    department: mp?.department || mentor.department || "General",
    careerField: mp?.careerField || "",
    yearsOfExperience: mp?.yearsOfExperience ?? null,
    bio: mp?.bio || mentor.bio || "",
    expertise: mp?.expertise || mentor.mentorExpertise || "",
    skills: mp?.skills || mentor.skills || "",
    topics: (mp?.topics || mentor.mentorTopics || "").split(",").map((s) => s.trim()).filter(Boolean),
    preferredSessionType: mp?.preferredSessionType || mentor.mentorSessionFormat || "ONLINE",
    availableDays: (mp?.availableDays || "Sunday, Tuesday, Thursday").split(",").map((s) => s.trim()).filter(Boolean),
    communicationMethod: mp?.communicationMethod || "GOOGLE_MEET",
    availabilityNote: mp?.availabilityNote || mentor.mentorAvailabilityNote || "",
    academicExpertise: mp?.academicExpertise || "",
    researchInterests: mp?.researchInterests || "",
    teachingAreas: mp?.teachingAreas || "",
    academicGuidanceTopics: mp?.academicGuidanceTopics || "",
    isAvailable,
    activeMenteesCount,
    maxCapacity,
    existingRequest: existingRequest
      ? {
          id: existingRequest.id,
          status: existingRequest.status,
          topic: existingRequest.topic,
          createdAt: existingRequest.createdAt.toISOString(),
        }
      : null,
  };
}

/**
 * Retrieve all mentorship relationships for the logged in student (My Mentors page).
 */
export async function getStudentMentorshipHistory() {
  const student = await requireUser("STUDENT");

  const rawRequests = await db.mentorshipRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          department: true,
          company: true,
          designation: true,
          alumniVerified: true,
          mentorProfile: {
            select: {
              company: true,
              position: true,
              careerField: true,
              communicationMethod: true,
            },
          },
        },
      },
      relationship: {
        select: {
          id: true,
          feedback: {
            select: {
              id: true,
              rating: true,
              review: true,
            },
          },
        },
      },
    },
  });

  const serialized = rawRequests.map((r) => ({
    id: r.id,
    topic: r.topic,
    message: r.message,
    careerGoals: r.careerGoals,
    reason: r.reason,
    introduction: r.introduction,
    preferredAvailability: r.preferredAvailability,
    status: r.status,
    sessionFormat: r.sessionFormat,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    sessionLink: r.sessionLink,
    mentorNotes: r.mentorNotes,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    declinedAt: r.declinedAt ? r.declinedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
    endReason: r.endReason,
    connectionId: r.connectionId,
    relationshipId: r.relationship?.id || null,
    feedback: r.relationship?.feedback || null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    mentor: {
      id: r.mentor.id,
      name: r.mentor.name,
      email: r.mentor.email,
      image: r.mentor.image,
      role: r.mentor.role,
      department: r.mentor.department,
      company: r.mentor.mentorProfile?.company || r.mentor.company,
      position: r.mentor.mentorProfile?.position || r.mentor.designation,
      careerField: r.mentor.mentorProfile?.careerField,
      communicationMethod: r.mentor.mentorProfile?.communicationMethod || "GOOGLE_MEET",
      alumniVerified: r.mentor.alumniVerified,
    },
  }));

  return {
    all: serialized,
    pending: serialized.filter((r) => r.status === "PENDING"),
    active: serialized.filter((r) => r.status === "ACCEPTED" || r.status === "SCHEDULED"),
    completed: serialized.filter((r) => r.status === "COMPLETED"),
    archived: serialized.filter((r) => r.status === "DECLINED" || r.status === "CANCELLED"),
  };
}

// ==============================================================================
// PHASE 5: CRM INTEGRATION, FEEDBACK, REPORTING, AUDIT & ANALYTICS
// ==============================================================================

/**
 * Submit post-mentorship rating and optional feedback review.
 * Only the participating student can review a completed mentorship.
 * Prevents duplicate reviews for the same relationship.
 */
export async function submitMentorshipFeedback(input: {
  relationshipId: string;
  rating: number;
  review?: string;
  isAnonymous?: boolean;
}) {
  const user = await requireUser();
  const { relationshipId, rating, review, isAnonymous } = input;

  const numericRating = Math.round(Number(rating));
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return { error: "Rating must be an integer between 1 and 5 stars." };
  }

  const relationship = await db.mentorshipRelationship.findUnique({
    where: { id: relationshipId },
    include: { request: true, feedback: true },
  });

  if (!relationship) {
    return { error: "Mentorship relationship record not found." };
  }

  if (relationship.studentId !== user.id && user.role !== "ADMIN") {
    return { error: "Only the participating student can submit feedback for this mentorship." };
  }

  if (
    relationship.status !== "COMPLETED" &&
    relationship.request.status !== "COMPLETED" &&
    !relationship.request.completedAt
  ) {
    return { error: "Feedback can only be submitted after at least one mentorship session is completed." };
  }

  if (relationship.feedback) {
    return { error: "Feedback has already been submitted for this mentorship relationship." };
  }

  const trimmedReview = review?.trim() || null;

  const feedback = await db.mentorshipFeedback.create({
    data: {
      relationshipId,
      studentId: relationship.studentId,
      mentorId: relationship.mentorId,
      rating: numericRating,
      review: trimmedReview ? trimmedReview.slice(0, 2000) : null,
      status: "PUBLISHED",
      isAnonymous: Boolean(isAnonymous),
    },
  });

  // Recalculate Mentor's average rating and total reviews
  const allMentorFeedbacks = await db.mentorshipFeedback.findMany({
    where: { mentorId: relationship.mentorId, status: "PUBLISHED" },
    select: { rating: true },
  });

  const totalReviews = allMentorFeedbacks.length;
  const avgRating =
    totalReviews > 0
      ? Number((allMentorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1))
      : null;

  await db.mentorProfile.update({
    where: { userId: relationship.mentorId },
    data: {
      averageRating: avgRating,
      totalReviews,
    },
  }).catch(() => {});

  // Dispatch notification to mentor
  await dispatchNotification({
    userId: relationship.mentorId,
    actorId: user.id,
    title: "New Mentorship Feedback Received! 🌟",
    body: `A student rated your mentorship session ${numericRating} out of 5 stars.${
      trimmedReview ? ` "${trimmedReview.slice(0, 60)}..."` : ""
    }`,
    type: "MENTORSHIP",
    link: "/alumni/mentorship",
  }).catch(() => {});

  await logMentorshipAudit(
    user.id,
    "FEEDBACK_SUBMISSION",
    "FEEDBACK",
    feedback.id,
    `Student rated mentor ${relationship.mentorId} with ${numericRating}/5 stars`
  );

  revalidatePath("/student/my-mentors");
  revalidatePath("/admin/mentorship");
  revalidatePath("/admin/analytics");

  return { success: true, feedbackId: feedback.id };
}

/**
 * Report inappropriate mentorship behavior, harassment, or fraudulent profiles.
 */
export async function reportMentorship(input: {
  targetType: "MENTOR" | "STUDENT" | "MENTORSHIP_REQUEST" | "FEEDBACK";
  targetId: string;
  reportedUserId?: string;
  reason: string;
  details: string;
}) {
  const user = await requireUser();
  const { targetType, targetId, reportedUserId, reason, details } = input;

  if (!reason?.trim() || !details?.trim()) {
    return { error: "Both reason and detailed explanation are required to submit a report." };
  }

  const report = await db.userReport.create({
    data: {
      reporterId: user.id,
      reportedUserId: reportedUserId || null,
      targetType: targetType === "FEEDBACK" ? "FEEDBACK" : "MENTORSHIP",
      targetId,
      reason: reason.trim(),
      details: details.trim().slice(0, 2000),
      status: "PENDING",
    },
  });

  if (targetType === "FEEDBACK") {
    await db.mentorshipFeedback.update({
      where: { id: targetId },
      data: { isReported: true, reportReason: reason.trim() },
    }).catch(() => {});
  }

  await logMentorshipAudit(
    user.id,
    "REPORT_SUBMISSION",
    targetType,
    targetId,
    `Report filed: ${reason} - ${details.slice(0, 100)}`
  );

  revalidatePath("/admin/reports");
  revalidatePath("/admin/mentorship");

  return { success: true, reportId: report.id };
}

/**
 * Admin moderates written feedback (Publish, Hide, or Delete).
 */
export async function adminModerateFeedback(
  feedbackId: string,
  action: "PUBLISH" | "HIDE" | "DELETE",
  note?: string
) {
  const { user: admin } = await requireAdminPermission("mentorship:manage");

  const feedback = await db.mentorshipFeedback.findUnique({
    where: { id: feedbackId },
  });
  if (!feedback) return { error: "Feedback record not found." };

  if (action === "DELETE") {
    await db.mentorshipFeedback.delete({ where: { id: feedbackId } });
  } else {
    await db.mentorshipFeedback.update({
      where: { id: feedbackId },
      data: {
        status: action === "PUBLISH" ? "PUBLISHED" : "HIDDEN",
        adminNotes: note?.trim() || null,
        isReported: false,
      },
    });
  }

  // Recalculate Mentor's average rating
  const allMentorFeedbacks = await db.mentorshipFeedback.findMany({
    where: { mentorId: feedback.mentorId, status: "PUBLISHED" },
    select: { rating: true },
  });

  const totalReviews = allMentorFeedbacks.length;
  const avgRating =
    totalReviews > 0
      ? Number((allMentorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1))
      : null;

  await db.mentorProfile.update({
    where: { userId: feedback.mentorId },
    data: {
      averageRating: avgRating,
      totalReviews,
    },
  }).catch(() => {});

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "FEEDBACK_MODERATION",
      targetType: "FEEDBACK",
      targetId: feedbackId,
      details: `Admin ${action} feedback ${feedbackId}. Note: ${note || "None"}`,
    },
  }).catch(() => {});

  await logMentorshipAudit(
    admin.id,
    "ADMIN_MODERATION",
    "FEEDBACK",
    feedbackId,
    `Admin moderated feedback: ${action}`
  );

  revalidatePath("/admin/mentorship");
  revalidatePath("/admin/analytics");

  return { success: true };
}

/**
 * Admin toggles a mentor's active status if there is a security or policy violation.
 */
export async function adminToggleMentorStatus(
  mentorUserId: string,
  isActive: boolean,
  note?: string
) {
  const { user: admin } = await requireAdminPermission("mentorship:manage");

  const mentor = await db.user.findUnique({
    where: { id: mentorUserId },
    include: { mentorProfile: true },
  });
  if (!mentor) return { error: "Mentor not found." };

  await db.user.update({
    where: { id: mentorUserId },
    data: {
      isMentor: isActive,
      mentorAvailable: isActive,
    },
  });

  if (mentor.mentorProfile) {
    await db.mentorProfile.update({
      where: { userId: mentorUserId },
      data: {
        isActive,
        status: isActive ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE",
      },
    });
  }

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "MENTOR_STATUS_TOGGLE",
      targetType: "USER",
      targetId: mentorUserId,
      details: `Admin set mentor active=${isActive} for ${mentor.name} (${mentor.email}). Note: ${note || "None"}`,
    },
  }).catch(() => {});

  await logMentorshipAudit(
    admin.id,
    "ADMIN_MODERATION",
    "MENTOR_PROFILE",
    mentorUserId,
    `Admin toggled mentor isActive to ${isActive}`
  );

  revalidatePath("/admin/mentorship");
  revalidatePath("/admin/users");

  return { success: true };
}

/**
 * Comprehensive Admin Mentorship Dashboard Data Query.
 * Fetches real database statistics, mentor directory, requests, ratings, and audit logs.
 */
export async function adminGetMentorshipDashboardData() {
  await requireAdminPermission("mentorship:view");

  const [
    totalMentors,
    activeAlumniMentors,
    activeFacultyMentors,
    availableMentors,
    fullyBookedMentors,
    totalRequests,
    pendingRequests,
    acceptedRequests,
    activeRelationships,
    completedMentorships,
    cancelledMentorships,
    rawMentors,
    rawRequests,
    rawFeedbacks,
    rawAuditLogs,
    rawReports,
  ] = await Promise.all([
    db.user.count({ where: { isMentor: true, status: "APPROVED" } }),
    db.user.count({ where: { isMentor: true, role: "ALUMNI", status: "APPROVED" } }),
    db.user.count({ where: { isMentor: true, role: "TEACHER", status: "APPROVED" } }),
    db.user.count({ where: { isMentor: true, mentorAvailable: true, status: "APPROVED" } }),
    db.mentorProfile.count({ where: { status: "FULLY_BOOKED" } }),
    db.mentorshipRequest.count(),
    db.mentorshipRequest.count({ where: { status: "PENDING" } }),
    db.mentorshipRequest.count({ where: { status: "ACCEPTED" } }),
    db.mentorshipRelationship.count({ where: { status: "ACTIVE" } }),
    db.mentorshipRequest.count({ where: { status: "COMPLETED" } }),
    db.mentorshipRequest.count({ where: { status: { in: ["CANCELLED", "DECLINED"] } } }),
    // Mentors list
    db.user.findMany({
      where: { isMentor: true, status: "APPROVED" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        company: true,
        designation: true,
        image: true,
        alumniVerified: true,
        mentorAvailable: true,
        mentorProfile: true,
        _count: {
          select: {
            mentorRequests: true,
            mentorRelationships: { where: { status: "ACTIVE" } },
            receivedReports: true,
            feedbackReceived: true,
          },
        },
      },
    }),
    // Requests list
    db.mentorshipRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        student: { select: { id: true, name: true, email: true, department: true, image: true } },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
            designation: true,
            department: true,
          },
        },
        relationship: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            endedAt: true,
            feedback: true,
          },
        },
      },
    }),
    // Feedbacks list
    db.mentorshipFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        student: { select: { id: true, name: true, email: true, department: true } },
        mentor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    // Audit logs
    db.mentorshipAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    // Reports
    db.userReport.findMany({
      where: { targetType: { in: ["MENTORSHIP", "FEEDBACK"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  // Serialized Mentors
  const mentors = rawMentors.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    department: m.department,
    company: m.mentorProfile?.company || m.company,
    designation: m.mentorProfile?.position || m.designation,
    careerField: m.mentorProfile?.careerField || null,
    expertise: m.mentorProfile?.expertise || null,
    skills: m.mentorProfile?.skills || null,
    topics: m.mentorProfile?.topics || null,
    maxMentees: m.mentorProfile?.maxMentees ?? 3,
    activeMenteesCount: m._count.mentorRelationships,
    totalRequestsCount: m._count.mentorRequests,
    reportsCount: m._count.receivedReports,
    averageRating: m.mentorProfile?.averageRating ?? null,
    totalReviews: m.mentorProfile?.totalReviews ?? m._count.feedbackReceived,
    isActive: m.mentorProfile?.isActive ?? true,
    status: m.mentorProfile?.status ?? (m.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE"),
    image: m.image,
    alumniVerified: m.alumniVerified,
  }));

  // Serialized Requests
  const requests = rawRequests.map((r) => ({
    id: r.id,
    topic: r.topic,
    message: r.message,
    careerGoals: r.careerGoals,
    reason: r.reason,
    status: r.status,
    sessionFormat: r.sessionFormat,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    sessionLink: r.sessionLink,
    mentorNotes: r.mentorNotes,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    declinedAt: r.declinedAt ? r.declinedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
    endReason: r.endReason,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    student: r.student,
    mentor: r.mentor,
    relationship: r.relationship
      ? {
          id: r.relationship.id,
          status: r.relationship.status,
          hasFeedback: Boolean(r.relationship.feedback),
        }
      : null,
  }));

  // Serialized Feedbacks
  const feedbacks = rawFeedbacks.map((f) => ({
    id: f.id,
    relationshipId: f.relationshipId,
    rating: f.rating,
    review: f.review,
    status: f.status,
    isReported: f.isReported,
    reportReason: f.reportReason,
    adminNotes: f.adminNotes,
    createdAt: f.createdAt.toISOString(),
    student: f.isAnonymous
      ? { id: f.student.id, name: "Anonymous Student", department: f.student.department }
      : f.student,
    mentor: f.mentor,
  }));

  // Serialized Audit Logs
  const auditLogs = rawAuditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
    actor: l.actor,
  }));

  // Serialized Reports
  const reports = rawReports.map((rp) => ({
    id: rp.id,
    targetType: rp.targetType,
    targetId: rp.targetId,
    reason: rp.reason,
    details: rp.details,
    status: rp.status,
    createdAt: rp.createdAt.toISOString(),
    reporter: rp.reporter,
    reportedUser: rp.reportedUser,
  }));

  // Compute Topic Distribution
  const topicCounts: Record<string, number> = {};
  for (const r of rawRequests) {
    if (r.topic) {
      topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1;
    }
  }
  const popularTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Compute Monthly Trends (Last 6-12 Months)
  const monthMap: Record<string, { requests: number; accepted: number; completed: number; declined: number }> = {};
  for (const r of rawRequests) {
    const key = new Date(r.createdAt).toISOString().slice(0, 7); // YYYY-MM
    if (!monthMap[key]) {
      monthMap[key] = { requests: 0, accepted: 0, completed: 0, declined: 0 };
    }
    monthMap[key].requests++;
    if (r.status === "ACCEPTED" || r.status === "SCHEDULED" || r.status === "COMPLETED") {
      monthMap[key].accepted++;
    }
    if (r.status === "COMPLETED") {
      monthMap[key].completed++;
    }
    if (r.status === "DECLINED") {
      monthMap[key].declined++;
    }
  }
  const monthlyTrends = Object.entries(monthMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    kpis: {
      totalMentors,
      activeAlumniMentors,
      activeFacultyMentors,
      availableMentors,
      fullyBookedMentors,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      activeRelationships,
      completedMentorships,
      cancelledMentorships,
      acceptanceRate:
        totalRequests > 0
          ? Math.round(((acceptedRequests + completedMentorships) / totalRequests) * 100)
          : 0,
    },
    mentors,
    requests,
    feedbacks,
    auditLogs,
    reports,
    analytics: {
      popularTopics,
      monthlyTrends,
      mentorAvailability: {
        available: availableMentors,
        fullyBooked: fullyBookedMentors,
        unavailable: totalMentors - availableMentors - fullyBookedMentors,
      },
      roleBreakdown: {
        alumni: activeAlumniMentors,
        faculty: activeFacultyMentors,
      },
    },
  };
}
