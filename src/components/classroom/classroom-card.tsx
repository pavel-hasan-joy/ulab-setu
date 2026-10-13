"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, GraduationCap, Megaphone, MessageSquare, Users } from "lucide-react";
import { Avatar, Badge, Card, cn } from "../ui";

export interface ClassroomCardData {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
  description: string | null;
  code: string;
  createdAt: string | Date;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
    designation: string | null;
  };
  _count: {
    members: number;
    messages: number;
    notices: number;
  };
}

const bannerGradients = [
  "from-blue-600 to-indigo-700",
  "from-teal-600 to-emerald-700",
  "from-violet-600 to-purple-800",
  "from-amber-600 to-rose-700",
  "from-cyan-600 to-blue-800",
  "from-emerald-600 to-teal-800",
];

export function ClassroomCard({
  classroom,
  basePath,
}: {
  classroom: ClassroomCardData;
  basePath: "/teacher/classroom" | "/student/classroom";
}) {
  const [copied, setCopied] = useState(false);

  const hash = classroom.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = bannerGradients[hash % bannerGradients.length];

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-3xl border border-mist transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {/* Banner */}
      <div className={cn("relative h-28 bg-gradient-to-br p-4 text-white flex flex-col justify-between", gradient)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <GraduationCap size={16} />
            </span>
            {classroom.subject && (
              <span className="rounded-lg bg-black/25 px-2 py-0.5 text-[11px] font-medium backdrop-blur-xs">
                {classroom.subject}
              </span>
            )}
          </div>

          {/* Class Code Chip */}
          <button
            type="button"
            onClick={handleCopyCode}
            title="Click to copy Class Code"
            className="flex items-center gap-1.5 rounded-xl bg-white/20 px-2.5 py-1 text-xs font-mono font-bold tracking-wider backdrop-blur-xs transition hover:bg-white/30 active:scale-95 text-white"
          >
            <span>{classroom.code}</span>
            {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
          </button>
        </div>

        <div>
          <h3 className="line-clamp-1 font-display text-lg font-bold text-white drop-shadow-xs">
            {classroom.name}
          </h3>
          {classroom.section && (
            <p className="text-xs font-medium text-white/85 line-clamp-1">
              {classroom.section}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {classroom.description ? (
          <p className="line-clamp-2 text-xs text-ink-soft mb-4 leading-relaxed">
            {classroom.description}
          </p>
        ) : (
          <p className="text-xs text-ink-soft/60 italic mb-4">No description provided</p>
        )}

        {/* Teacher / Instructor Info */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-mist/50">
          <Avatar name={classroom.createdBy.name} size={32} src={classroom.createdBy.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{classroom.createdBy.name}</p>
            <p className="truncate text-[11px] text-ink-soft">
              {classroom.createdBy.designation || "Course Teacher"}
            </p>
          </div>
        </div>

        {/* Stats & Enter Link */}
        <div className="mt-4 flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="flex items-center gap-1" title="Members">
              <Users size={14} className="text-ulab" />
              {classroom._count.members}
            </span>
            <span className="flex items-center gap-1" title="Notices">
              <Megaphone size={14} className="text-gold-ink" />
              {classroom._count.notices}
            </span>
            <span className="flex items-center gap-1" title="Messages">
              <MessageSquare size={14} className="text-sage" />
              {classroom._count.messages}
            </span>
          </div>

          <Link
            href={`${basePath}/${classroom.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-sky px-3 py-1.5 text-xs font-semibold text-ulab-deep transition hover:bg-ulab hover:text-white"
          >
            Enter Class &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
}
