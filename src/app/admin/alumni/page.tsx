import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Search,
  Building2,
  ExternalLink,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PageIn } from "@/components/motion";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminAlumniPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; verified?: string; dept?: string }>;
}) {
  await requireAdminPermission("alumni:manage");
  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();
  const verifiedFilter = params?.verified;
  const deptFilter = params?.dept;

  const alumniList = await db.user.findMany({
    where: {
      role: "ALUMNI",
      ...(verifiedFilter === "1"
        ? { alumniVerified: true }
        : verifiedFilter === "0"
        ? { alumniVerified: false }
        : {}),
      ...(deptFilter ? { department: deptFilter } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { designation: { contains: q, mode: "insensitive" } },
              { studentId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      graduationYear: true,
      studentId: true,
      company: true,
      designation: true,
      location: true,
      image: true,
      alumniVerified: true,
      verificationMethod: true,
      verifiedAt: true,
      phone: true,
      phonePublic: true,
      whatsapp: true,
      linkedin: true,
      createdAt: true,
    },
  });

  const totalAlumni = alumniList.length;
  const verifiedCount = alumniList.filter((a) => a.alumniVerified).length;

  return (
    <PageIn>
      <PageHeader
        title="Alumni Directory & Verification Management"
        description={`Institutional oversight of all former students. ${verifiedCount} of ${totalAlumni} currently verified via official ULAB email.`}
        action={
          <ButtonLink href="/admin/users" variant="outline" className="text-xs">
            Manage All Roles
          </ButtonLink>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="mb-6 p-4">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, company, position, or student ID..."
              className="h-10 w-full rounded-xl border border-mist/80 bg-paper pl-9 pr-3 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>

          <select
            name="verified"
            defaultValue={verifiedFilter || ""}
            className="h-10 rounded-xl border border-mist/80 bg-paper px-3 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
          >
            <option value="">All Verification States</option>
            <option value="1">Verified via ULAB Email</option>
            <option value="0">Unverified / Pending</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-ulab px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ulab-deep"
          >
            Filter
          </button>
          {(q || verifiedFilter || deptFilter) && (
            <ButtonLink href="/admin/alumni" variant="ghost" className="text-xs">
              Clear
            </ButtonLink>
          )}
        </form>
      </Card>

      {/* Alumni Grid / Cards */}
      {alumniList.length === 0 ? (
        <EmptyState
          title="No alumni found"
          body="Try adjusting your search criteria or clear active filters."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alumniList.map((a) => (
            <Card key={a.id} className="flex flex-col justify-between p-5 transition hover:shadow-lift">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.name} size={44} src={a.image} />
                    <div>
                      <h3 className="font-display font-bold text-ink">{a.name}</h3>
                      <p className="text-xs text-ink-soft">{a.email}</p>
                    </div>
                  </div>
                  {a.alumniVerified ? (
                    <span
                      title="Verified via ULAB Email"
                      className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <ShieldCheck size={14} />
                    </span>
                  ) : (
                    <Badge tone="gray">Unverified</Badge>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-mist/60 pt-3 text-xs text-ink-soft dark:border-white/5">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <Building2 size={13} className="text-ulab" />
                    <span>
                      {a.designation || "Alumnus"} {a.company ? `at ${a.company}` : ""}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <GraduationCap size={13} className="text-gold-ink" />
                    <span>
                      {a.department} {a.graduationYear ? `(Class of ${a.graduationYear})` : ""}
                    </span>
                  </p>
                  {a.studentId && (
                    <p className="font-mono text-[11px] text-ink-soft">Student ID: {a.studentId}</p>
                  )}
                </div>
              </div>

              {/* Contact and Links */}
              <div className="mt-4 flex items-center justify-between border-t border-mist/60 pt-3 text-xs dark:border-white/5">
                <div className="flex items-center gap-2">
                  {a.linkedin && (
                    <a
                      href={a.linkedin.startsWith("http") ? a.linkedin : `https://${a.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-soft hover:text-ulab"
                      title="LinkedIn"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {a.phone && a.phonePublic && (
                    <span className="flex items-center gap-1 text-[11px] text-ink-soft">
                      <Phone size={12} /> {a.phone}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {a.alumniVerified ? "Auto-Verified" : "Pending"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageIn>
  );
}

