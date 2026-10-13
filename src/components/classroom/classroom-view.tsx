"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  GraduationCap,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Trash2,
  Users,
} from "lucide-react";
import { deleteClassroom } from "@/app/actions/classroom";
import { Badge, Button, cn } from "../ui";
import { ClassroomChat, type ChatMessage } from "./classroom-chat";
import { ClassroomNotices, type ClassroomNoticeData } from "./classroom-notices";
import { ClassroomMembers, type ClassroomMemberData } from "./classroom-members";

export function ClassroomView({
  classroom,
  currentUserId,
  currentUserRole,
  isOwner,
  basePath,
  initialMessages,
  notices,
  members,
}: {
  classroom: {
    id: string;
    name: string;
    section: string | null;
    subject: string | null;
    description: string | null;
    code: string;
    createdById: string;
    createdBy: {
      id: string;
      name: string;
      image: string | null;
      designation: string | null;
    };
  };
  currentUserId: string;
  currentUserRole: string;
  isOwner: boolean;
  basePath: "/teacher/classroom" | "/student/classroom";
  initialMessages: ChatMessage[];
  notices: ClassroomNoticeData[];
  members: ClassroomMemberData[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "notices" | "members">("chat");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to permanently delete this classroom? All messages and notices will be removed.")) return;
    startTransition(async () => {
      await deleteClassroom(classroom.id);
      router.push(basePath);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition"
        >
          <ArrowLeft size={14} /> Back to all classrooms
        </Link>

        {isOwner && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs py-1.5 px-3 text-rose hover:bg-rose-wash"
          >
            <Trash2 size={13} /> Delete Class
          </Button>
        )}
      </div>

      {/* Classroom Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ulab via-ulab-deep to-slate-900 p-6 sm:p-8 text-white shadow-lift">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
                <GraduationCap size={16} />
              </span>
              {classroom.subject && (
                <span className="rounded-lg bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
                  {classroom.subject}
                </span>
              )}
              {classroom.section && (
                <span className="rounded-lg bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
                  {classroom.section}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              {classroom.name}
            </h1>

            {classroom.description && (
              <p className="max-w-2xl text-xs sm:text-sm text-white/80 leading-relaxed">
                {classroom.description}
              </p>
            )}

            <p className="text-xs text-white/70 pt-1">
              Instructor: <strong className="text-white">{classroom.createdBy.name}</strong>{" "}
              {classroom.createdBy.designation ? `(${classroom.createdBy.designation})` : ""}
            </p>
          </div>

          {/* Quick Copy Code Pill */}
          <div className="shrink-0 self-start">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Click to copy Class Code"
              className="flex items-center gap-2 rounded-2xl bg-white/20 p-2 sm:px-3 sm:py-2 text-xs font-mono font-bold tracking-wider backdrop-blur-md transition hover:bg-white/30 active:scale-95 text-white shadow-xs"
            >
              <span className="text-[11px] font-sans font-normal opacity-80">Class Code:</span>
              <span className="text-sm font-bold">{classroom.code}</span>
              {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mist/80 gap-2">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition -mb-px",
            tab === "chat"
              ? "border-ulab text-ulab"
              : "border-transparent text-ink-soft hover:text-ink"
          )}
        >
          <MessageSquare size={16} />
          <span>Group Chat</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft font-mono">
            {initialMessages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("notices")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition -mb-px",
            tab === "notices"
              ? "border-ulab text-ulab"
              : "border-transparent text-ink-soft hover:text-ink"
          )}
        >
          <Megaphone size={16} />
          <span>Notices & Announcements</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft font-mono">
            {notices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("members")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition -mb-px",
            tab === "members"
              ? "border-ulab text-ulab"
              : "border-transparent text-ink-soft hover:text-ink"
          )}
        >
          <Users size={16} />
          <span>Members</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-soft font-mono">
            {members.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {tab === "chat" && (
          <ClassroomChat
            classroomId={classroom.id}
            currentUserId={currentUserId}
            initialMessages={initialMessages}
          />
        )}

        {tab === "notices" && (
          <ClassroomNotices
            classroomId={classroom.id}
            notices={notices}
            canPost={currentUserRole === "TEACHER" || isOwner}
            currentUserId={currentUserId}
          />
        )}

        {tab === "members" && (
          <ClassroomMembers
            classroomId={classroom.id}
            classCode={classroom.code}
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            basePath={basePath}
          />
        )}
      </div>
    </div>
  );
}
