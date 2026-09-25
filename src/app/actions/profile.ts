"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { FormState } from "./auth";

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
  if (data.skills) {
    data.skills = data.skills.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
  }
  await db.user.update({ where: { id: user.id }, data });
  revalidatePath("/", "layout");
  return { fields: { saved: "1" }, at: Date.now() };
}

export async function setAlumniStatus(userId: string, status: "APPROVED" | "REJECTED") {
  await requireUser("ADMIN");
  await db.user.update({ where: { id: userId, role: "ALUMNI" }, data: { status } });
  revalidatePath("/admin");
}
