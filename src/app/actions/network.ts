"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

/** Messaging is open to everyone: returns the conversation with `otherId`, creating it if needed. */
export async function startConversation(otherId: string) {
  const user = await requireUser();
  if (otherId === user.id) return null;
  const other = await db.user.findFirst({ where: { id: otherId, status: "APPROVED", role: { not: "ADMIN" } } });
  if (!other) return null;
  const existing = await db.connection.findFirst({
    where: { OR: [{ fromId: user.id, toId: otherId }, { fromId: otherId, toId: user.id }] },
  });
  if (existing) {
    if (existing.status !== "ACCEPTED") {
      await db.connection.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
    }
    return existing.id;
  }
  const created = await db.connection.create({ data: { fromId: user.id, toId: otherId, status: "ACCEPTED" } });
  return created.id;
}

function revalidateNetwork() {
  revalidatePath("/student/people");
  revalidatePath("/alumni/people");
  revalidatePath("/teacher/people");
  revalidatePath("/student/messages");
  revalidatePath("/alumni/messages");
  revalidatePath("/teacher/messages");
  revalidatePath("/", "layout");
}

/** Sends a LinkedIn-style Connection Request with optional note */
export async function sendConnectRequest(toId: string, note?: string) {
  const user = await requireUser();
  if (toId === user.id) return { error: "You cannot connect with yourself." };

  const target = await db.user.findFirst({ where: { id: toId, status: "APPROVED" } });
  if (!target) return { error: "Member not found or not approved." };

  const existing = await db.connection.findFirst({
    where: {
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
      // Auto-accept if the other user already sent a request
      await db.connection.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
      revalidateNetwork();
      return { success: true, message: "Connected!" };
    }
    // If previously declined or anything else, reset to PENDING
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
      note: note?.trim() || null,
    },
  });

  revalidateNetwork();
  return { success: true, message: "Invitation sent." };
}

/** Accepts an incoming connection request */
export async function acceptConnectRequest(connectionId: string) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({
    where: { id: connectionId, toId: user.id, status: "PENDING" },
  });
  if (!conn) return { error: "Request not found." };

  await db.connection.update({
    where: { id: conn.id },
    data: { status: "ACCEPTED" },
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
    where: { fromId: user.id, toId, status: "PENDING" },
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

export async function sendMessage(connectionId: string, body: string) {
  const user = await getCurrentUser();
  if (!user || !body.trim()) return;
  const conn = await db.connection.findFirst({
    where: { id: connectionId, OR: [{ fromId: user.id }, { toId: user.id }] },
  });
  if (!conn) return;
  await db.message.create({ data: { connectionId, senderId: user.id, body: body.trim().slice(0, 2000) } });
}

/** Polled by the chat window. */
export async function fetchMessages(connectionId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  const conn = await db.connection.findFirst({
    where: { id: connectionId, OR: [{ fromId: user.id }, { toId: user.id }] },
  });
  if (!conn) return [];
  const msgs = await db.message.findMany({ where: { connectionId }, orderBy: { createdAt: "asc" } });
  return msgs.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() }));
}
