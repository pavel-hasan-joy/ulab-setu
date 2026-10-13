import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClassroomView } from "@/components/classroom/classroom-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const classroom = await db.classroom.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: classroom ? `${classroom.name} | Classroom` : "Classroom",
  };
}

export default async function TeacherClassroomDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser("TEACHER");

  const classroom = await db.classroom.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          designation: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              studentId: true,
              batch: true,
              department: true,
              designation: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      notices: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: {
        take: 100,
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
      },
    },
  });

  if (!classroom) notFound();

  // If teacher is not yet a member or owner, ensure they are added or allowed
  const isOwner = classroom.createdById === user.id;
  const isMember = classroom.members.some((m) => m.userId === user.id);

  if (!isOwner && !isMember) {
    // Auto-join faculty if navigating by direct link or redirect
    await db.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: user.id,
        role: "TEACHER",
      },
    });
  }

  const initialMessages = classroom.messages.map((m) => ({
    id: m.id,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    attachmentName: m.attachmentName,
    attachmentSize: m.attachmentSize,
    attachmentType: m.attachmentType,
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

  return (
    <ClassroomView
      classroom={classroom}
      currentUserId={user.id}
      currentUserRole="TEACHER"
      isOwner={isOwner}
      basePath="/teacher/classroom"
      initialMessages={initialMessages}
      notices={classroom.notices}
      members={classroom.members}
    />
  );
}
