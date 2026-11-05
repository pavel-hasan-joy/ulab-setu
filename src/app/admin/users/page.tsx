import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminUsersView,
  type AdminUserRecord,
} from "@/components/admin-users-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user: admin, subRole } = await requireAdminPermission("users:manage");

  // Reconcile alumni standing per institutional auto-approval contract
  await db.user.updateMany({
    where: { role: "ALUMNI", alumniVerified: false },
    data: {
      alumniVerified: true,
      status: "APPROVED",
      verificationMethod: "ulab_email",
      verifiedAt: new Date(),
    },
  });

  const [rawUsers, preApprovedCount] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        alumniVerified: true,
        verificationMethod: true,
        verifiedAt: true,
        department: true,
        studentId: true,
        batch: true,
        graduationYear: true,
        company: true,
        designation: true,
        location: true,
        bio: true,
        skills: true,
        linkedin: true,
        github: true,
        phone: true,
        image: true,
        deletedAt: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            jobs: true,
            applications: true,
            studentMentorships: true,
            mentorRequests: true,
          },
        },
      },
    }),
    db.preApprovedMember.count(),
  ]);

  const users: AdminUserRecord[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    emailVerified: Boolean(u.emailVerified),
    alumniVerified: Boolean(u.alumniVerified),
    verificationMethod: u.verificationMethod,
    verifiedAt: u.verifiedAt ? u.verifiedAt.toISOString() : null,
    department: u.department,
    studentId: u.studentId,
    batch: u.batch,
    graduationYear: u.graduationYear,
    company: u.company,
    designation: u.designation,
    location: u.location,
    bio: u.bio,
    skills: u.skills,
    linkedin: u.linkedin,
    github: u.github,
    phone: u.phone,
    image: u.image,
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    activity: {
      jobsCount: u._count?.jobs ?? 0,
      applicationsCount: u._count?.applications ?? 0,
      mentorshipCount: (u._count?.studentMentorships ?? 0) + (u._count?.mentorRequests ?? 0),
    },
  }));

  return (
    <PageIn>
      <PageHeader
        title="User Management & CRM Console"
        description="Search, inspect complete profiles, manage accounts, audit academic records, and govern all registered students, alumni, faculty, and administrators."
      />
      <AdminUsersView
        users={users}
        currentAdminId={admin.id}
        currentAdminSubRole={subRole}
        initialPreApprovedCount={preApprovedCount}
      />
    </PageIn>
  );
}
