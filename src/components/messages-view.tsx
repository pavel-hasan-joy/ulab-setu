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
  // Fetch user's direct connections with the last message
  const connectionsData = await db.connection.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }] },
    include: {
      from: true,
      to: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch user's joined groups with members and last message
  const groupsData = await db.group.findMany({
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

  // Fetch potential people to add to groups
  const peopleData = await db.user.findMany({
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

  // Serialize connections
  const connections: SerializedConnection[] = connectionsData.map((c) => {
    const other = c.fromId === user.id ? c.to : c.from;
    const lastMsg = c.messages[0];
    return {
      id: c.id,
      fromId: c.fromId,
      toId: c.toId,
      createdAt: c.createdAt.toISOString(),
      otherUser: {
        id: other.id,
        name: other.name,
        department: other.department,
        designation: other.designation,
        company: other.company,
        role: other.role,
      },
      lastMessage: lastMsg
        ? {
            body: lastMsg.body,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : undefined,
    };
  });

  // Serialize groups
  const groups: SerializedGroup[] = groupsData.map((g) => {
    const lastMsg = g.messages[0];
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      createdAt: g.createdAt.toISOString(),
      createdById: g.createdById,
      memberCount: g.members.length,
      lastMessage: lastMsg
        ? {
            body: lastMsg.body,
            senderName: lastMsg.sender?.name,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : undefined,
    };
  });

  const availablePeople: AvailablePerson[] = peopleData.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
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
      if (groupTime >= connTime) {
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
