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
      <p className="mt-6 text-center text-sm text-ink-soft">
        New here? <Link href="/signup" className="font-semibold text-ulab hover:underline">Create an account</Link>
      </p>
    </PageIn>
  );
}
