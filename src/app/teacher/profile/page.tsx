import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function Profile() {
  const user = await requireUser("TEACHER");
  return <ProfileForm user={user} />;
}
