"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";
import { homeFor, type Role } from "@/lib/session";
import { site } from "@/lib/site";
import { sendOtpEmail } from "@/lib/email";

export type FormState = { error?: string; fields?: Record<string, string>; at?: number } | undefined;

export type RequestOtpResult = {
  success: boolean;
  message: string;
  isDemo?: boolean;
  code?: string;
};

/**
 * Sends a 6-digit email OTP to verify email ownership before signup
 */
export async function requestSignupOtp(
  emailRaw: string,
  role: Role
): Promise<RequestOtpResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, message: "Enter a valid email address." };
  }

  // Check institutional domain for students and faculty
  if (role !== "ALUMNI" && !email.endsWith(`@${site.studentEmailDomain}`)) {
    return {
      success: false,
      message: `Use your ${site.universityShort} email (@${site.studentEmailDomain}).`,
    };
  }

  // Check if email already registered
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      success: false,
      message: "An account with this email already exists. Log in instead.",
    };
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean up any old unused codes for this email
  await db.verificationCode.deleteMany({ where: { email } });

  // Store new code
  await db.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // Send the email
  const sendRes = await sendOtpEmail(email, code);
  return {
    success: true,
    message: sendRes.message,
    isDemo: sendRes.isDemo,
    code: sendRes.code,
  };
}

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

  // Verify Email OTP
  const verificationCode = String(raw.verificationCode ?? "").trim();
  if (!verificationCode) {
    return fail("Please enter the 6-digit verification code sent to your email.", raw);
  }

  const validOtp = await db.verificationCode.findFirst({
    where: {
      email: data.email,
      code: verificationCode,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!validOtp) {
    return fail("Invalid or expired verification code. Please click 'Get Code' to receive a new one.", raw);
  }

  // Delete used codes
  await db.verificationCode.deleteMany({ where: { email: data.email } });

  // Check auto-approval: students are auto-approved, alumni/teachers are checked against pre-approved directory
  let initialStatus: "APPROVED" | "PENDING" = "PENDING";
  if (role === "STUDENT") {
    initialStatus = "APPROVED";
  } else {
    const matchConditions: Array<{ email?: string; studentId?: string }> = [];
    if (data.email) {
      matchConditions.push({ email: data.email.toLowerCase() });
    }
    if ("studentId" in data && typeof data.studentId === "string" && data.studentId.trim()) {
      matchConditions.push({ studentId: data.studentId.trim() });
    }

    if (matchConditions.length > 0) {
      const preApproved = await db.preApprovedMember.findFirst({
        where: {
          role,
          OR: matchConditions,
        },
      });
      if (preApproved) {
        initialStatus = "APPROVED";
      }
    }
  }

  const user = await db.user.create({
    data: {
      ...data,
      role,
      status: initialStatus,
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
  const now = new Date();
  await Promise.all([
    createSession(user.id, user.role as Role),
    db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    }),
    db.loginLog.create({
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: now,
      },
    }),
  ]).catch(() => {});

  const home = homeFor(user.role as Role);
  redirect(next.startsWith(home) ? next : home);
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
