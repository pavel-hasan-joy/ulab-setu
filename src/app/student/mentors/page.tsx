import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { StudentFindMentorView } from "@/components/student-find-mentor-view";
import { findEligibleMentors } from "@/app/actions/mentorship";

export const dynamic = "force-dynamic";

export default async function FindMentorPage() {
  await requireUser("STUDENT");

  // Fetch initial eligible available mentors
  const [mentorsResult, deptRecords] = await Promise.all([
    findEligibleMentors({ pageSize: 50 }),
    db.user.findMany({
      where: { department: { not: null }, status: "APPROVED" },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
  ]);

  const departments = deptRecords
    .map((d) => d.department?.trim())
    .filter((d): d is string => Boolean(d));

  return (
    <PageIn>
      <PageHeader
        title="Find a Career Mentor"
        description="Connect 1-on-1 with verified ULAB alumni in top industry companies and university faculty mentors for career direction, mock interviews, and resume reviews."
      />

      <div className="mt-6">
        <StudentFindMentorView
          initialMentors={mentorsResult.mentors}
          departments={departments}
        />
      </div>
    </PageIn>
  );
}

