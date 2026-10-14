import "server-only";

import { db } from "./db";

export async function getTuitionsList() {
  return db.tuition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
          department: true,
        },
      },
      applications: {
        select: {
          id: true,
          applicantId: true,
          status: true,
        },
      },
    },
  });
}

export async function getTuitionById(id: string) {
  return db.tuition.findUnique({
    where: { id },
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
          department: true,
          batch: true,
          designation: true,
          company: true,
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              role: true,
              image: true,
              department: true,
              batch: true,
              studentId: true,
              skills: true,
              linkedin: true,
              github: true,
            },
          },
        },
      },
    },
  });
}
