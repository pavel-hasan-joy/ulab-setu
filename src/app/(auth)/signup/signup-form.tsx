"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Briefcase, GraduationCap, Presentation, MailCheck, KeyRound, ShieldCheck } from "lucide-react";
import { useActionState, useState, useEffect, useMemo } from "react";
import { signup, requestSignupOtp, type RequestOtpResult } from "@/app/actions/auth";
import { PageIn } from "@/components/motion";
import { Button, Field, FormError, Input, Select, cn } from "@/components/ui";
import { departments, site, teacherRanks } from "@/lib/site";
import { validateOfficialUlabEmail, OFFICIAL_ULAB_DOMAIN } from "@/lib/auth-validation";

export type SignupRole = "STUDENT" | "ALUMNI" | "TEACHER";

const roles = [
  {
    id: "STUDENT" as SignupRole,
    icon: GraduationCap,
    title: "Student",
    body: "Find mentors and career jobs",
    tone: "border-ulab-light bg-sky",
    ink: "text-ulab",
  },
  {
    id: "ALUMNI" as SignupRole,
    icon: Briefcase,
    title: "Alumni",
    body: "Guide juniors & post jobs",
    tone: "border-gold bg-gold-wash",
    ink: "text-gold-ink",
  },
  {
    id: "TEACHER" as SignupRole,
    icon: Presentation,
    title: "Faculty",
    body: "Academic research & notices",
    tone: "border-[#a99ce8] bg-lilac-wash",
    ink: "text-lilac-ink",
  },
];

