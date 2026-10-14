"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Calendar,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { CreateTuitionModal } from "./create-tuition-modal";
import { Avatar, Badge, Button, Card, EmptyState, timeAgo } from "@/components/ui";

export type TuitionItem = {
  id: string;
  title: string;
  classGrade: string;
  curriculum: string;
  subjects: string;
  tutoringType: string;
  location: string;
  daysPerWeek: string;
  salary: string;
  studentGender: string | null;
  preferredTutorGender: string | null;
  requirements: string | null;
  status: string;
  createdAt: Date | string;
  postedById: string;
  postedBy: {
    id: string;
    name: string;
    role: string;
    image: string | null;
    department: string | null;
  };
  applications: Array<{
    id: string;
    applicantId: string;
    status: string;
  }>;
};

export function TuitionsView({
  tuitions,
  currentUserId,
  basePath,
}: {
  tuitions: TuitionItem[];
  currentUserId: string;
  basePath: string; // e.g. "/student", "/teacher", "/alumni"
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "mine" | "applied">("all");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filtered tuition list
  const filtered = useMemo(() => {
    return tuitions.filter((t) => {
      // Tab filter
      if (tab === "mine" && t.postedById !== currentUserId) return false;
      if (
        tab === "applied" &&
        !t.applications.some((a) => a.applicantId === currentUserId)
      ) {
        return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSubjects = t.subjects.toLowerCase().includes(q);
        const matchLocation = t.location.toLowerCase().includes(q);
        const matchReq = (t.requirements || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSubjects && !matchLocation && !matchReq) {
          return false;
        }
      }

      // Class / Grade filter
      if (selectedClass !== "ALL" && t.classGrade !== selectedClass) {
        return false;
      }

      // Tutoring Type filter
      if (selectedType !== "ALL" && t.tutoringType !== selectedType) {
        return false;
      }

      // Curriculum filter
      if (selectedCurriculum !== "ALL" && t.curriculum !== selectedCurriculum) {
        return false;
      }

      return true;
    });
  }, [tuitions, tab, search, selectedClass, selectedType, selectedCurriculum, currentUserId]);

  const myTuitionCount = useMemo(
    () => tuitions.filter((t) => t.postedById === currentUserId).length,
    [tuitions, currentUserId]
  );

  const appliedCount = useMemo(
    () =>
      tuitions.filter((t) =>
        t.applications.some((a) => a.applicantId === currentUserId)
      ).length,
    [tuitions, currentUserId]
  );

  // Distinct classes and types for filter dropdowns
  const availableClasses = useMemo(() => {
    const set = new Set(tuitions.map((t) => t.classGrade));
    return Array.from(set);
  }, [tuitions]);

  const availableCurriculums = useMemo(() => {
    const set = new Set(tuitions.map((t) => t.curriculum));
    return Array.from(set);
  }, [tuitions]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 md:p-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-mist/70 bg-gradient-to-br from-surface via-surface to-sky/20 p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1 text-xs font-semibold text-ulab-deep">
              <Sparkles size={14} />
              <span>ULAB Tuition Network</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl font-display">
              Tuition Portal
            </h1>
            <p className="text-sm text-ink-soft sm:text-base leading-relaxed">
              Find reliable student tutors or post private tuition requirements (home & online)
              for your family, relatives, or students across the ULAB community.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 shadow-lift py-3 px-5 text-sm"
            >
              <PlusCircle size={18} />
              <span>Post Tuition Requirement</span>
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-mist/60 pt-5">
          <button
            onClick={() => setTab("all")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "all"
                ? "bg-ulab text-white shadow-soft"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            All Tuitions ({tuitions.length})
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "mine"
                ? "bg-ulab text-white shadow-soft"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            My Postings ({myTuitionCount})
          </button>
          <button
            onClick={() => setTab("applied")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "applied"
                ? "bg-ulab text-white shadow-soft"
                : "bg-surface text-ink-soft hover:bg-mist/50 hover:text-ink"
            }`}
          >
            My Applications ({appliedCount})
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid gap-3 rounded-2xl border border-mist/70 bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="text"
            placeholder="Search subjects, location, class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-mist bg-surface pl-9 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ulab-light focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-mist bg-surface px-3 py-2.5 text-sm text-ink focus:border-ulab-light focus:outline-hidden"
          >
            <option value="ALL">All Classes / Grades</option>
            {availableClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-xl border border-mist bg-surface px-3 py-2.5 text-sm text-ink focus:border-ulab-light focus:outline-hidden"
          >
            <option value="ALL">All Tutoring Types</option>
            <option value="Home Tutoring">Home Tutoring</option>
            <option value="Online Tutoring">Online Tutoring</option>
            <option value="Tutor's Place">Tutor&apos;s Place</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
            className="w-full rounded-xl border border-mist bg-surface px-3 py-2.5 text-sm text-ink focus:border-ulab-light focus:outline-hidden"
          >
            <option value="ALL">All Curriculums</option>
            {availableCurriculums.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tuition Listings Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No tuition postings found"
          body={
            search || selectedClass !== "ALL" || selectedType !== "ALL" || tab !== "all"
              ? "Try adjusting your search criteria or clearing filters to see more results."
              : "Be the first in the ULAB community to post a tuition requirement!"
          }
          action={
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <PlusCircle size={16} />
              <span>Post a Tuition</span>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((item) => {
            const isOwner = item.postedById === currentUserId;
            const myApplication = item.applications.find(
              (a) => a.applicantId === currentUserId
            );

            return (
              <Card
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-mist/80 bg-surface p-5 sm:p-6 transition hover:border-ulab-light hover:shadow-md"
              >
                <div>
                  {/* Top row: Status & Type */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-mist/50">
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={item.status === "OPEN" ? "sage" : "gray"}
                        className="font-semibold"
                      >
                        {item.status}
                      </Badge>
                      <Badge tone="blue">{item.tutoringType}</Badge>
                      <Badge tone="lilac">{item.curriculum}</Badge>
                    </div>

                    <div className="text-sm font-bold text-gold-ink font-display">
                      {item.salary}
                    </div>
                  </div>

                  {/* Title */}
                  <Link
                    href={`${basePath}/tuitions/${item.id}`}
                    className="mt-3 block text-lg font-bold text-ink transition hover:text-ulab-deep font-display"
                  >
                    {item.title}
                  </Link>

                  {/* Key Highlights */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink-soft">
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen size={14} className="shrink-0 text-ulab" />
                      <span className="truncate font-medium text-ink">
                        {item.classGrade}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={14} className="shrink-0 text-rose" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar size={14} className="shrink-0 text-gold" />
                      <span>{item.daysPerWeek}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck size={14} className="shrink-0 text-sage" />
                      <span>{item.preferredTutorGender || "Any Tutor"}</span>
                    </div>
                  </div>

                  {/* Subjects badge line */}
                  <div className="mt-3.5 flex items-start gap-1.5 rounded-xl bg-sky/40 p-2.5 text-xs">
                    <span className="font-semibold text-ulab-deep shrink-0">Subjects:</span>
                    <span className="text-ink font-medium line-clamp-1">{item.subjects}</span>
                  </div>

                  {/* Requirements snippet */}
                  {item.requirements && (
                    <p className="mt-3 line-clamp-2 text-xs text-ink-soft leading-relaxed">
                      {item.requirements}
                    </p>
                  )}
                </div>

                {/* Bottom Footer: Poster info + Action */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-mist/50 pt-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={item.postedBy.name}
                      src={item.postedBy.image}
                      size={32}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">
                        {item.postedBy.name}
                      </p>
                      <p className="truncate text-[11px] text-ink-soft">
                        {item.postedBy.role === "TEACHER"
                          ? "Faculty"
                          : item.postedBy.role === "ALUMNI"
                          ? "Alumni"
                          : "Student"} • {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {myApplication ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sage-wash px-2.5 py-1 text-xs font-semibold text-sage">
                        <CheckCircle2 size={13} />
                        <span>{myApplication.status}</span>
                      </span>
                    ) : null}

                    {isOwner ? (
                      <Link
                        href={`${basePath}/tuitions/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gold-wash px-3 py-1.5 text-xs font-semibold text-gold-ink hover:bg-gold/25 transition"
                      >
                        <Users size={14} />
                        <span>Applicants ({item.applications.length})</span>
                      </Link>
                    ) : (
                      <Link
                        href={`${basePath}/tuitions/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-ulab px-3 py-1.5 text-xs font-semibold text-white hover:bg-ulab-deep transition shadow-xs"
                      >
                        <span>Details</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Tuition Modal */}
      <CreateTuitionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          // Re-render handled by server action revalidatePath
        }}
      />
    </div>
  );
}
