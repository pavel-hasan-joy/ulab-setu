"use server";

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
