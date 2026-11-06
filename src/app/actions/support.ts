"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-auth";
import { dispatchNotification } from "./notifications";

export type TicketCategory =
  | "LOGIN"
  | "VERIFICATION"
  | "PROFILE"
  | "JOB_POSTING"
  | "JOB_APPLICATION"
  | "MESSAGING"
  | "TECHNICAL"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED";

export type ReportTargetType = "USER" | "JOB" | "POST" | "MESSAGE" | "TUITION" | "PROFILE";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "FAKE_IDENTITY"
  | "FRAUD"
  | "INAPPROPRIATE"
  | "FAKE_JOB"
  | "SUSPICIOUS_ACCOUNT"
  | "MISLEADING_PROFILE"
  | "OTHER";

/** Submit a new customer support ticket */
export async function createSupportTicket(data: {
  subject: string;
  category: TicketCategory;
  description: string;
  priority?: TicketPriority;
}) {
  const user = await requireUser();

  const trimmedSubject = data.subject?.trim();
  const trimmedDesc = data.description?.trim();

  if (!trimmedSubject || trimmedSubject.length < 5) {
    return { error: "Subject must be at least 5 characters long." };
  }
  if (!trimmedDesc || trimmedDesc.length < 10) {
    return { error: "Description must be at least 10 characters long." };
  }

  // Count existing tickets to generate human-readable sequential ticket number
  const count = await db.supportTicket.count();
  const ticketNumber = `TICK-${1000 + count + 1}`;

  const validCategory = data.category || "TECHNICAL";
  const validPriority = data.priority || "MEDIUM";

  const ticket = await db.supportTicket.create({
    data: {
      ticketNumber,
      userId: user.id,
      subject: trimmedSubject.slice(0, 150),
      description: trimmedDesc.slice(0, 3000),
      category: validCategory,
      priority: validPriority,
      status: "OPEN",
    },
  });

  // Create initial message in the thread
  await db.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: user.id,
      body: trimmedDesc.slice(0, 3000),
      isInternal: false,
    },
  });

  // Notify support admins
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "APPROVED" },
    select: { id: true },
    take: 5,
  });

  for (const admin of admins) {
    await dispatchNotification({
      userId: admin.id,
      actorId: user.id,
      title: `New Support Ticket: ${ticketNumber}`,
      body: `"${trimmedSubject.slice(0, 60)}" filed by ${user.name}.`,
      type: "TICKET",
      link: `/admin/tickets`,
    });
  }

  revalidatePath("/student/support");
  revalidatePath("/alumni/support");
  revalidatePath("/teacher/support");
  revalidatePath("/admin/tickets");

  return { success: true, ticketId: ticket.id, ticketNumber };
}

/** Reply to a support ticket thread */
export async function replyToTicket(
  ticketId: string,
  body: string,
  isInternal = false
) {
  const user = await requireUser();
  const trimmedBody = body?.trim();

  if (!trimmedBody) {
    return { error: "Reply body cannot be empty." };
  }

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true, assignedTo: true },
  });

  if (!ticket) return { error: "Ticket not found." };

  const isAdmin = user.role === "ADMIN";

  // Authorization check: only ticket owner or admin can reply
  if (!isAdmin && ticket.userId !== user.id) {
    return { error: "Unauthorized access to this ticket." };
  }

  // Non-admins cannot create internal notes
  const effectiveInternal = isAdmin ? Boolean(isInternal) : false;

  const msg = await db.ticketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      body: trimmedBody.slice(0, 3000),
      isInternal: effectiveInternal,
    },
  });

  if (isAdmin && !effectiveInternal) {
    // If admin replies publicly to user, update status to WAITING_FOR_USER
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "WAITING_FOR_USER",
        updatedAt: new Date(),
      },
    });

    // Notify ticket owner
    await dispatchNotification({
      userId: ticket.userId,
      actorId: user.id,
      title: `Response on Support Ticket ${ticket.ticketNumber}`,
      body: trimmedBody.length > 80 ? trimmedBody.slice(0, 77) + "..." : trimmedBody,
      type: "TICKET",
      link: `/${ticket.user.role.toLowerCase()}/support`,
    });
  } else if (!isAdmin) {
    // If user replies, transition status back to IN_PROGRESS
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });

    // Notify assigned admin or all admins
    if (ticket.assignedToId) {
      await dispatchNotification({
        userId: ticket.assignedToId,
        actorId: user.id,
        title: `User response on Ticket ${ticket.ticketNumber}`,
        body: trimmedBody.length > 80 ? trimmedBody.slice(0, 77) + "..." : trimmedBody,
        type: "TICKET",
        link: `/admin/tickets`,
      });
    }
  }

  revalidatePath("/student/support");
  revalidatePath("/alumni/support");
  revalidatePath("/teacher/support");
  revalidatePath("/admin/tickets");

  return { success: true, messageId: msg.id };
}

