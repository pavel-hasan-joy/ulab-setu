"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";
import { homeFor, type Role } from "@/lib/session";
import { site } from "@/lib/site";

export type FormState = { error?: string; fields?: Record<string, string>; at?: number } | undefined;

/**
 * React resets a form after its action runs, and <select> elements don't get their defaultValue back.
 * Forms use `key={state?.at}` so they remount with the submitted values when validation fails.
 */
export async function fail(error: string, fields?: Record<string, string>): Promise<FormState> {
  return { error, fields, at: Date.now() };
}

const base = {
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password needs at least 8 characters."),
  department: z.string().min(1, "Choose your department."),
  studentId: z.string().trim().min(3, "Enter your student ID."),
};

const studentSchema = z.object({
  ...base,
  batch: z.string().trim().min(4, "Enter your admission year, e.g. 2022."),
  email: base.email.refine(
    (e) => e.endsWith(`@${site.studentEmailDomain}`),
    `Use your ${site.universityShort} email (@${site.studentEmailDomain}).`,
  ),
});

const alumniSchema = z.object({
  ...base,
  graduationYear: z.string().trim().regex(/^\d{4}$/, "Enter the year you graduated, e.g. 2019."),
  company: z.string().trim().min(1, "Enter where you work now."),
  designation: z.string().trim().min(1, "Enter your job title."),
});

const teacherSchema = z.object({
  name: base.name,
  password: base.password,
  department: base.department,
  email: base.email.refine(
    (e) => e.endsWith(`@${site.studentEmailDomain}`),
    `Use your ${site.universityShort} email (@${site.studentEmailDomain}).`,
  ),
  designation: z.string().min(1, "Choose your designation."),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const role: Role = raw.role === "ALUMNI" ? "ALUMNI" : raw.role === "TEACHER" ? "TEACHER" : "STUDENT";
  const schema = role === "ALUMNI" ? alumniSchema : role === "TEACHER" ? teacherSchema : studentSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { password, ...data } = parsed.data;
  if (await db.user.findUnique({ where: { email: data.email } })) {
    return fail("An account with this email already exists. Log in instead.", raw);
  }

  const user = await db.user.create({
    data: {
      ...data,
      role,
      // Alumni and teachers wait for the alumni office to confirm who they are before they can post.
      status: role === "STUDENT" ? "APPROVED" : "PENDING",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  await createSession(user.id, role);
  redirect(homeFor(role));
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect.", fields: { email } };
  }
  if (user.status === "REJECTED") {
    return { error: "Your alumni request was not approved. Contact the alumni office.", fields: { email } };
  }
  await createSession(user.id, user.role as Role);
  const home = homeFor(user.role as Role);
  redirect(next.startsWith(home) ? next : home);
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
