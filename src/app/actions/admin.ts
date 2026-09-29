"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { postKinds } from "@/lib/site";
import { fail, type FormState } from "./auth";

/** Admin verifies or changes status of any user */
export async function setAdminUserStatus(
  userId: string,
  status: "APPROVED" | "PENDING" | "REJECTED"
) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId && status !== "APPROVED") {
    throw new Error("You cannot change your own admin account status.");
  }
  await db.user.update({
    where: { id: userId },
    data: { status },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin changes user role (e.g. promote to Admin, make Teacher, Alumni, Student) */
export async function changeUserRole(
  userId: string,
  role: "STUDENT" | "ALUMNI" | "TEACHER" | "ADMIN"
) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin privileges.");
  }
  await db.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin permanently deletes a user */
export async function deleteUserByAdmin(userId: string) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId) {
    throw new Error("You cannot delete your own admin account.");
  }
  await db.user.delete({
    where: { id: userId },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin toggles job active state */
export async function toggleJobStatusByAdmin(jobId: string) {
  await requireUser("ADMIN");
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) return;
  await db.job.update({
    where: { id: jobId },
    data: { active: !job.active },
  });
  revalidatePath("/admin/jobs");
}

/** Admin deletes a job listing */
export async function deleteJobByAdmin(jobId: string) {
  await requireUser("ADMIN");
  await db.job.delete({
    where: { id: jobId },
  });
  revalidatePath("/admin/jobs");
}

const adminNoticeSchema = z.object({
  kind: z.enum(postKinds),
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  body: z.string().trim().min(5, "Body must be at least 5 characters."),
  link: z
    .union([z.literal(""), z.string().trim().url("Link must start with https://")])
    .optional(),
  eventDate: z.string().optional(),
});

/** Admin publishes an official university notice / event / scholarship */
export async function createAdminNotice(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireUser("ADMIN");
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = adminNoticeSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { link, eventDate, ...data } = parsed.data;
  await db.post.create({
    data: {
      ...data,
      link: link || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      authorId: admin.id,
    },
  });

  revalidatePath("/admin/notices");
  revalidatePath("/", "layout");
  return { fields: { posted: "1" }, at: Date.now() };
}

/** Admin deletes any community or official notice/post */
export async function deleteNoticeByAdmin(postId: string) {
  await requireUser("ADMIN");
  await db.post.delete({
    where: { id: postId },
  });
  revalidatePath("/admin/notices");
  revalidatePath("/", "layout");
}
