import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTuitionsList } from "@/lib/tuitions";
import { TuitionsView } from "@/components/tuition/tuitions-view";

export const metadata: Metadata = {
  title: "Tuition Portal | ULAB Setu",
  description: "Browse and post private tutoring opportunities across the ULAB community.",
};

export default async function StudentTuitionsPage() {
  const user = await requireUser("STUDENT");
  const tuitions = await getTuitionsList();

  return (
    <TuitionsView
      tuitions={tuitions}
      currentUserId={user.id}
      basePath="/student"
    />
  );
}
