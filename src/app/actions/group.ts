"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export interface GroupAttachment {
  url: string;
  name: string;
  size: string;
  type: string;
}

/**
 * Create a new Messenger group with creator as ADMIN and initial members.
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  memberIds: string[];
}) {
  const user = await requireUser();
  const name = data.name.trim();
  if (!name) return { error: "Group name is required" };

  try {
    const group = await db.group.create({
      data: {
        name: name.slice(0, 100),
        description: data.description?.trim().slice(0, 300) || null,
        createdById: user.id,
        members: {
          create: [
            { userId: user.id, role: "ADMIN" },
            // Add other unique members
            ...Array.from(new Set(data.memberIds.filter((id) => id !== user.id))).map((userId) => ({
              userId,
              role: "MEMBER",
            })),
          ],
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    // Add initial system message
    await db.groupMessage.create({
      data: {
        groupId: group.id,
        senderId: user.id,
        body: `🎉 Created the group "${group.name}". Welcome everyone!`,
      },
    });

    revalidatePath("/student/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/alumni/messages");

    return { success: true, groupId: group.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create group";
    return { error: msg };
  }
}

/**
 * Send a message with optional file/document/image attachment in a group.
 */
export async function sendGroupMessage(
  groupId: string,
  body: string,
  attachment?: GroupAttachment
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    const trimmed = body.trim();
    if (!trimmed && !attachment) return { error: "Message or attachment is required" };

    // Verify membership
    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) return { error: "You are not a member of this group" };

    const msg = await db.groupMessage.create({
      data: {
        groupId,
        senderId: user.id,
        body: trimmed ? trimmed.slice(0, 3000) : (attachment ? `Sent an attachment: ${attachment.name}` : ""),
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        attachmentSize: attachment?.size || null,
        attachmentType: attachment?.type || null,
      },
    });

    return { success: true, messageId: msg.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    return { error: msg };
  }
}

/**
 * Fetch group messages for polling or initial load.
 */
export async function fetchGroupMessages(groupId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Verify membership
    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) return [];

    const msgs = await db.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            designation: true,
            company: true,
          },
        },
      },
    });

    return msgs.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      senderName: m.sender?.name || "Member",
      senderRole: m.sender?.role || "STUDENT",
      senderSubtitle: m.sender?.company
        ? `${m.sender.designation} at ${m.sender.company}`
        : m.sender?.department || "",
      mine: m.senderId === user.id,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentSize: m.attachmentSize,
      attachmentType: m.attachmentType,
      at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("fetchGroupMessages error:", err);
    return [];
  }
}

/**
 * Fetch group details, members, and permissions.
 */
export async function getGroupDetails(groupId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, department: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                department: true,
                designation: true,
                company: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!group) return null;

    const currentMember = group.members.find((m) => m.userId === user.id);
    if (!currentMember) return null;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : new Date().toISOString(),
      createdById: group.createdById,
      createdByName: group.createdBy?.name || "Admin",
      isAdmin: currentMember.role === "ADMIN" || group.createdById === user.id,
      members: group.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user?.name || "Member",
        role: m.role,
        userRole: m.user?.role || "STUDENT",
        subtitle: m.user?.company
          ? `${m.user.designation} at ${m.user.company}`
          : m.user?.department || "",
        joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : new Date().toISOString(),
      })),
    };
  } catch (err) {
    console.error("getGroupDetails error:", err);
    return null;
  }
}

/**
 * Add members to a group.
 */
export async function addGroupMembers(groupId: string, userIds: string[]) {
  try {
    const user = await requireUser();
    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) return { error: "You are not a member of this group" };

    const existing = await db.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((e) => e.userId));
    const newIds = userIds.filter((id) => !existingSet.has(id));

    if (newIds.length === 0) return { success: true };

    await db.groupMember.createMany({
      data: newIds.map((userId) => ({
        groupId,
        userId,
        role: "MEMBER",
      })),
    });

    const addedUsers = await db.user.findMany({
      where: { id: { in: newIds } },
      select: { name: true },
    });
    const names = addedUsers.map((u) => u.name).join(", ");

    await db.groupMessage.create({
      data: {
        groupId,
        senderId: user.id,
        body: `➕ Added ${names} to the group.`,
      },
    });

    revalidatePath("/student/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/alumni/messages");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add members";
    return { error: msg };
  }
}

/**
 * Remove a member from a group (Admin only).
 */
export async function removeGroupMember(groupId: string, targetUserId: string) {
  try {
    const user = await requireUser();
    const currentMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!currentMember || currentMember.role !== "ADMIN") {
      return { error: "Only group admins can remove members" };
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { name: true },
    });

    await db.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    await db.groupMessage.create({
      data: {
        groupId,
        senderId: user.id,
        body: `🚫 Removed ${targetUser?.name || "a member"} from the group.`,
      },
    });

    revalidatePath("/student/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/alumni/messages");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove member";
    return { error: msg };
  }
}

/**
 * Leave a group.
 */
export async function leaveGroup(groupId: string) {
  try {
    const user = await requireUser();
    const currentMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!currentMember) return { error: "You are not a member of this group" };

    await db.groupMember.delete({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    // Check if any members left
    const remainingCount = await db.groupMember.count({ where: { groupId } });
    if (remainingCount === 0) {
      // Delete empty group
      await db.group.delete({ where: { id: groupId } });
    } else {
      // If the leaving user was admin and there are members left, promote the oldest member
      if (currentMember.role === "ADMIN") {
        const adminCount = await db.groupMember.count({
          where: { groupId, role: "ADMIN" },
        });
        if (adminCount === 0) {
          const oldest = await db.groupMember.findFirst({
            where: { groupId },
            orderBy: { joinedAt: "asc" },
          });
          if (oldest) {
            await db.groupMember.update({
              where: { id: oldest.id },
              data: { role: "ADMIN" },
            });
          }
        }
      }

      await db.groupMessage.create({
        data: {
          groupId,
          senderId: user.id,
          body: `👋 ${user.name} left the group.`,
        },
      });
    }

    revalidatePath("/student/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/alumni/messages");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to leave group";
    return { error: msg };
  }
}

/**
 * Delete a group entirely (Creator/Admin only).
 */
export async function deleteGroup(groupId: string) {
  try {
    const user = await requireUser();
    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) return { error: "Group not found" };

    const currentMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    if (group.createdById !== user.id && currentMember?.role !== "ADMIN") {
      return { error: "Only the group creator or admin can delete this group" };
    }

    await db.group.delete({ where: { id: groupId } });

    revalidatePath("/student/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/alumni/messages");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete group";
    return { error: msg };
  }
}

/**
 * Get potential members to invite into a group (approved non-admin users).
 */
export async function getPeopleForGroup(excludeGroupId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    let excludedUserIds: string[] = [user.id];
    if (excludeGroupId) {
      const members = await db.groupMember.findMany({
        where: { groupId: excludeGroupId },
        select: { userId: true },
      });
      excludedUserIds = [...excludedUserIds, ...members.map((m) => m.userId)];
    }

    const people = await db.user.findMany({
      where: {
        status: "APPROVED",
        role: { not: "ADMIN" },
        id: { notIn: excludedUserIds },
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        designation: true,
        company: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return people.map((p) => ({
      id: p.id,
      name: p.name || "User",
      role: p.role || "STUDENT",
      subtitle: p.company ? `${p.designation} at ${p.company}` : p.department || "",
    }));
  } catch (err) {
    console.error("getPeopleForGroup error:", err);
    return [];
  }
}
