import type { User } from "@prisma/client";
import { ProfileFormClient } from "./profile-form-client";

// Only pass safe fields to the client (never the password hash).
export function ProfileForm({ user }: { user: User }) {
  const { passwordHash, createdAt, ...safe } = user;
  void passwordHash;
  void createdAt;
  return <ProfileFormClient user={safe} />;
}
