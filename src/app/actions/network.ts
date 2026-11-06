"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { dispatchNotification } from "./notifications";

function revalidateNetwork() {
  revalidatePath("/student/people");
  revalidatePath("/alumni/people");
  revalidatePath("/teacher/people");
  revalidatePath("/student/messages");
  revalidatePath("/alumni/messages");
  revalidatePath("/teacher/messages");
  revalidatePath("/", "layout");
}

/** Direct messaging is open to everyone without connection-request gating. Returns conversation connectionId. */
export async function startConversation(otherId: string) {
  const user = await requireUser();
  if (otherId === user.id) return null;

  const other = await db.user.findFirst({
    where: { id: otherId, status: "APPROVED", deletedAt: null },
  });
  if (!other) return null;

  // Check if blocked by either party
  const isBlocked = await db.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: otherId },
        { blockerId: otherId, blockedId: user.id },
      ],
    },
  });
  if (isBlocked) {
    return null;
  }

  const existing = await db.connection.findFirst({
    where: {
      type: "general",
      OR: [
        { fromId: user.id, toId: otherId },
        { fromId: otherId, toId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status !== "ACCEPTED") {
      await db.connection.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
    }
    return existing.id;
  }

  const created = await db.connection.create({
    data: {
      fromId: user.id,
      toId: otherId,
      status: "ACCEPTED",
      type: "general",
    },
  });

  revalidateNetwork();
  return created.id;
}

/** Sends a connection invitation */
export async function sendConnectRequest(toId: string, note?: string) {
  const user = await requireUser();
  if (toId === user.id) return { error: "You cannot connect with yourself." };

  const target = await db.user.findFirst({ where: { id: toId, status: "APPROVED" } });
  if (!target) return { error: "Member not found or not approved." };

  const existing = await db.connection.findFirst({
    where: {
      type: "general",
      OR: [
        { fromId: user.id, toId },
        { fromId: toId, toId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return { success: true, message: "Already connected." };
    }
    if (existing.fromId === user.id && existing.status === "PENDING") {
      return { success: true, message: "Connection request already pending." };
    }
    if (existing.toId === user.id && existing.status === "PENDING") {
      await db.connection.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
      revalidateNetwork();
      return { success: true, message: "Connected!" };
    }
    await db.connection.update({
      where: { id: existing.id },
      data: { fromId: user.id, toId, status: "PENDING", note: note?.trim() || null },
    });
    revalidateNetwork();
    return { success: true, message: "Invitation sent." };
  }

  await db.connection.create({
    data: {
      fromId: user.id,
      toId,
      status: "PENDING",
      type: "general",
      note: note?.trim() || null,
    },
  });

  // Notify recipient
  await dispatchNotification({
    userId: toId,
    actorId: user.id,
    title: `New Connection Request from ${user.name}`,
    body: note ? `"${note.slice(0, 100)}"` : "Sent you a connection request.",
    type: "CONNECTION",
    link: `/${target.role.toLowerCase()}/people`,
  });

  revalidateNetwork();
  return { success: true, message: "Invitation sent." };
}

/** Accepts an incoming connection request */
export async function acceptConnectRequest(connectionId: string) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({
    where: { id: connectionId, toId: user.id, status: "PENDING" },
    include: { from: true },
  });
  if (!conn) return { error: "Request not found." };

  await db.connection.update({
    where: { id: conn.id },
    data: { status: "ACCEPTED" },
  });

  // Notify sender
  await dispatchNotification({
    userId: conn.fromId,
    actorId: user.id,
    title: `${user.name} accepted your connection request`,
    body: "You are now connected and can freely collaborate.",
    type: "CONNECTION",
    link: `/${conn.from.role.toLowerCase()}/messages?c=${conn.id}`,
  });

  revalidateNetwork();
  return { success: true };
}

/** Declines or ignores an incoming connection request */
export async function declineConnectRequest(connectionId: string) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({
    where: { id: connectionId, toId: user.id },
  });
  if (!conn) return { error: "Request not found." };

  await db.connection.delete({ where: { id: conn.id } });
  revalidateNetwork();
  return { success: true };
}

/** Cancels / withdraws a sent connection request */
export async function cancelConnectRequest(toId: string) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({
    where: { fromId: user.id, toId, status: "PENDING", type: "general" },
  });
  if (conn) {
    await db.connection.delete({ where: { id: conn.id } });
    revalidateNetwork();
  }
  return { success: true };
}

/** Removes / disconnects an established connection */
export async function removeConnection(targetUserId: string) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({
    where: {
      type: "general",
      OR: [
        { fromId: user.id, toId: targetUserId },
        { fromId: targetUserId, toId: user.id },
      ],
    },
  });
  if (conn) {
    await db.connection.delete({ where: { id: conn.id } });
    revalidateNetwork();
  }
  return { success: true };
}

export interface AttachmentInput {
  url: string;
  name: string;
  size?: string;
  type?: string;
}

/** Send direct message with content validation, rate limiting, attachments, and recipient notification */
export async function sendMessage(
  connectionId: string,
  body: string,
  attachment?: AttachmentInput | null
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const trimmedBody = body.trim();
  if (!trimmedBody && !attachment?.url) {
    return { error: "Message cannot be empty." };
  }

  const conn = await db.connection.findFirst({
    where: { id: connectionId, OR: [{ fromId: user.id }, { toId: user.id }] },
    include: { from: true, to: true },
  });
  if (!conn) return { error: "Conversation not found." };

  // Guard: if mentorship conversation is completed/ended, prevent new messages (read-only mode)
  if (conn.type === "mentorship" && conn.isCompleted) {
    return {
      error: "This career mentorship has been concluded. The conversation is preserved in read-only mode.",
    };
  }

  const recipient = conn.fromId === user.id ? conn.to : conn.from;
  const recipientId = recipient.id;

  // Check if either user has blocked the other
  const isBlocked = await db.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: recipientId },
        { blockerId: recipientId, blockedId: user.id },
      ],
    },
  });
  if (isBlocked) {
    return { error: "Messaging is unavailable due to block restrictions." };
  }

  // Rate limiting: max 5 messages in 10 seconds
  const recentMessagesCount = await db.message.count({
    where: {
      senderId: user.id,
      createdAt: { gte: new Date(Date.now() - 10000) },
    },
  });
  if (recentMessagesCount >= 5) {
    return { error: "Slow down. Please wait a few seconds before sending another message." };
  }

  // Enforce attachment size, type, and URL safety if provided
  if (attachment) {
    if (attachment.url) {
      const isSafeUrl = /^(https?:\/\/|data:(image\/(jpeg|png|webp|gif)|application\/pdf);base64,)/i.test(attachment.url);
      if (!isSafeUrl) {
        return { error: "Unsafe attachment URL scheme or payload." };
      }
    }
    const safeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (attachment.type && !safeTypes.some((t) => attachment.type?.startsWith(t))) {
      return { error: "Unsupported attachment file type." };
    }
  }

  const msg = await db.message.create({
    data: {
      connectionId,
      senderId: user.id,
      body: trimmedBody.slice(0, 2000),
      attachmentUrl: attachment?.url || null,
      attachmentName: attachment?.name || null,
      attachmentSize: attachment?.size || null,
      attachmentType: attachment?.type || null,
    },
  });

  // Dispatch in-app notification to the recipient with respective inbox link
  if (conn.type === "mentorship") {
    await dispatchNotification({
      userId: recipientId,
      actorId: user.id,
      title: `Mentorship Message from ${user.name}`,
      body: trimmedBody
        ? trimmedBody.length > 80
          ? trimmedBody.slice(0, 77) + "..."
          : trimmedBody
        : `Sent an attachment: ${attachment?.name || "file"}`,
      type: "MENTORSHIP",
      link: `/${recipient.role.toLowerCase()}/mentorship-messages?c=${connectionId}`,
    });
  } else {
    await dispatchNotification({
      userId: recipientId,
      actorId: user.id,
      title: `Message from ${user.name}`,
      body: trimmedBody
        ? trimmedBody.length > 80
          ? trimmedBody.slice(0, 77) + "..."
          : trimmedBody
        : `Sent an attachment: ${attachment?.name || "file"}`,
      type: "MESSAGE",
      link: `/${recipient.role.toLowerCase()}/messages?c=${connectionId}`,
    });
  }

  return { success: true, messageId: msg.id };
}

