"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
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
