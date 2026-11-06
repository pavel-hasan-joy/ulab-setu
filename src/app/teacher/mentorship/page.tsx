import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  CareerMentorSettingsView,
  type MentorProfileItem,
  type MentorshipRequestRecord,
} from "@/components/career-mentor-settings-view";

export const dynamic = "force-dynamic";

export default async function TeacherMentorshipPage() {
  const user = await requireUser("TEACHER");

  const [rawUser, rawRequests, activeCount, completedCount] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      include: { mentorProfile: true },
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
    db.mentorshipRequest.count({
      where: {
        mentorId: user.id,
        status: { in: ["PENDING", "ACCEPTED", "SCHEDULED"] },
      },
    }),
    db.mentorshipRequest.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED",
      },
    }),
  ]);

  const mp = rawUser?.mentorProfile;
  const initialProfile: MentorProfileItem = {
    id: mp?.id,
    userId: user.id,
    isActive: mp?.isActive ?? rawUser?.isMentor ?? false,
    status: (mp?.status || (rawUser?.mentorAvailable ? "AVAILABLE" : "TEMPORARILY_UNAVAILABLE")) as any,
    bio: mp?.bio || rawUser?.bio || "",
    careerField: mp?.careerField || "Higher Education & Academic Research",
    company: mp?.company || "University of Liberal Arts Bangladesh",
    position: mp?.position || rawUser?.designation || "Faculty Member",
    department: mp?.department || rawUser?.department || "",
    expertise: mp?.expertise || rawUser?.mentorExpertise || "",
    skills: mp?.skills || rawUser?.skills || "",
    topics: mp?.topics || rawUser?.mentorTopics || "Higher Studies & Scholarships, Academic Research & Publications",
    yearsOfExperience: mp?.yearsOfExperience ?? null,
    preferredSessionType: mp?.preferredSessionType || rawUser?.mentorSessionFormat || "HYBRID",
    availableDays: mp?.availableDays || "Sunday, Tuesday, Thursday",
    communicationMethod: mp?.communicationMethod || "IN_PERSON",
    maxMentees: mp?.maxMentees || rawUser?.mentorMaxMentees || 3,
    availabilityNote: mp?.availabilityNote || rawUser?.mentorAvailabilityNote || "Available during campus office hours.",
    academicExpertise: mp?.academicExpertise || "",
    researchInterests: mp?.researchInterests || "",
    teachingAreas: mp?.teachingAreas || "",
    academicGuidanceTopics: mp?.academicGuidanceTopics || "Thesis Advising, Research Methodology, Graduate Applications",
  };

  const serializedRequests: MentorshipRequestRecord[] = rawRequests.map((r) => ({
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
        title="Faculty Academic & Career Mentorship Console"
        description="Provide academic advising, thesis guidance, research publications mentorship, and career recommendations for students."
      />

      <div className="mt-6">
        <CareerMentorSettingsView
          initialProfile={initialProfile}
          initialRequests={serializedRequests}
          userRole="TEACHER"
          userName={user.name}
          userEmail={user.email}
          userImage={user.image}
          activeMenteesCount={activeCount}
          completedSessionsCount={completedCount}
        />
      </div>
    </PageIn>
  );
}