/** Update support ticket status and resolution */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  resolution?: string
) {
  const user = await requireUser();
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };

  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    // Regular users can only close their own ticket or reopen it
    if (ticket.userId !== user.id) {
      return { error: "Unauthorized" };
    }
    if (status !== "CLOSED" && status !== "OPEN") {
      return { error: "Invalid status transition for user." };
    }
  }

  const isResolving = status === "RESOLVED" || status === "CLOSED";

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(resolution ? { resolution: resolution.trim() } : {}),
      ...(isResolving ? { resolvedAt: new Date() } : {}),
      updatedAt: new Date(),
    },
  });

  if (isAdmin && (status === "RESOLVED" || status === "CLOSED")) {
    await dispatchNotification({
      userId: ticket.userId,
      actorId: user.id,
      title: `Ticket ${ticket.ticketNumber} marked as ${status}`,
      body: resolution ? `Resolution: ${resolution}` : "Your issue has been marked resolved by our support team.",
      type: "TICKET",
      link: `/support`,
    });

    await db.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: "UPDATE_SUPPORT_TICKET",
        targetType: "SUPPORT_TICKET",
        targetId: ticketId,
        details: `Ticket ${ticket.ticketNumber} marked ${status}. Resolution: ${resolution || "N/A"}`,
      },
    }).catch(() => {});
  }

  revalidatePath("/student/support");
  revalidatePath("/alumni/support");
  revalidatePath("/teacher/support");
  revalidatePath("/admin/tickets");

  return { success: true };
}

/** Assign support ticket to an administrator */
export async function assignTicket(ticketId: string, adminId: string | null) {
  const admin = await requireUser("ADMIN");
  await requireAdminPermission("tickets:manage");

  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };

  if (adminId) {
    const targetAdmin = await db.user.findFirst({
      where: { id: adminId, role: "ADMIN", status: "APPROVED" },
    });
    if (!targetAdmin) return { error: "Target administrator not found." };
  }

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId: adminId || null,
      status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
      updatedAt: new Date(),
    },
  });

  if (adminId && adminId !== admin.id) {
    await dispatchNotification({
      userId: adminId,
      actorId: admin.id,
      title: `Assigned Support Ticket: ${ticket.ticketNumber}`,
      body: `You were assigned ticket "${ticket.subject}".`,
      type: "TICKET",
      link: `/admin/tickets`,
    });
  }

  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "ASSIGN_SUPPORT_TICKET",
      targetType: "SUPPORT_TICKET",
      targetId: ticketId,
      details: `Assigned ticket ${ticket.ticketNumber} to admin ID: ${adminId || "Unassigned"}`,
    },
  }).catch(() => {});

  revalidatePath("/admin/tickets");
  return { success: true };
}

/** Add internal staff note to a support ticket */
export async function addTicketInternalNote(ticketId: string, note: string) {
  const admin = await requireUser("ADMIN");
  await requireAdminPermission("tickets:manage");

  if (!note?.trim()) return { error: "Note cannot be empty." };

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      internalNotes: note.trim(),
      updatedAt: new Date(),
    },
  });

  // Also log in message thread as internal note
  await db.ticketMessage.create({
    data: {
      ticketId,
      authorId: admin.id,
      body: `[Internal Staff Note]: ${note.trim()}`,
      isInternal: true,
    },
  });

  revalidatePath("/admin/tickets");
  return { success: true };
}

