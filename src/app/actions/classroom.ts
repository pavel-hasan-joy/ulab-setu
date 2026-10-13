"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

function generateClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createClassroom(formData: {
  name: string;
  section?: string;
  subject?: string;
  description?: string;
}) {
  const user = await requireUser();
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return { error: "Only faculty and teachers can create classrooms." };
  }

  const name = formData.name?.trim();
  if (!name) return { error: "Classroom name is required." };

  // Generate unique code
  let code = generateClassCode();
  let tries = 0;
  while (tries < 10) {
    const existing = await db.classroom.findUnique({ where: { code } });
    if (!existing) break;
    code = generateClassCode();
    tries++;
  }

  const classroom = await db.classroom.create({
    data: {
      name,
      section: formData.section?.trim() || null,
      subject: formData.subject?.trim() || null,
      description: formData.description?.trim() || null,
      code,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: "TEACHER",
        },
      },
    },
  });

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  return { success: true, classroomId: classroom.id, code: classroom.code };
}

export async function joinClassroomByCode(codeRaw: string) {
  const user = await requireUser();
  if (user.role !== "STUDENT" && user.role !== "TEACHER") {
    return { error: "Only students and teachers can join classrooms." };
  }

  const code = codeRaw.trim().toUpperCase();
  if (!code) return { error: "Please enter a class code." };

  const classroom = await db.classroom.findUnique({
    where: { code },
  });

  if (!classroom) {
    return { error: "No classroom found with this code. Please verify the code with your teacher." };
  }

  const existing = await db.classroomMember.findUnique({
    where: {
      classroomId_userId: {
        classroomId: classroom.id,
        userId: user.id,
      },
    },
  });

  if (existing) {
    return { success: true, classroomId: classroom.id, alreadyMember: true };
  }

  await db.classroomMember.create({
    data: {
      classroomId: classroom.id,
      userId: user.id,
      role: user.role === "TEACHER" ? "TEACHER" : "STUDENT",
    },
  });

  revalidatePath("/student/classroom");
  revalidatePath("/teacher/classroom");
  return { success: true, classroomId: classroom.id };
}

export async function leaveClassroom(classroomId: string) {
  const user = await requireUser();
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { error: "Classroom not found." };

  if (classroom.createdById === user.id) {
    return { error: "The creator cannot leave the classroom. You can delete it instead." };
  }

  await db.classroomMember.deleteMany({
    where: { classroomId, userId: user.id },
  });

  revalidatePath("/student/classroom");
  revalidatePath("/teacher/classroom");
  return { success: true };
}

export async function deleteClassroom(classroomId: string) {
  const user = await requireUser();
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { error: "Classroom not found." };

  if (classroom.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "Only the teacher who created this classroom can delete it." };
  }

  await db.classroom.delete({ where: { id: classroomId } });

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  return { success: true };
}

export async function addMemberToClassroom(classroomId: string, targetUserId: string) {
  const user = await requireUser();
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { error: "Classroom not found." };

  // Caller must be creator or teacher member
  if (classroom.createdById !== user.id && user.role !== "ADMIN") {
    const isTeacher = await db.classroomMember.findFirst({
      where: { classroomId, userId: user.id, role: "TEACHER" },
    });
    if (!isTeacher) return { error: "Only teachers can add members directly." };
  }

  const target = await db.user.findFirst({
    where: { id: targetUserId, status: "APPROVED" },
  });
  if (!target) return { error: "User not found or not approved." };

  const existing = await db.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: targetUserId } },
  });
  if (existing) return { error: "User is already in this classroom." };

  await db.classroomMember.create({
    data: {
      classroomId,
      userId: targetUserId,
      role: target.role === "TEACHER" ? "TEACHER" : "STUDENT",
    },
  });

  revalidatePath(`/teacher/classroom/${classroomId}`);
  revalidatePath(`/student/classroom/${classroomId}`);
  return { success: true };
}

export async function removeMemberFromClassroom(classroomId: string, targetUserId: string) {
  const user = await requireUser();
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { error: "Classroom not found." };

  if (classroom.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "Only the classroom teacher can remove members." };
  }

  if (classroom.createdById === targetUserId) {
    return { error: "Cannot remove the classroom owner." };
  }

  await db.classroomMember.deleteMany({
    where: { classroomId, userId: targetUserId },
  });

  revalidatePath(`/teacher/classroom/${classroomId}`);
  revalidatePath(`/student/classroom/${classroomId}`);
  return { success: true };
}

export async function sendClassroomMessage(classroomId: string, body: string) {
  const user = await getCurrentUser();
  if (!user || !body.trim()) return { error: "Message cannot be empty." };

  // Verify membership
  const member = await db.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });
  if (!member) return { error: "You are not a member of this classroom." };

  const msg = await db.classroomMessage.create({
    data: {
      classroomId,
      senderId: user.id,
      body: body.trim().slice(0, 3000),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          designation: true,
          studentId: true,
        },
      },
    },
  });

  return { success: true, message: msg };
}

export async function fetchClassroomMessages(classroomId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const member = await db.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: user.id } },
  });
  if (!member) return [];

  const msgs = await db.classroomMessage.findMany({
    where: { classroomId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          designation: true,
          studentId: true,
        },
      },
    },
  });

  return msgs.map((m) => ({
    id: m.id,
    body: m.body,
    mine: m.senderId === user.id,
    at: m.createdAt.toISOString(),
    sender: {
      id: m.sender.id,
      name: m.sender.name,
      image: m.sender.image,
      role: m.sender.role,
      designation: m.sender.designation,
      studentId: m.sender.studentId,
    },
  }));
}

export async function createClassroomNotice(
  classroomId: string,
  title: string,
  content: string,
  isPinned: boolean = false
) {
  const user = await requireUser();
  const member = await db.classroomMember.findFirst({
    where: { classroomId, userId: user.id, role: "TEACHER" },
  });
  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { error: "Classroom not found." };

  if (!member && classroom.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "Only teachers can post classroom notices." };
  }

  if (!title.trim() || !content.trim()) {
    return { error: "Title and content are required." };
  }

  await db.classroomNotice.create({
    data: {
      classroomId,
      authorId: user.id,
      title: title.trim(),
      content: content.trim(),
      isPinned: Boolean(isPinned),
    },
  });

  revalidatePath(`/teacher/classroom/${classroomId}`);
  revalidatePath(`/student/classroom/${classroomId}`);
  return { success: true };
}

export async function deleteClassroomNotice(noticeId: string, classroomId: string) {
  const user = await requireUser();
  const notice = await db.classroomNotice.findUnique({ where: { id: noticeId } });
  if (!notice) return { error: "Notice not found." };

  const classroom = await db.classroom.findUnique({ where: { id: classroomId } });
  if (notice.authorId !== user.id && classroom?.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "You cannot delete this notice." };
  }

  await db.classroomNotice.delete({ where: { id: noticeId } });

  revalidatePath(`/teacher/classroom/${classroomId}`);
  revalidatePath(`/student/classroom/${classroomId}`);
  return { success: true };
}
