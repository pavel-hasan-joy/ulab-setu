"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { PageIn } from "@/components/motion";
import { Button, Field, FormError, Input } from "@/components/ui";

export function LoginForm({
  next,
  resetSuccess,
  deletedSuccess,
}: {
  next: string;
  resetSuccess?: boolean;
  deletedSuccess?: boolean;
}) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <PageIn>
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-ink-soft">Log in to see new jobs and messages.</p>

      {resetSuccess && (
        <div className="mt-4 rounded-xl border border-sage/40 bg-sage-wash p-3.5 text-sm font-medium text-sage">
          ✓ Password reset successfully! Please log in with your new password.
        </div>
      )}
      {deletedSuccess && (
        <div className="mt-4 rounded-xl border border-mist bg-surface p-3.5 text-sm font-medium text-ink-soft">
          Your account has been deleted successfully.
        </div>
      )}

      <form key={state?.at} action={action} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} />
        </Field>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Password</span>
            <Link href="/forgot-password" className="text-xs font-semibold text-ulab hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input name="password" type="password" autoComplete="current-password" required />
        </div>
        <FormError message={state?.error} />
        <Button className="w-full py-3" disabled={pending}>{pending ? "Logging in…" : "Log in"}</Button>
      </form>

      {/* 1-Click Demo Accounts for easy testing */}
      <div className="mt-6 rounded-2xl border border-mist bg-paper/60 p-3.5">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-bold text-ink">Sample Accounts for Testing</span>
          <span className="font-mono text-[11px] text-ink-soft bg-surface px-2 py-0.5 rounded-lg border border-mist">pass: password123</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
              const passInput = document.querySelector<HTMLInputElement>('input[name="password"]');
              if (emailInput) emailInput.value = "teacher@ulab.edu.bd";
              if (passInput) passInput.value = "password123";
            }}
            className="rounded-xl border border-mist bg-surface py-1.5 px-2 text-xs font-semibold text-ink transition hover:border-lilac hover:bg-lilac-wash hover:text-lilac-ink active:scale-95 text-center"
          >
            👨‍🏫 Teacher
          </button>
          <button
            type="button"
            onClick={() => {
              const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
              const passInput = document.querySelector<HTMLInputElement>('input[name="password"]');
              if (emailInput) emailInput.value = "student@ulab.edu.bd";
              if (passInput) passInput.value = "password123";
            }}
            className="rounded-xl border border-mist bg-surface py-1.5 px-2 text-xs font-semibold text-ink transition hover:border-ulab hover:bg-sky hover:text-ulab-deep active:scale-95 text-center"
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => {
              const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
              const passInput = document.querySelector<HTMLInputElement>('input[name="password"]');
              if (emailInput) emailInput.value = "alumni@ulab.edu.bd";
              if (passInput) passInput.value = "password123";
            }}
            className="rounded-xl border border-mist bg-surface py-1.5 px-2 text-xs font-semibold text-ink transition hover:border-gold hover:bg-gold-wash hover:text-gold-ink active:scale-95 text-center"
          >
            💼 Alumni
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here? <Link href="/signup" className="font-semibold text-ulab hover:underline">Create an account</Link>
      </p>
    </PageIn>
  );
}
