import { requireUser } from "@/lib/auth";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { StudentMyMentorsView } from "@/components/student-my-mentors-view";
import { getStudentMentorshipHistory } from "@/app/actions/mentorship";

export const dynamic = "force-dynamic";

export default async function StudentMyMentorsPage() {
  await requireUser("STUDENT");

  const history = await getStudentMentorshipHistory();

  return (
    <PageIn>
      <PageHeader
        title="My Mentors & Career Guidance"
        description="Track your mentorship requests, scheduled sessions, past guidance history, and ongoing career discussions."
      />

      <div className="mt-6">
        <StudentMyMentorsView initialRequests={history.all} />
      </div>
    </PageIn>
  );
}
