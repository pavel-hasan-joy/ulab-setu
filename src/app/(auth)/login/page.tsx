import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; deleted?: string }>;
}) {
  const { next, reset, deleted } = await searchParams;
  return <LoginForm next={next ?? ""} resetSuccess={reset === "1"} deletedSuccess={deleted === "1"} />;
}
