"use client";

import Link from "next/link";
import { MailCheck, KeyRound, ArrowLeft } from "lucide-react";
import { useActionState, useState, useEffect } from "react";
import { resetPassword, requestPasswordResetOtp, type RequestOtpResult } from "@/app/actions/auth";
import { PageIn } from "@/components/motion";
import { Button, Field, FormError, Input } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  const [emailValue, setEmailValue] = useState(state?.fields?.email || "");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInfo, setOtpInfo] = useState<RequestOtpResult | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!emailValue.trim()) {
      setOtpError("Please enter your email first.");
      return;
    }
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await requestPasswordResetOtp(emailValue);
      if (res.success) {
        setOtpSent(true);
        setOtpInfo(res);
        setCooldown(60);
      } else {
        setOtpError(res.message);
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <PageIn>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition mb-6"
      >
        <ArrowLeft size={16} /> Back to log in
      </Link>

      <h1 className="text-3xl font-semibold">Reset password</h1>
      <p className="mt-2 text-ink-soft">
        Enter your registered email to receive a 6-digit verification code.
      </p>

      <form key={state?.at} action={action} className="mt-8 space-y-4">
        {/* Email & Send Code Row */}
        <div>
          <Field label="Registered email">
            <div className="flex gap-2">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@ulab.edu.bd"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || cooldown > 0}
                className="shrink-0 rounded-xl bg-ulab px-4 py-2.5 text-xs font-semibold text-white shadow-lift transition hover:bg-ulab-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingOtp
                  ? "Sending…"
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : otpSent
                  ? "Resend Code"
                  : "Get Code"}
              </button>
            </div>
          </Field>
          {otpError && <p className="mt-1.5 text-xs text-rose">{otpError}</p>}
          {otpSent && (
            <div className="mt-2.5 rounded-xl border border-sage/40 bg-sage-wash/70 p-3 text-xs text-sage">
              <div className="flex items-center gap-1.5 font-medium">
                <MailCheck size={14} className="shrink-0" />
                <span>Verification code sent to your email. Check your inbox!</span>
              </div>
              {otpInfo?.isDemo && otpInfo.code && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-mist bg-surface p-2 font-mono text-ink shadow-xs">
                  <span>Demo Code: <strong>{otpInfo.code}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[name="code"]') as HTMLInputElement;
                      if (input && otpInfo.code) input.value = otpInfo.code;
                    }}
                    className="rounded bg-ulab/10 px-2 py-0.5 text-[11px] font-sans font-medium text-ulab hover:bg-ulab/20"
                  >
                    Auto-fill
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6-digit Code */}
        <Field label="6-Digit Verification Code" hint="Check your inbox or spam folder for the code.">
          <div className="relative">
            <Input
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              required
              defaultValue={state?.fields?.code}
              className="font-mono text-lg tracking-widest pl-10"
            />
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70 pointer-events-none" />
          </div>
        </Field>

        {/* New Password */}
        <Field label="New password">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
        </Field>

        {/* Confirm New Password */}
        <Field label="Confirm new password">
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-type your new password"
            required
          />
        </Field>

        <FormError message={state?.error} />

        <Button className="w-full py-3" disabled={pending}>
          {pending ? "Resetting password…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-ulab hover:underline">
          Log in
        </Link>
      </p>
    </PageIn>
  );
}
