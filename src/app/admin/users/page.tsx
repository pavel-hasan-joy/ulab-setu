import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { PageHeader } from "@/components/ui";
import {
  AdminUsersView,
  type AdminUserRecord,
} from "@/components/admin-users-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireUser("ADMIN");

  const rawUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      studentId: true,
      batch: true,
      graduationYear: true,
      company: true,
      designation: true,
      location: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const users: AdminUserRecord[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    department: u.department,
    studentId: u.studentId,
    batch: u.batch,
    graduationYear: u.graduationYear,
    company: u.company,
    designation: u.designation,
    location: u.location,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  return (
    <PageIn>
      <PageHeader
        title="Users Directory & Access Control"
        description="Search, manage roles, audit student IDs, verify accounts, or export university membership records."
      />
      <AdminUsersView users={users} currentAdminId={admin.id} />
    </PageIn>
  );
}
