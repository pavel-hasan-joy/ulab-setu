import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { MentorshipMessagesView } from "@/components/mentorship-messages-view";

export const metadata: Metadata = { title: "Mentorship Messages" };

export default async function AlumniMentorshipMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const user = await requireUser("ALUMNI");
  return (
    <MentorshipMessagesView
      user={user}
      basePath="/alumni/mentorship-messages"
      selectedConnection={c}
    />
  );
}

