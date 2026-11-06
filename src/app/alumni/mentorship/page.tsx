import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import { AlumniMentorshipView } from "@/components/alumni-mentorship-view";

export default async function AlumniMentorshipPage() {
  const user = await requireUser("ALUMNI");

  const [rawUser, rawRequests] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        isMentor: true,
        mentorAvailable: true,
        mentorTopics: true,
        mentorExpertise: true,
        mentorSessionFormat: true,
        mentorAvailabilityNote: true,
        mentorMaxMentees: true,
      },
    }),
    db.mentorshipRequest.findMany({
      where: { mentorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            batch: true,
            studentId: true,
            image: true,
          },
        },
      },
    }),
  ]);

  const profile = {
    id: user.id,
    isMentor: rawUser?.isMentor ?? false,
    mentorAvailable: rawUser?.mentorAvailable ?? true,
    mentorTopics: rawUser?.mentorTopics ?? null,
    mentorExpertise: rawUser?.mentorExpertise ?? null,
    mentorSessionFormat: rawUser?.mentorSessionFormat ?? "ONLINE",
    mentorAvailabilityNote: rawUser?.mentorAvailabilityNote ?? null,
    mentorMaxMentees: rawUser?.mentorMaxMentees ?? 3,
  };

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
    student: r.student,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Alumni Mentorship Hub"
        description="Empower the next generation of ULABians by sharing industry insights, reviewing portfolios, and scheduling advisory sessions."
      />
      <div className="mt-6">
        <AlumniMentorshipView
          initialProfile={profile}
          initialRequests={serializedRequests}
        />
      </div>
    </PageIn>
  );
}
