"use client";

import { useMemo, useState } from "react";
import { GraduationCap, KeyRound, Plus, Search } from "lucide-react";
import { Button, Input, PageHeader } from "../ui";
import { ClassroomCard, type ClassroomCardData } from "./classroom-card";
import { CreateClassroomModal } from "./create-classroom-modal";
import { JoinClassroomModal } from "./join-classroom-modal";

export function ClassroomListClient({
  classrooms,
  userRole,
  basePath,
}: {
  classrooms: ClassroomCardData[];
  userRole: "TEACHER" | "STUDENT" | "ADMIN";
  basePath: "/teacher/classroom" | "/student/classroom";
}) {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return classrooms;
    const q = query.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.section && c.section.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        c.createdBy.name.toLowerCase().includes(q)
    );
  }, [classrooms, query]);

  const isTeacher = userRole === "TEACHER" || userRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">Classrooms</h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-soft">
            {isTeacher
              ? "Manage your course groups, post announcements, and chat with students in real time."
              : "Access your enrolled courses, discuss in group chats, and view teacher notices."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsJoinOpen(true)}
            className="text-xs py-2 px-3.5"
          >
            <KeyRound size={14} /> Join with Code
          </Button>

          {isTeacher && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs py-2 px-3.5"
            >
              <Plus size={14} /> Create Classroom
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {classrooms.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course name, code, or teacher..."
            className="pl-10 text-xs sm:text-sm"
          />
        </div>
      )}

      {/* Classrooms Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-3xl border border-dashed border-mist bg-surface shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sky text-ulab mb-4 shadow-soft">
            <GraduationCap size={28} />
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-ink">
            {query.trim()
              ? "No matching classrooms found"
              : isTeacher
              ? "You haven't created any classrooms yet"
              : "You haven't joined any classrooms yet"}
          </h3>
          <p className="text-xs sm:text-sm text-ink-soft max-w-md mt-1.5 leading-relaxed">
            {query.trim()
              ? `No classrooms matching "${query}". Try searching by course title or class code.`
              : isTeacher
              ? "Create your first classroom to easily share course notices, assignments, and start group discussions with your students."
              : "Ask your course teacher for the 6-character class code, then click 'Join with Code' to enter."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJoinOpen(true)}
              className="text-xs py-2"
            >
              <KeyRound size={14} /> Join with Code
            </Button>
            {isTeacher && (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs py-2"
              >
                <Plus size={14} /> Create Classroom
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ClassroomCard key={c.id} classroom={c} basePath={basePath} />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateClassroomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        basePath={basePath}
      />

      <JoinClassroomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        basePath={basePath}
      />
    </div>
  );
}
