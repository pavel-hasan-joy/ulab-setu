"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";
import { homeFor, type Role } from "@/lib/session";
import { sendOtpEmail } from "@/lib/email";
import {
  validateOfficialUlabEmail,
  sanitizeAndValidatePublicRole,
  OFFICIAL_ULAB_DOMAIN,
} from "@/lib/auth-validation";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "@/lib/rate-limit";

export type FormState = { error?: string; fields?: Record<string, string>; at?: number } | undefined;

export type RequestOtpResult = {
  success: boolean;
  message: string;
  isDemo?: boolean;
  code?: string;
};

/**
 * Helper to preserve form fields on error
 */
export async function fail(error: string, fields?: Record<string, string>): Promise<FormState> {
  return { error, fields, at: Date.now() };
}

/**
 * Sends a 6-digit email OTP to verify email ownership before signup.
 * Strictly validates official @ulab.edu.bd email domain.
 */
export async function requestSignupOtp(
  emailRaw: string,
  roleRaw: string
): Promise<RequestOtpResult> {
  // Validate email domain strictly
  const emailCheck = validateOfficialUlabEmail(emailRaw);
  if (!emailCheck.valid) {
    return { success: false, message: emailCheck.error || "Enter a valid @ulab.edu.bd email." };
  }
  const email = emailCheck.normalizedEmail;

  // Validate public role (block admin)
  const roleCheck = sanitizeAndValidatePublicRole(roleRaw);
  if (!roleCheck.valid) {
    return { success: false, message: roleCheck.error || "Invalid user role." };
  }

  // Check if account already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      success: false,
      message: "An account with this email already exists. Please log in instead.",
    };
  }

  // Generate 6-digit random verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Clean up any existing codes for this email
  await db.verificationCode.deleteMany({ where: { email } });

  // Store new code in database
  await db.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // Send the actual verification email via Resend/SMTP/Fallback
  const sendRes = await sendOtpEmail(email, code, "signup");
  return {
    success: true,
    message: sendRes.message,
    isDemo: sendRes.isDemo,
    code: sendRes.code,
  };
}

/**
 * Sends a 6-digit email OTP to verify account ownership before resetting password.
 */
export async function requestPasswordResetOtp(emailRaw: string): Promise<RequestOtpResult> {
  const emailCheck = validateOfficialUlabEmail(emailRaw);
  if (!emailCheck.valid) {
    return { success: false, message: emailCheck.error || "Enter a valid @ulab.edu.bd email." };
  }
  const email = emailCheck.normalizedEmail;

  // Check if account exists
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return {
      success: false,
      message: "No registered account found with this official ULAB email address.",
    };
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any older unused codes
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
  const sendRes = await sendOtpEmail(email, code, "reset");
  return {
    success: true,
    message: sendRes.message,
    isDemo: sendRes.isDemo,
    code: sendRes.code,
  };
}

/**
 * Validates OTP and updates password for user
 */
export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const emailCheck = validateOfficialUlabEmail(emailRaw);
  if (!emailCheck.valid) {
    return fail(emailCheck.error || "Enter a valid @ulab.edu.bd email.", { email: emailRaw, code });
  }
  const email = emailCheck.normalizedEmail;

  const fields = { email, code };

  if (!code || code.length !== 6) {
    return fail("Please enter the 6-digit verification code sent to your email.", fields);
  }
  if (password.length < 8) {
    return fail("New password must be at least 8 characters long.", fields);
  }
  if (password !== confirmPassword) {
    return fail("Passwords do not match.", fields);
  }

  // Check OTP existence and expiration
  const validOtp = await db.verificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!validOtp) {
    const expiredOtp = await db.verificationCode.findFirst({
      where: { email, code },
    });
    if (expiredOtp) {
      return fail("Verification code has expired. Please request a new code.", fields);
    }
    return fail("Invalid verification code. Please check your email or request a new one.", fields);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return fail("No account found with this email address.", fields);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Clean up used code
  await db.verificationCode.deleteMany({ where: { email } });

  redirect("/login?reset=1");
}

// Reusable Zod base schema for registration
const registrationBase = {
  name: z.string().trim().min(2, "Enter your full name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (e) => validateOfficialUlabEmail(e).valid,
      `Only official @${OFFICIAL_ULAB_DOMAIN} addresses are allowed.`,
    ),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  department: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
};

const studentRegistrationSchema = z.object({
  ...registrationBase,
  batch: z.string().trim().optional(),
});

const alumniRegistrationSchema = z.object({
  ...registrationBase,
  graduationYear: z.string().trim().optional(),
  company: z.string().trim().optional(),
  designation: z.string().trim().optional(),
});

const teacherRegistrationSchema = z.object({
  name: registrationBase.name,
  email: registrationBase.email,
  password: registrationBase.password,
  department: z.string().trim().optional(),
  designation: z.string().trim().optional(),
});

