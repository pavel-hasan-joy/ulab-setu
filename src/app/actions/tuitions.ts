"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { homeFor, type Role } from "@/lib/session";

const tuitionSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  classGrade: z.string().trim().min(1, "Please select class or grade."),
  curriculum: z.string().trim().min(1, "Please select medium / curriculum."),
  subjects: z.string().trim().min(2, "Please enter subjects."),
  tutoringType: z.string().trim().min(1, "Please select tutoring type."),
  location: z.string().trim().min(2, "Please enter location or area."),
  daysPerWeek: z.string().trim().min(1, "Please specify days per week."),
  salary: z.string().trim().min(1, "Please specify salary / budget."),
  studentGender: z.string().trim().optional(),
  preferredTutorGender: z.string().trim().optional(),
  requirements: z.string().trim().optional(),
});

export type TuitionActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createTuition(
  _prevState: TuitionActionState,
  formData: FormData
): Promise<TuitionActionState> {
  const user = await requireUser();

  const raw = {
    title: formData.get("title") as string,
    classGrade: formData.get("classGrade") as string,
    curriculum: formData.get("curriculum") as string,
    subjects: formData.get("subjects") as string,
    tutoringType: formData.get("tutoringType") as string,
    location: formData.get("location") as string,
    daysPerWeek: formData.get("daysPerWeek") as string,
    salary: formData.get("salary") as string,
    studentGender: (formData.get("studentGender") as string) || "Any",
    preferredTutorGender: (formData.get("preferredTutorGender") as string) || "Any",
    requirements: (formData.get("requirements") as string) || "",
  };

  const parsed = tuitionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Validation error",
      fieldErrors,
    };
  }

  try {
    await db.tuition.create({
      data: {
        ...parsed.data,
        postedById: user.id,
        status: "OPEN",
      },
    });

    const basePath = homeFor(user.role as Role);
    revalidatePath(`${basePath}/tuitions`);
    revalidatePath("/student/tuitions");
    revalidatePath("/teacher/tuitions");
    revalidatePath("/alumni/tuitions");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to create tuition:", err);
    return { error: err?.message || "Failed to post tuition." };
  }
}

export async function applyTuition(
  _prevState: TuitionActionState,
  formData: FormData
): Promise<TuitionActionState> {
  const user = await requireUser();

  const tuitionId = formData.get("tuitionId") as string;
  const expectedSalary = formData.get("expectedSalary") as string;
  const experience = formData.get("experience") as string;
  const availability = formData.get("availability") as string;
  const note = formData.get("note") as string;

  if (!tuitionId) {
    return { error: "Tuition ID is missing." };
  }

  const tuition = await db.tuition.findUnique({
    where: { id: tuitionId },
  });

  if (!tuition || tuition.status !== "OPEN") {
    return { error: "This tuition posting is no longer accepting applications." };
  }

  if (tuition.postedById === user.id) {
    return { error: "You cannot apply to your own tuition posting." };
  }

  try {
    const existing = await db.tuitionApplication.findUnique({
      where: {
        tuitionId_applicantId: {
          tuitionId,
          applicantId: user.id,
        },
      },
    });

    if (existing) {
      return { error: "You have already applied to this tuition." };
    }

    await db.tuitionApplication.create({
      data: {
        tuitionId,
        applicantId: user.id,
        expectedSalary: expectedSalary || null,
        experience: experience || null,
        availability: availability || null,
        note: note || null,
        status: "APPLIED",
      },
    });

    const basePath = homeFor(user.role as Role);
    revalidatePath(`${basePath}/tuitions`);
    revalidatePath(`${basePath}/tuitions/${tuitionId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to apply for tuition:", err);
    return { error: err?.message || "Failed to submit application." };
  }
}

export async function toggleTuitionStatus(tuitionId: string, newStatus: "OPEN" | "CLOSED") {
  const user = await requireUser();

  const tuition = await db.tuition.findUnique({
    where: { id: tuitionId },
  });

  if (!tuition || (tuition.postedById !== user.id && user.role !== "ADMIN")) {
    throw new Error("Unauthorized to modify this tuition posting.");
  }

  await db.tuition.update({
    where: { id: tuitionId },
    data: { status: newStatus },
  });

  const basePath = homeFor(user.role as Role);
  revalidatePath(`${basePath}/tuitions`);
  revalidatePath(`${basePath}/tuitions/${tuitionId}`);
  revalidatePath("/student/tuitions");
  revalidatePath("/teacher/tuitions");
  revalidatePath("/alumni/tuitions");
}

export async function updateTuitionApplicationStatus(
  applicationId: string,
  status: "APPLIED" | "SHORTLISTED" | "SELECTED" | "REJECTED"
) {
  const user = await requireUser();

  const app = await db.tuitionApplication.findUnique({
    where: { id: applicationId },
    include: { tuition: true },
  });

  if (!app || (app.tuition.postedById !== user.id && user.role !== "ADMIN")) {
    throw new Error("Unauthorized to update application status.");
  }

  await db.tuitionApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  const basePath = homeFor(user.role as Role);
  revalidatePath(`${basePath}/tuitions/${app.tuitionId}`);
}

export async function deleteTuition(tuitionId: string) {
  const user = await requireUser();

  const tuition = await db.tuition.findUnique({
    where: { id: tuitionId },
  });

  if (!tuition || (tuition.postedById !== user.id && user.role !== "ADMIN")) {
    throw new Error("Unauthorized to delete this tuition posting.");
  }

  await db.tuition.delete({
    where: { id: tuitionId },
  });

  const basePath = homeFor(user.role as Role);
  revalidatePath(`${basePath}/tuitions`);
  revalidatePath("/student/tuitions");
  revalidatePath("/teacher/tuitions");
  revalidatePath("/alumni/tuitions");
}