const slide = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export function SignupForm({ initialRole }: { initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [state, action, pending] = useActionState(signup, undefined);
  const f = state?.fields ?? {};

  const [emailValue, setEmailValue] = useState(f.email || "");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInfo, setOtpInfo] = useState<RequestOtpResult | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Client-side domain validation feedback
  const emailValidation = useMemo(() => {
    if (!emailValue.trim()) return null;
    return validateOfficialUlabEmail(emailValue);
  }, [emailValue]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!emailValue.trim()) {
      setOtpError("Please enter your official ULAB email address first.");
      return;
    }

    const check = validateOfficialUlabEmail(emailValue);
    if (!check.valid) {
      setOtpError(check.error || `Only official @${OFFICIAL_ULAB_DOMAIN} emails are allowed.`);
      return;
    }

    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await requestSignupOtp(emailValue, role);
      if (res.success) {
        setOtpSent(true);
        setOtpInfo(res);
        setCooldown(60);
      } else {
        setOtpError(res.message);
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <PageIn>
      <h1 className="text-3xl font-semibold">Join {site.name}</h1>
      <p className="mt-2 text-ink-soft">Select your role to connect with the {site.universityShort} network.</p>

      {/* Role Selection Tabs */}
      <div className="mt-8 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="I am a">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "relative rounded-2xl border p-3.5 text-left transition-colors",
              role === r.id ? "border-transparent" : "border-mist bg-surface hover:border-ulab-light/60"
            )}
          >
            {role === r.id && (
              <motion.span
                layoutId="role-highlight"
                className={cn("absolute inset-0 rounded-2xl border-2", r.tone)}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative block">
              <r.icon size={20} className={r.ink} />
              <span className="mt-2.5 block font-semibold text-ink">{r.title}</span>
              <span className="block text-[11px] leading-tight text-ink-soft">{r.body}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Automatic Alumni Verification Notice */}
      {role === "ALUMNI" && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gold/40 bg-gold-wash/80 p-3 text-xs text-gold-ink dark:border-gold/30 dark:bg-gold-wash/20">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold-ink" />
          <div>
            <span className="font-semibold">Verified via ULAB Email:</span> Alumni registering with their official{" "}
            <code className="font-mono font-semibold">@ulab.edu.bd</code> email are automatically verified upon OTP
            confirmation with immediate access.
          </div>
        </div>
      )}

      <form key={state?.at} action={action} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />

        {/* Full Name */}
        <Field label="Full name">
          <Input name="name" autoComplete="name" required placeholder="e.g. Farhana Akter" defaultValue={f.name} />
        </Field>

        {/* Official ULAB Email & Verification Code Request */}
        <div className="space-y-3">
          <Field
            label={`${site.universityShort} Institutional Email`}
            hint={`Must be your exact official @${OFFICIAL_ULAB_DOMAIN} address.`}
          >
            <div className="flex gap-2">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={emailValue}
                onChange={(e) => {
                  setEmailValue(e.target.value);
                  if (otpError) setOtpError(null);
                }}
                placeholder={`username@${OFFICIAL_ULAB_DOMAIN}`}
                className={cn(
                  "flex-1",
                  emailValidation && !emailValidation.valid ? "border-rose-400 focus:border-rose-500" : ""
                )}
              />
              <button
                type="button"
                disabled={isSendingOtp || cooldown > 0}
                onClick={handleSendOtp}
                className="shrink-0 rounded-xl bg-ulab-deep px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ulab-deep/90 active:scale-95 disabled:opacity-50"
              >
                {isSendingOtp
                  ? "Sending…"
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : otpSent
                  ? "Resend Code"
                  : "Send Code"}
              </button>
            </div>
          </Field>

          {/* Client Domain Error Warning */}
          {emailValidation && !emailValidation.valid && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{emailValidation.error}</p>
          )}

          {/* OTP Error Feedback */}
          {otpError && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{otpError}</p>}

          {/* OTP Success Notice */}
          {otpInfo && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <p className="flex items-center gap-1.5 font-semibold">
                <MailCheck size={15} /> {otpInfo.message}
              </p>
            </div>
          )}

          {/* Verification Code Input */}
          <Field
            label="Verification Code (OTP)"
            hint="Enter the 6-digit confirmation code delivered to your email."
          >
            <div className="relative">
              <Input
                name="verificationCode"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                className="pl-9 font-mono text-base tracking-widest"
                defaultValue={f.verificationCode || (otpInfo?.isDemo ? otpInfo?.code : "")}
              />
              <KeyRound
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
              />
            </div>
          </Field>
        </div>

        {/* Optional Academic Department */}
        <Field label="Department (Optional)">
          <Select
            name="department"
            options={departments}
            placeholder="Select your department"
            defaultValue={f.department || "Computer Science and Engineering"}
          />
        </Field>

        {/* Role-Specific Optional Profile Information */}
        <AnimatePresence mode="popLayout" initial={false}>
          {role === "STUDENT" && (
            <motion.div key="student" {...slide} className="grid gap-4 sm:grid-cols-2">
              <Field label="Student ID (Optional)" hint="Voluntary student ID">
                <Input name="studentId" placeholder="e.g. 221014012" defaultValue={f.studentId} />
              </Field>
              <Field label="Admission Year (Optional)">
                <Input name="batch" inputMode="numeric" placeholder="e.g. 2022" defaultValue={f.batch} />
              </Field>
            </motion.div>
          )}
          {role === "ALUMNI" && (
            <motion.div key="alumni" {...slide} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Graduation Year (Optional)">
                  <Input
                    name="graduationYear"
                    inputMode="numeric"
                    placeholder="e.g. 2019"
                    defaultValue={f.graduationYear}
                  />
                </Field>
                <Field label="Student ID (Optional)">
                  <Input name="studentId" placeholder="Optional student ID" defaultValue={f.studentId} />
                </Field>
                <Field label="Current Company (Optional)">
                  <Input name="company" placeholder="e.g. Google, Grameenphone" defaultValue={f.company} />
                </Field>
                <Field label="Job Title / Position (Optional)">
                  <Input name="designation" placeholder="e.g. Software Engineer" defaultValue={f.designation} />
                </Field>
              </div>
            </motion.div>
          )}
          {role === "TEACHER" && (
            <motion.div key="teacher" {...slide} className="space-y-4">
              <Field label="Academic Designation (Optional)">
                <Select
                  name="designation"
                  options={teacherRanks}
                  placeholder="Select designation"
                  defaultValue={f.designation || "Assistant Professor"}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password */}
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>

        <FormError message={state?.error} />

        <Button className="w-full py-3" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ulab hover:underline">
          Log in
        </Link>
      </p>
    </PageIn>
  );
}
