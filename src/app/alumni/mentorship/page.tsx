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

export default async function AlumniMentorshipPage() {
  const user = await requireUser("ALUMNI");

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
    careerField: mp?.careerField || "",
    company: mp?.company || rawUser?.company || "",
    position: mp?.position || rawUser?.designation || "",
    department: mp?.department || rawUser?.department || "",
    expertise: mp?.expertise || rawUser?.mentorExpertise || "",
    skills: mp?.skills || rawUser?.skills || "",
    topics: mp?.topics || rawUser?.mentorTopics || "",
    yearsOfExperience: mp?.yearsOfExperience ?? null,
    preferredSessionType: mp?.preferredSessionType || rawUser?.mentorSessionFormat || "ONLINE",
    availableDays: mp?.availableDays || "Sunday, Tuesday, Thursday",
    communicationMethod: mp?.communicationMethod || "GOOGLE_MEET",
    maxMentees: mp?.maxMentees || rawUser?.mentorMaxMentees || 3,
    availabilityNote: mp?.availabilityNote || rawUser?.mentorAvailabilityNote || "",
    academicExpertise: mp?.academicExpertise || "",
    researchInterests: mp?.researchInterests || "",
    teachingAreas: mp?.teachingAreas || "",
    academicGuidanceTopics: mp?.academicGuidanceTopics || "",
  };

  const serializedRequests: MentorshipRequestRecord[] = rawRequests.map((r) => ({
    id: r.id,
    topic: r.topic,
    message: r.message,
    careerGoals: r.careerGoals,
    reason: r.reason,
    introduction: r.introduction,
    preferredAvailability: r.preferredAvailability,
    status: r.status,
    sessionFormat: r.sessionFormat,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    sessionLink: r.sessionLink,
    mentorNotes: r.mentorNotes,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    declinedAt: r.declinedAt ? r.declinedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
    endReason: r.endReason,
    connectionId: r.connectionId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    student: r.student,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Alumni Mentorship Console"
        description="Share industry guidance, review student resumes, conduct mock technical interviews, and manage 1-on-1 career mentorship sessions."
      />

      <div className="mt-6">
        <CareerMentorSettingsView
          initialProfile={initialProfile}
          initialRequests={serializedRequests}
          userRole="ALUMNI"
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
