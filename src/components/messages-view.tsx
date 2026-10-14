import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { PageIn } from "./motion";
import { PageHeader } from "./ui";
import {
  MessagesClient,
  type SerializedConnection,
  type SerializedGroup,
  type AvailablePerson,
} from "./messages-client";

export async function MessagesView({
  user,
  basePath,
  selectedConnection,
  selectedGroup,
}: {
  user: User;
  basePath: string;
  selectedConnection?: string;
  selectedGroup?: string;
}) {
  // Fetch user's direct connections with the last message defensively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connectionsData: any[] = [];
  try {
    connectionsData = await db.connection.findMany({
      where: { OR: [{ fromId: user.id }, { toId: user.id }] },
      include: {
        from: true,
        to: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("MessagesView: failed to fetch connections:", err);
    connectionsData = [];
  }

  // Fetch user's joined groups defensively (in case schema push is in progress)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let groupsData: any[] = [];
  try {
    groupsData = await db.group.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("MessagesView: failed to fetch groups:", err);
    groupsData = [];
  }

  // Fetch potential people to add to groups defensively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let peopleData: any[] = [];
  try {
    peopleData = await db.user.findMany({
      where: { status: "APPROVED", role: { not: "ADMIN" }, id: { not: user.id } },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        designation: true,
        company: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    });
  } catch (err) {
    console.error("MessagesView: failed to fetch people:", err);
    peopleData = [];
  }

  // Safe serialize connections (guarding against missing or null from/to users)
  const connections: SerializedConnection[] = [];
  for (const c of connectionsData) {
    if (!c || !c.id) continue;
    const other = c.fromId === user.id ? c.to : c.from;
    if (!other || !other.id) continue;
    const lastMsg = c.messages?.[0];
    connections.push({
      id: c.id,
      fromId: c.fromId,
      toId: c.toId,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      otherUser: {
        id: other.id,
        name: other.name || "User",
        department: other.department || null,
        designation: other.designation || null,
        company: other.company || null,
        role: other.role || "STUDENT",
      },
      lastMessage: lastMsg
        ? {
            body: lastMsg.body || "",
            createdAt: lastMsg.createdAt ? new Date(lastMsg.createdAt).toISOString() : new Date().toISOString(),
          }
        : undefined,
    });
  }

  // Safe serialize groups
  const groups: SerializedGroup[] = [];
  for (const g of groupsData) {
    if (!g || !g.id) continue;
    const lastMsg = g.messages?.[0];
    groups.push({
      id: g.id,
      name: g.name || "Group",
      description: g.description || null,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString(),
      createdById: g.createdById || "",
      memberCount: Array.isArray(g.members) ? g.members.length : 1,
      lastMessage: lastMsg
        ? {
            body: lastMsg.body || "",
            senderName: lastMsg.sender?.name || undefined,
            createdAt: lastMsg.createdAt ? new Date(lastMsg.createdAt).toISOString() : new Date().toISOString(),
          }
        : undefined,
    });
  }

  const availablePeople: AvailablePerson[] = peopleData.map((p) => ({
    id: p.id,
    name: p.name || "User",
    role: p.role || "STUDENT",
    subtitle: p.company ? `${p.designation} at ${p.company}` : p.department || "",
  }));

  // Resolve default active conversation if none explicitly selected
  let activeConnId = selectedConnection;
  let activeGroupId = selectedGroup;

  if (!activeConnId && !activeGroupId) {
    const latestConn = connections[0];
    const latestGroup = groups[0];

    if (latestConn && latestGroup) {
      const connTime = new Date(latestConn.lastMessage?.createdAt ?? latestConn.createdAt).getTime();
      const groupTime = new Date(latestGroup.lastMessage?.createdAt ?? latestGroup.createdAt).getTime();
      if (!isNaN(groupTime) && !isNaN(connTime) && groupTime >= connTime) {
        activeGroupId = latestGroup.id;
      } else {
        activeConnId = latestConn.id;
      }
    } else if (latestGroup) {
      activeGroupId = latestGroup.id;
    } else if (latestConn) {
      activeConnId = latestConn.id;
    }
  }

  return (
    <PageIn>
      <PageHeader
        title="Messages"
        description="Chat 1-on-1 with students, faculty, or alumni, or collaborate in Messenger-style groups."
      />

      <MessagesClient
        currentUserId={user.id}
        basePath={basePath}
        connections={connections}
        groups={groups}
        availablePeople={availablePeople}
        selectedConnectionId={activeConnId}
        selectedGroupId={activeGroupId}
      />
    </PageIn>
  );
}