/**
 * Production-ready public registration endpoint.
 * Enforces role isolation, strict email domain validation, real OTP check,
 * and immediate automatic Alumni verification.
 */
export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;

  // 1. Validate & Sanitize Role (Strictly block unauthorized roles like ADMIN)
  const roleCheck = sanitizeAndValidatePublicRole(raw.role);
  if (!roleCheck.valid) {
    return fail(roleCheck.error || "The Admin role cannot be created through public registration.", raw);
  }
  const role = roleCheck.role;

  // 2. Schema Parse
  const schema =
    role === "ALUMNI"
      ? alumniRegistrationSchema
      : role === "TEACHER"
      ? teacherRegistrationSchema
      : studentRegistrationSchema;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0].message, raw);
  }

  const { password, ...data } = parsed.data;

  // 3. Re-verify exact institutional email domain
  const emailCheck = validateOfficialUlabEmail(data.email);
  if (!emailCheck.valid) {
    return fail(emailCheck.error || `Only official @${OFFICIAL_ULAB_DOMAIN} emails are allowed.`, raw);
  }
  const email = emailCheck.normalizedEmail;

  // 4. Duplicate Email Prevention
  if (await db.user.findUnique({ where: { email } })) {
    return fail("An account with this email already exists. Log in instead.", raw);
  }

  // 5. Verify Email OTP strictly (No bypasses)
  const verificationCode = String(raw.verificationCode ?? "").trim();
  if (!verificationCode || verificationCode.length !== 6) {
    return fail("Please enter the 6-digit verification code sent to your email.", raw);
  }

  const validOtp = await db.verificationCode.findFirst({
    where: {
      email,
      code: verificationCode,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!validOtp) {
    const expiredOtp = await db.verificationCode.findFirst({
      where: { email, code: verificationCode },
    });
    if (expiredOtp) {
      return fail("Verification code has expired. Please click 'Resend Code' to receive a new one.", raw);
    }
    return fail("Invalid verification code. Please check your email or request a new code.", raw);
  }

  // Delete used OTP immediately
  await db.verificationCode.deleteMany({ where: { email } });

  // 6. Automatic Account Activation & Role Setup
  const isAlumni = role === "ALUMNI";
  const now = new Date();

  const user = await db.user.create({
    data: {
      ...data,
      email,
      role,
      status: "APPROVED", // Immediately active
      emailVerified: true,
      alumniVerified: isAlumni, // True for Alumni, False for Student/Teacher
      verificationMethod: "ulab_email",
      verifiedAt: now,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  // 7. Establish encrypted HTTP-only JWT session
  await createSession(user.id, role);

  // 8. Redirect with welcome / verification feedback
  if (isAlumni) {
    redirect("/alumni?verified=1");
  } else if (role === "TEACHER") {
    redirect("/teacher?welcome=1");
  } else {
    redirect("/student?welcome=1");
  }
}

/**
 * Production-ready secure login endpoint.
 * Features:
 * - Login rate limiting to prevent brute-force attacks
 * - Strict @ulab.edu.bd domain check
 * - Immediate auto-activation of pending alumni/faculty
 * - Activity logging
 */
export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  // 1. Rate Limit Inspection
  const rateLimit = checkLoginRateLimit(emailRaw);
  if (!rateLimit.allowed) {
    return {
      error: rateLimit.error || "Too many failed login attempts. Please try again later.",
      fields: { email: emailRaw },
    };
  }

  // 2. Strict Email Validation
  const emailCheck = validateOfficialUlabEmail(emailRaw);
  if (!emailCheck.valid) {
    return {
      error: emailCheck.error || `Access is restricted to official @${OFFICIAL_ULAB_DOMAIN} members.`,
      fields: { email: emailRaw },
    };
  }
  const email = emailCheck.normalizedEmail;

  // 3. User Lookup
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    recordFailedLogin(email);
    return {
      error: "Email or password is incorrect.",
      fields: { email },
    };
  }

  // Check account suspension
  if (user.status === "REJECTED") {
    return {
      error: "Your account has been deactivated. Please contact the ULAB administration.",
      fields: { email },
    };
  }

  // Clear failed rate limit counter on successful authentication
  clearLoginRateLimit(email);

  // 4. Auto-verify user if status is PENDING or Alumni verification pending upon login
  if (user.status === "PENDING" || (user.role === "ALUMNI" && !user.alumniVerified)) {
    await db.user.update({
      where: { id: user.id },
      data: {
        status: "APPROVED",
        emailVerified: true,
        alumniVerified: user.role === "ALUMNI" ? true : user.alumniVerified,
        verificationMethod: "ulab_email",
        verifiedAt: user.verifiedAt ?? new Date(),
      },
    });
    user.status = "APPROVED";
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

/**
 * Destroys active user session and redirects to public landing
 */
export async function logout() {
  await deleteSession();
  redirect("/");
}
