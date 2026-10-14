import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTuitionsList } from "@/lib/tuitions";
import { TuitionsView } from "@/components/tuition/tuitions-view";

export const metadata: Metadata = {
  title: "Tuition Portal | ULAB Setu",
  description: "Browse and post private tutoring opportunities across the ULAB community.",
};

export default async function TeacherTuitionsPage() {
  const user = await requireUser("TEACHER");
  const tuitions = await getTuitionsList();

  return (
    <TuitionsView
      tuitions={tuitions}
      currentUserId={user.id}
      basePath="/teacher"
    />
  );
}
