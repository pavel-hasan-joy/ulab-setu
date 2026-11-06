"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  GraduationCap,
  Briefcase,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Video,
  Clock,
  RotateCcw,
  Users,
} from "lucide-react";
import { Avatar, Badge, Button, Card } from "./ui";
import { MENTORSHIP_TOPICS } from "@/lib/mentorship-constants";

export interface DiscoverMentorItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  alumniVerified: boolean;
  company: string;
  position: string;
  department: string;
  careerField: string;
  yearsOfExperience: number | null;
  bio: string;
  expertise: string;
  skills: string;
  topics: string[];
  preferredSessionType: string;
  availableDays: string[];
  communicationMethod: string;
  maxMentees: number;
  activeMenteesCount: number;
  status: "AVAILABLE" | "TEMPORARILY_UNAVAILABLE" | "FULLY_BOOKED";
  academicExpertise?: string;
  researchInterests?: string;
  teachingAreas?: string;
  academicGuidanceTopics?: string;
}

interface StudentFindMentorViewProps {
  initialMentors: DiscoverMentorItem[];
  departments: string[];
}

export function StudentFindMentorView({
  initialMentors,
  departments,
}: StudentFindMentorViewProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ALUMNI" | "TEACHER">("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");
  const [expFilter, setExpFilter] = useState<"ALL" | "ENTRY" | "MID" | "SENIOR">("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"RELEVANT" | "RECENT" | "EXPERIENCE" | "NAME">("RELEVANT");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Filter in memory for immediate interactive responsive feel
  const filtered = initialMentors.filter((m) => {
    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchCompany = (m.company || "").toLowerCase().includes(q);
      const matchPos = (m.position || "").toLowerCase().includes(q);
      const matchDept = (m.department || "").toLowerCase().includes(q);
      const matchField = (m.careerField || "").toLowerCase().includes(q);
      const matchSkills = (m.skills || "").toLowerCase().includes(q);
      const matchExp = (m.expertise || "").toLowerCase().includes(q);
      const matchBio = (m.bio || "").toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchPos && !matchDept && !matchField && !matchSkills && !matchExp && !matchBio) {
        return false;
      }
    }

    // 2. Role Filter
    if (roleFilter !== "ALL" && m.role !== roleFilter) {
      return false;
    }

    // 3. Department Filter
    if (deptFilter !== "ALL" && m.department !== deptFilter) {
      return false;
    }

    // 4. Topic Filter
    if (topicFilter !== "ALL" && !m.topics.includes(topicFilter)) {
      return false;
    }

    // 5. Session Format Filter
    if (sessionFilter !== "ALL" && m.preferredSessionType !== sessionFilter) {
      return false;
    }

    // 6. Experience Level
    if (expFilter !== "ALL") {
      const yrs = m.yearsOfExperience ?? 0;
      if (expFilter === "ENTRY" && (yrs < 1 || yrs > 3)) return false;
      if (expFilter === "MID" && (yrs < 3 || yrs > 5)) return false;
      if (expFilter === "SENIOR" && yrs < 5) return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "NAME") return a.name.localeCompare(b.name);
    if (sortBy === "EXPERIENCE") return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
    return 0; // default order
  });

  // Pagination
  const totalCount = sorted.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setDeptFilter("ALL");
    setTopicFilter("ALL");
    setExpFilter("ALL");
    setSessionFilter("ALL");
    setSortBy("RELEVANT");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search ||
    roleFilter !== "ALL" ||
    deptFilter !== "ALL" ||
    topicFilter !== "ALL" ||
    expFilter !== "ALL" ||
    sessionFilter !== "ALL" ||
    sortBy !== "RELEVANT";

  return (
    <div className="space-y-6">
      {/* Search and Filter Panel */}
      <Card className="p-5">
        <div className="flex flex-col gap-4">
          {/* Top Bar: Search Input & Role Segment */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
              />
              <input
                type="text"
                placeholder="Search mentor by name, company, position, skills, or field..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-mist/80 bg-paper/60 pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-soft focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              />
            </div>

            {/* Role Switcher Pill */}
            <div className="inline-flex rounded-xl border border-mist/80 bg-paper/60 p-1 self-start sm:self-auto dark:border-white/10 dark:bg-white/5">
              {[
                { id: "ALL", label: "All Mentors" },
                { id: "ALUMNI", label: "Alumni" },
                { id: "TEACHER", label: "Faculty" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(r.id as any);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    roleFilter === r.id
                      ? "bg-surface text-ink shadow-soft"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filter Row: Department, Topics, Experience, Session Format, Sort */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 border-t border-mist/60 pt-3 dark:border-white/5">
            {/* Department */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mentorship Topic */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Topic
              </label>
              <select
                value={topicFilter}
                onChange={(e) => {
                  setTopicFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="ALL">All Topics</option>
                {MENTORSHIP_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Experience
              </label>
              <select
                value={expFilter}
                onChange={(e) => {
                  setExpFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="ALL">Any Experience</option>
                <option value="ENTRY">1 - 3 Years</option>
                <option value="MID">3 - 5 Years</option>
                <option value="SENIOR">5+ Years</option>
              </select>
            </div>

            {/* Session Format */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Session Type
              </label>
              <select
                value={sessionFilter}
                onChange={(e) => {
                  setSessionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="ALL">Any Session Type</option>
                <option value="ONLINE">Online Virtual</option>
                <option value="IN_PERSON">In-Person (ULAB)</option>
                <option value="HYBRID">Hybrid Flexible</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-mist/80 bg-paper/60 px-2.5 py-1.5 text-xs text-ink focus:border-ulab focus:outline-none dark:border-white/10 dark:bg-white/5 font-semibold"
              >
                <option value="RELEVANT">Most Relevant</option>
                <option value="EXPERIENCE">Years of Experience</option>
                <option value="NAME">Alphabetical (A-Z)</option>
                <option value="RECENT">Recently Active</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Reset Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mist/60 pt-2 text-xs text-ink-soft dark:border-white/5">
              <span>Showing {totalCount} matching available mentors</span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Mentor Cards Grid */}
      {paginated.length === 0 ? (
        <Card className="p-12 text-center">
          <Compass size={40} className="mx-auto text-ink-soft/40" />
          <h3 className="mt-3 font-display text-base font-bold text-ink">
            No mentors match your search criteria
          </h3>
          <p className="mt-1 text-xs text-ink-soft max-w-sm mx-auto">
            Try adjusting your department, career field, or mentorship topic filters to discover available mentors.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              onClick={handleResetFilters}
              className="bg-ulab py-1.5 px-4 text-xs text-white hover:bg-ulab-deep"
            >
              Show All Available Mentors
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((m) => (
            <Card
              key={m.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl p-5 hover:border-ulab/60 transition shadow-soft hover:shadow-md"
            >
              <div>
                {/* Header: Avatar, Name, Role Badge */}
                <div className="flex items-start gap-3.5">
                  <Avatar name={m.name} src={m.image} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/student/mentors/${m.id}`}
                        className="truncate text-sm font-bold text-ink hover:text-ulab transition"
                      >
                        {m.name}
                      </Link>
                      {m.role === "ALUMNI" && m.alumniVerified && (
                        <span title="Verified ULAB Alumni" className="inline-flex shrink-0">
                          <ShieldCheck
                            size={14}
                            className="text-emerald-600"
                          />
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-medium text-ink-soft">
                      {m.position}
                    </p>
                    <p className="truncate text-[11px] text-ink-soft/80">
                      {m.company}
                    </p>
                  </div>
                </div>

                {/* Role & Availability Badges */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={m.role === "TEACHER" ? "lilac" : "gold"}>
                    {m.role === "TEACHER" ? "Faculty Mentor" : "Verified Alumni"}
                  </Badge>
                  <Badge tone="sage">● Available</Badge>
                  {m.yearsOfExperience !== null && m.yearsOfExperience > 0 && (
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink-soft border border-mist/60 dark:border-white/5 dark:bg-white/5">
                      {m.yearsOfExperience}+ Yrs Exp
                    </span>
                  )}
                </div>

                {/* Introduction statement snippet */}
                {m.bio && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                    &quot;{m.bio}&quot;
                  </p>
                )}

                {/* Topics Pills */}
                {m.topics.length > 0 && (
                  <div className="mt-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                      Mentorship Topics:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          {topic}
                        </span>
                      ))}
                      {m.topics.length > 3 && (
                        <span className="rounded-lg bg-paper px-1.5 py-0.5 text-[10px] text-ink-soft">
                          +{m.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expertise & Session Format */}
                <div className="mt-3 space-y-1 text-[11px] text-ink-soft">
                  {m.expertise && (
                    <p className="line-clamp-1">
                      <strong className="text-ink">Expertise:</strong> {m.expertise}
                    </p>
                  )}
                  <p>
                    <strong className="text-ink">Format:</strong> {m.preferredSessionType} · {m.communicationMethod}
                  </p>
                </div>
              </div>

              {/* Action Buttons: View Profile & Request Mentorship */}
              <div className="mt-5 flex items-center gap-2 border-t border-mist/70 pt-3.5 dark:border-white/5">
                <Link
                  href={`/student/mentors/${m.id}`}
                  className="flex-1 rounded-xl border border-mist/80 bg-paper/60 py-2 text-center text-xs font-semibold text-ink hover:bg-paper transition"
                >
                  View Profile
                </Link>
                <Link
                  href={`/student/mentors/${m.id}?request=1`}
                  className="flex-1 rounded-xl bg-ulab py-2 text-center text-xs font-semibold text-white hover:bg-ulab-deep transition shadow-soft"
                >
                  Request Mentorship
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-mist/80 pt-4 dark:border-white/10">
          <span className="text-xs text-ink-soft">
            Page {safePage} of {totalPages} ({totalCount} mentors)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="border border-mist/80 bg-paper/60 py-1 px-3 text-xs text-ink hover:bg-paper disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="border border-mist/80 bg-paper/60 py-1 px-3 text-xs text-ink hover:bg-paper disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
