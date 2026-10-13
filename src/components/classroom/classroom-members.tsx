"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, GraduationCap, KeyRound, LogOut, ShieldCheck, UserMinus, Users } from "lucide-react";
import { leaveClassroom, removeMemberFromClassroom } from "@/app/actions/classroom";
import { Avatar, Badge, Button, Card, cn } from "../ui";

export interface ClassroomMemberData {
  id: string;
  role: string;
  joinedAt: string | Date;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    studentId: string | null;
    batch: string | null;
    department: string | null;
    designation: string | null;
  };
}

export function ClassroomMembers({
  classroomId,
  classCode,
  members,
  currentUserId,
  isOwner,
  basePath,
}: {
  classroomId: string;
  classCode: string;
  members: ClassroomMemberData[];
  currentUserId: string;
  isOwner: boolean;
  basePath: "/teacher/classroom" | "/student/classroom";
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = (targetUserId: string, targetName: string) => {
    if (!confirm(`Are you sure you want to remove ${targetName} from this classroom?`)) return;
    startTransition(async () => {
      await removeMemberFromClassroom(classroomId, targetUserId);
      router.refresh();
    });
  };

  const handleLeave = () => {
    if (!confirm("Are you sure you want to leave this classroom?")) return;
    startTransition(async () => {
      await leaveClassroom(classroomId);
      router.push(basePath);
      router.refresh();
    });
  };

  const teachers = members.filter((m) => m.role === "TEACHER" || m.user.role === "TEACHER");
  const students = members.filter((m) => m.role !== "TEACHER" && m.user.role !== "TEACHER");

  return (
    <div className="space-y-6">
      {/* Class Code Banner */}
      <div className="rounded-3xl border border-mist bg-gradient-to-r from-sky via-paper to-sky/50 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-ulab text-white shadow-soft">
              <KeyRound size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ulab-deep">Classroom Invite Code</p>
              <p className="text-xs text-ink-soft">Share this code with students so they can join easily</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl border border-ulab/30 bg-surface px-4 py-2 font-mono text-lg font-black tracking-widest text-ink shadow-xs">
              {classCode}
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={handleCopyCode}
              className="px-3.5 py-2 text-xs"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-300" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Teachers / Instructors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-mist/50">
          <ShieldCheck size={18} className="text-ulab" />
          <h3 className="font-display text-base font-bold text-ink">
            Instructors & Teachers ({teachers.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teachers.map((m) => (
            <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={m.user.name} size={40} src={m.user.image} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-ink">{m.user.name}</p>
                    {m.user.id === currentUserId && (
                      <span className="text-[10px] text-ink-soft">(You)</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-soft">
                    {m.user.designation || "Faculty"} • {m.user.department}
                  </p>
                </div>
              </div>

              <Badge tone="lilac" className="text-[10px] py-0.5">Faculty</Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-mist/50">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-sage" />
            <h3 className="font-display text-base font-bold text-ink">
              Enrolled Students ({students.length})
            </h3>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mist p-8 text-center text-xs text-ink-soft bg-surface">
            No students have joined this classroom yet. Share the class code <strong className="font-mono text-ink">{classCode}</strong> with your students.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {students.map((m) => (
              <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.user.name} size={40} src={m.user.image} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-ink">{m.user.name}</p>
                      {m.user.id === currentUserId && (
                        <span className="text-[10px] text-ink-soft">(You)</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ink-soft">
                      {m.user.studentId ? `ID: ${m.user.studentId}` : "Student"} • {m.user.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="blue" className="text-[10px] py-0.5">Student</Badge>
                  {isOwner && m.user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                      disabled={isPending}
                      title="Remove from class"
                      className="rounded-lg p-1.5 text-ink-soft hover:bg-rose-wash hover:text-rose transition"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Leave Class Option for Students */}
      {!isOwner && (
        <div className="pt-6 border-t border-mist/50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleLeave}
            disabled={isPending}
            className="text-xs text-rose hover:bg-rose-wash"
          >
            <LogOut size={13} /> Leave Classroom
          </Button>
        </div>
      )}
    </div>
  );
}