/** Submit a trust & safety User Report against content or member */
export async function submitUserReport(data: {
  targetType: ReportTargetType;
  targetId?: string;
  reportedUserId?: string;
  reason: ReportReason;
  details?: string;
}) {
  const user = await requireUser();

  if (data.reportedUserId && data.reportedUserId === user.id) {
    return { error: "You cannot report your own account." };
  }

  const report = await db.userReport.create({
    data: {
      reporterId: user.id,
      reportedUserId: data.reportedUserId || null,
      targetType: data.targetType,
      targetId: data.targetId || null,
      reason: data.reason,
      details: data.details?.trim() || null,
      status: "PENDING",
    },
  });

  // Notify moderation admins
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "APPROVED" },
    select: { id: true },
    take: 5,
  });

  for (const admin of admins) {
    await dispatchNotification({
      userId: admin.id,
      actorId: user.id,
      title: `New Misconduct Report (${data.targetType})`,
      body: `Reason: ${data.reason}. Reported by ${user.name}.`,
      type: "REPORT",
      link: `/admin/reports`,
    });
  }

  revalidatePath("/admin/reports");
  return { success: true, reportId: report.id };
}

/** Moderate and resolve a User Report with concrete enforcement action */
export async function moderateReport(
  reportId: string,
  data: {
    status: "INVESTIGATING" | "RESOLVED" | "DISMISSED";
    moderationAction?: "WARNED" | "SUSPENDED" | "CONTENT_REMOVED" | "NONE";
    resolutionNotes?: string;
    investigationNotes?: string;
  }
) {
  const admin = await requireUser("ADMIN");
  await requireAdminPermission("reports:manage");

  const report = await db.userReport.findUnique({
    where: { id: reportId },
    include: { reporter: true, reportedUser: true },
  });

  if (!report) return { error: "Report not found." };

  const action = data.moderationAction || "NONE";

  // Execute enforcement action
  if (action === "SUSPENDED" && report.reportedUserId) {
    await db.user.update({
      where: { id: report.reportedUserId },
      data: { status: "SUSPENDED" },
    });
    // Dispatch institutional warning/suspension notification
    await dispatchNotification({
      userId: report.reportedUserId,
      actorId: admin.id,
      title: "Account Suspended for Community Guideline Violations",
      body: "Your account has been suspended following investigation of misconduct.",
      type: "SYSTEM",
    });
  } else if (action === "WARNED" && report.reportedUserId) {
    await dispatchNotification({
      userId: report.reportedUserId,
      actorId: admin.id,
      title: "Official Moderation Warning",
      body: `Your account received a moderation warning regarding: ${report.reason}. Please adhere to university community standards.`,
      type: "SYSTEM",
    });
  } else if (action === "CONTENT_REMOVED") {
    if (report.targetType === "JOB" && report.targetId) {
      await db.job.update({
        where: { id: report.targetId },
        data: { active: false, status: "REMOVED" },
      }).catch(() => {});
    } else if (report.targetType === "POST" && report.targetId) {
      await db.post.update({
        where: { id: report.targetId },
        data: { deletedAt: new Date() },
      }).catch(() => {});
    }
  }

  // Update report state
  await db.userReport.update({
    where: { id: reportId },
    data: {
      status: data.status,
      actionTaken: action,
      resolutionNotes: data.resolutionNotes || null,
      investigationNotes: data.investigationNotes || null,
      resolvedById: admin.id,
      resolvedAt: new Date(),
    },
  });

  // Notify reporter if resolved
  if (data.status === "RESOLVED") {
    await dispatchNotification({
      userId: report.reporterId,
      actorId: admin.id,
      title: "Update on Your Community Report",
      body: "Thank you for reporting. The moderation team has investigated and taken appropriate action.",
      type: "REPORT",
    });
  }

  // Audit logging
  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "RESOLVE_USER_REPORT",
      targetType: "USER_REPORT",
      targetId: reportId,
      details: `Report ${reportId} marked ${data.status}. Enforcement: ${action}. Notes: ${data.resolutionNotes || "None"}`,
    },
  }).catch(() => {});

  revalidatePath("/admin/reports");
  revalidatePath("/admin/users");
  revalidatePath("/admin/jobs");
  return { success: true };
}

