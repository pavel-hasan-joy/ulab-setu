import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { PageIn } from "./motion";
import { PageHeader } from "./ui";
import {
  MentorshipMessagesClient,
  type SerializedMentorshipConnection,
} from "./mentorship-messages-client";

export async function MentorshipMessagesView({
  user,
  basePath,
  selectedConnection,
}: {
  user: User;
  basePath: string;
  selectedConnection?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connectionsData: any[] = [];
  try {
    connectionsData = await db.connection.findMany({
      where: {
        type: "mentorship",
        OR: [{ fromId: user.id }, { toId: user.id }],
      },
      include: {
        from: true,
        to: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 25, // retrieve recent to pick last message and count unread
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("MentorshipMessagesView: failed to fetch connections:", err);
    connectionsData = [];
  }

  // Fetch associated requests to detect if a session was conducted/completed
  const connIds = connectionsData.map((c) => c.id);
  const reqIds = connectionsData
    .map((c) => c.mentorshipRequestId)
    .filter((id): id is string => Boolean(id));

  const [reqsByConnId, reqsById] = await Promise.all([
    connIds.length > 0
      ? db.mentorshipRequest.findMany({
          where: { connectionId: { in: connIds } },
          select: { connectionId: true, completedAt: true },
        })
      : Promise.resolve([]),
    reqIds.length > 0
      ? db.mentorshipRequest.findMany({
          where: { id: { in: reqIds } },
          select: { id: true, completedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const connCompletedMap = new Map<string, boolean>();
  for (const r of reqsByConnId) {
    if (r.connectionId && r.completedAt) {
      connCompletedMap.set(r.connectionId, true);
    }
  }
  for (const r of reqsById) {
    if (r.completedAt) {
      const c = connectionsData.find((item) => item.mentorshipRequestId === r.id);
      if (c) connCompletedMap.set(c.id, true);
    }
  }

  // Safe serialize connections
  const connections: SerializedMentorshipConnection[] = [];
  for (const c of connectionsData) {
    if (!c || !c.id) continue;
    const other = c.fromId === user.id ? c.to : c.from;
    if (!other || !other.id) continue;

    const msgs = Array.isArray(c.messages) ? c.messages : [];
    const lastMsg = msgs[0];
    const unreadCount = msgs.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m && m.senderId !== user.id && !m.isRead
    ).length;

    connections.push({
      id: c.id,
      fromId: c.fromId,
      toId: c.toId,
      topic: c.topic ?? null,
      isCompleted: Boolean(c.isCompleted),
      hasCompletedSession: Boolean(connCompletedMap.get(c.id)),
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      unreadCount,
      otherUser: {
        id: other.id,
        name: other.name || "User",
        role: other.role || "STUDENT",
        department: other.department || null,
        designation: other.designation || null,
        company: other.company || null,
        image: other.image || null,
        alumniVerified: Boolean(other.alumniVerified),
      },
      lastMessage: lastMsg
        ? {
            body: lastMsg.body || "",
            createdAt: lastMsg.createdAt
              ? new Date(lastMsg.createdAt).toISOString()
              : new Date().toISOString(),
          }
        : undefined,
    });
  }

  // Sort: active/recent first
  connections.sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt ?? a.createdAt).getTime();
    const timeB = new Date(b.lastMessage?.createdAt ?? b.createdAt).getTime();
    return timeB - timeA;
  });

  const activeConnId = selectedConnection || connections[0]?.id;

  return (
    <PageIn>
      <PageHeader
        title="Mentorship Messages"
        description="Private 1-on-1 career guidance communication between students and accepted mentors."
      />

      <MentorshipMessagesClient
        currentUserId={user.id}
        basePath={basePath}
        connections={connections}
        selectedConnectionId={activeConnId}
      />
    </PageIn>
  );
}

