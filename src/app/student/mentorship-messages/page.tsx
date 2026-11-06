import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { MentorshipMessagesView } from "@/components/mentorship-messages-view";

export const metadata: Metadata = { title: "Mentorship Messages" };

export default async function StudentMentorshipMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const user = await requireUser("STUDENT");
  return (
    <MentorshipMessagesView
      user={user}
      basePath="/student/mentorship-messages"
      selectedConnection={c}
    />
  );
}

