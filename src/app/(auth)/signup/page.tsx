import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Join" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return <SignupForm initialRole={role === "alumni" ? "ALUMNI" : role === "teacher" ? "TEACHER" : "STUDENT"} />;
}
