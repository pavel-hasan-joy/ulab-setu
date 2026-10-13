import { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClassroomListClient } from "@/components/classroom/classroom-list-client";

export const metadata: Metadata = {
  title: "Classroom | Faculty Portal",
};

export default async function TeacherClassroomPage() {
  const user = await requireUser("TEACHER");

  const classrooms = await db.classroom.findMany({
    where: {
      OR: [
        { createdById: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          designation: true,
        },
      },
      _count: {
        select: {
          members: true,
          messages: true,
          notices: true,
        },
      },
    },
  });

  return (
    <ClassroomListClient
      classrooms={classrooms}
      userRole="TEACHER"
      basePath="/teacher/classroom"
    />
  );
}
