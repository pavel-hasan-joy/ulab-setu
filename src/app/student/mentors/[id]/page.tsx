import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageIn } from "@/components/motion";
import { StudentMentorDetailsView } from "@/components/student-mentor-details-view";
import { getMentorPublicProfile } from "@/app/actions/mentorship";

export const dynamic = "force-dynamic";

export default async function StudentMentorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ request?: string }>;
}) {
  await requireUser("STUDENT");
  const { id } = await params;
  const { request } = await searchParams;

  const mentor = await getMentorPublicProfile(id);

  if (!mentor || "error" in mentor) {
    notFound();
  }

  return (
    <PageIn>
      <StudentMentorDetailsView
        mentor={mentor}
        initialOpenRequest={request === "1"}
      />
    </PageIn>
  );
}
