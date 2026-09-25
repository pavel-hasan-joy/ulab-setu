"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export async function requestConnection(toId: string, note: string) {
  const user = await requireUser();
  if (toId === user.id) return;
  const existing = await db.connection.findFirst({
    where: { OR: [{ fromId: user.id, toId }, { fromId: toId, toId: user.id }] },
  });
  if (existing) return;
  await db.connection.create({ data: { fromId: user.id, toId, note: note.trim() || null } });
  revalidatePath("/student/alumni");
}

export async function respondConnection(connectionId: string, accept: boolean) {
  const user = await requireUser();
  const conn = await db.connection.findFirst({ where: { id: connectionId, toId: user.id } });
  if (!conn) return;
  await db.connection.update({
    where: { id: connectionId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });
  revalidatePath("/", "layout");
}

export async function sendMessage(connectionId: string, body: string) {
  const user = await getCurrentUser();
  if (!user || !body.trim()) return;
  const conn = await db.connection.findFirst({
    where: { id: connectionId, status: "ACCEPTED", OR: [{ fromId: user.id }, { toId: user.id }] },
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
