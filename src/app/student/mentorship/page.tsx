import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { StudentMentorshipView } from "@/components/student-mentorship-view";

export default async function StudentMentorshipPage() {
  const user = await requireUser("STUDENT");

  const [rawMentors, rawRequests] = await Promise.all([
    db.user.findMany({
      where: {
        isMentor: true,
        status: "APPROVED",
        id: { not: user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        company: true,
        image: true,
        skills: true,
        alumniVerified: true,
        isMentor: true,
        mentorAvailable: true,
        mentorTopics: true,
        mentorExpertise: true,
        mentorSessionFormat: true,
        mentorAvailabilityNote: true,
        mentorMaxMentees: true,
      },
      orderBy: { name: "asc" },
    }),
    db.mentorshipRequest.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            designation: true,
            company: true,
            image: true,
            alumniVerified: true,
          },
        },
      },
    }),
  ]);

  const serializedRequests = rawRequests.map((r) => ({
    id: r.id,
    topic: r.topic,
    message: r.message,
    careerGoals: r.careerGoals,
    status: r.status,
    sessionFormat: r.sessionFormat,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    sessionLink: r.sessionLink,
    mentorNotes: r.mentorNotes,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    mentor: r.mentor,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Alumni Career Mentorship"
        description="Connect with verified ULAB alumni working in industry for 1-on-1 resume reviews, mock interviews, and career guidance."
      />
      <div className="mt-6">
        <StudentMentorshipView
          mentors={rawMentors}
          requests={serializedRequests}
          currentUserId={user.id}
        />
      </div>
    </PageIn>
  );
}
