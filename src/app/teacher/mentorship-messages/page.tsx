import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { MentorshipMessagesView } from "@/components/mentorship-messages-view";

export const metadata: Metadata = { title: "Mentorship Messages" };

export default async function TeacherMentorshipMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const user = await requireUser("TEACHER");
  return (
    <MentorshipMessagesView
      user={user}
      basePath="/teacher/mentorship-messages"
      selectedConnection={c}
    />
  );
}

