"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deleteSession, requireUser } from "@/lib/auth";
import type { FormState } from "./auth";
import { cleanFacebook, cleanPhone } from "@/lib/contact";

const editable = ["name", "department", "batch", "graduationYear", "company", "designation", "location", "bio", "skills", "linkedin"] as const;

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const data: Record<string, string | null> = {};
  for (const key of editable) {
    const v = formData.get(key);
    if (v !== null) data[key] = String(v).trim() || null;
  }
  if (!data.name) return { error: "Name can't be empty." };
  if (data.linkedin && !/^https?:\/\//.test(data.linkedin)) {
    return { error: "LinkedIn link should start with https://" };
  }
  // Contact details and who can see them
  const contact: Record<string, string | boolean | null> = {};
  for (const key of ["phone", "whatsapp"] as const) {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw && !cleanPhone(raw)) return { error: `${key === "phone" ? "Phone" : "WhatsApp"} number doesn't look right. Example: 01712345678` };
    contact[key] = raw ? cleanPhone(raw) : null;
  }
  const fb = String(formData.get("facebook") ?? "").trim();
  if (fb && !cleanFacebook(fb)) return { error: "Facebook should be your profile link or username." };
  contact.facebook = fb ? cleanFacebook(fb) : null;
  for (const key of ["phonePublic", "whatsappPublic", "facebookPublic"] as const) {
    contact[key] = formData.get(key) === "public";
  }

  if (data.skills) {
    data.skills = data.skills.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
  }
  await db.user.update({ where: { id: user.id }, data: { ...data, ...contact } });
  revalidatePath("/", "layout");
  return { fields: { saved: "1" }, at: Date.now() };
}

/** Admin verifies alumni and teachers before they can post. */
export async function setAlumniStatus(userId: string, status: "APPROVED" | "REJECTED") {
  await requireUser("ADMIN");
  await db.user.update({ where: { id: userId, role: { in: ["ALUMNI", "TEACHER"] } }, data: { status } });
  revalidatePath("/admin");
}

/**
 * Permanently deletes the current user's account and terminates their session
 */
export async function deleteOwnAccount() {
  const user = await requireUser();

  await db.$transaction(async (tx) => {
    // 1. Delete user's login audit logs
    await tx.loginLog.deleteMany({ where: { userId: user.id } });

    // 2. Delete posts authored by user
    await tx.post.deleteMany({ where: { authorId: user.id } });

    // 3. Delete messages where user was sender
    await tx.message.deleteMany({ where: { senderId: user.id } });

    // 4. Delete job applications submitted by this user
    await tx.application.deleteMany({ where: { studentId: user.id } });

    // 5. Delete jobs posted by this user (including other users' applications on them)
    const userJobs = await tx.job.findMany({
      where: { postedById: user.id },
      select: { id: true },
    });
    if (userJobs.length > 0) {
      const jobIds = userJobs.map((j) => j.id);
      await tx.application.deleteMany({ where: { jobId: { in: jobIds } } });
      await tx.job.deleteMany({ where: { id: { in: jobIds } } });
    }

    // 6. Delete connections involving this user (and all conversation messages within them)
    const userConns = await tx.connection.findMany({
      where: { OR: [{ fromId: user.id }, { toId: user.id }] },
      select: { id: true },
    });
    if (userConns.length > 0) {
      const connIds = userConns.map((c) => c.id);
      await tx.message.deleteMany({ where: { connectionId: { in: connIds } } });
      await tx.connection.deleteMany({ where: { id: { in: connIds } } });
    }

    // 7. Delete user account
    await tx.user.delete({ where: { id: user.id } });
  });

  await deleteSession();
  redirect("/login?deleted=1");
}