export interface SerializedMessage {
  id: string;
  body: string;
  mine: boolean;
  at: string;
  isRead: boolean;
  readAt: string | null;
  attachment?: {
    url: string;
    name: string;
    size?: string | null;
    type?: string | null;
  } | null;
}

/** Polled by the chat window. Marks unread messages as read upon fetching. */
export async function fetchMessages(connectionId: string): Promise<SerializedMessage[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const conn = await db.connection.findFirst({
    where: { id: connectionId, OR: [{ fromId: user.id }, { toId: user.id }] },
  });
  if (!conn) return [];

  // Mark all unread incoming messages as read
  await db.message.updateMany({
    where: {
      connectionId,
      senderId: { not: user.id },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  const msgs = await db.message.findMany({
    where: { connectionId },
    orderBy: { createdAt: "asc" },
  });

  return msgs.map((m) => ({
    id: m.id,
    body: m.body,
    mine: m.senderId === user.id,
    at: m.createdAt.toISOString(),
    isRead: m.isRead,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    attachment: m.attachmentUrl
      ? {
          url: m.attachmentUrl,
          name: m.attachmentName || "Attachment",
          size: m.attachmentSize,
          type: m.attachmentType,
        }
      : null,
  }));
}

/** Block a user to prevent incoming messages and interactions */
export async function blockUser(targetUserId: string) {
  const user = await requireUser();
  if (targetUserId === user.id) {
    return { error: "You cannot block yourself." };
  }

  await db.blockedUser.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: targetUserId,
      },
    },
    create: {
      blockerId: user.id,
      blockedId: targetUserId,
    },
    update: {},
  });

  revalidateNetwork();
  return { success: true, message: "User blocked successfully." };
}

/** Unblock a previously blocked user */
export async function unblockUser(targetUserId: string) {
  const user = await requireUser();

  await db.blockedUser.deleteMany({
    where: {
      blockerId: user.id,
      blockedId: targetUserId,
    },
  });

  revalidateNetwork();
  return { success: true, message: "User unblocked." };
}

/** Report inappropriate message for admin moderation */
export async function reportMessage(messageId: string, reason: string, details?: string) {
  const user = await requireUser();

  const msg = await db.message.findUnique({
    where: { id: messageId },
    include: {
      connection: true,
    },
  });

  if (!msg) return { error: "Message not found." };
  // Verify user was a participant in the message connection
  if (msg.connection.fromId !== user.id && msg.connection.toId !== user.id) {
    return { error: "Unauthorized to report this message." };
  }

  await db.userReport.create({
    data: {
      reporterId: user.id,
      reportedUserId: msg.senderId,
      targetType: "MESSAGE",
      targetId: messageId,
      reason,
      details: details || `Reported message: "${msg.body.slice(0, 100)}"`,
      status: "PENDING",
    },
  });

  return { success: true, message: "Report submitted to platform moderators." };
}
