import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin, Wallet } from "lucide-react";
import type { Job, User } from "@prisma/client";
import type { ExternalJob } from "@/lib/external-jobs";
import { HoverLift } from "./motion";
import { Avatar, Badge, Card, formatDate, posterLabel, timeAgo } from "./ui";

function isClosingSoon(deadline: Date | null) {
  return !!deadline && deadline.getTime() - Date.now() < 5 * 864e5;
}

export function AlumniJobCard({ job, href }: { job: Job & { postedBy: User }; href: string }) {
  const closingSoon = isClosingSoon(job.deadline);
  return (
    <HoverLift className="h-full">
      <Link href={href} className="group block h-full">
        <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-lift">
          <div className="flex flex-wrap gap-1.5">
            <Badge>{job.type}</Badge>
            {job.referral && <Badge tone="gold">Referral available</Badge>}
            {closingSoon && <Badge tone="rose">Closing soon</Badge>}
          </div>
          <h3 className="mt-3.5 text-[17px] font-semibold leading-snug text-ink group-hover:text-ulab-deep">{job.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{job.company}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location}</span>
            {job.salary && <span className="inline-flex items-center gap-1"><Wallet size={13} />{job.salary}</span>}
            {job.deadline && <span className="inline-flex items-center gap-1"><CalendarClock size={13} />Apply by {formatDate(job.deadline)}</span>}
          </div>
          <div className="mt-auto pt-5">
            <div className="flex items-center gap-2.5 border-t border-mist/70 pt-3.5">
              <Avatar name={job.postedBy.name} size={28} />
              <p className="text-xs text-ink-soft">
                <span className="font-medium text-ink">{job.postedBy.name}</span>, {posterLabel(job.postedBy)}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </HoverLift>
  );
}

export function ExternalJobCard({ job }: { job: ExternalJob }) {
  return (
    <HoverLift className="h-full">
      <a href={job.url} target="_blank" rel="noopener noreferrer nofollow" className="group block h-full">
        <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <Badge tone="lilac">{job.category}</Badge>
            <ArrowUpRight size={18} className="shrink-0 text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ulab" />
          </div>
          <h3 className="mt-3.5 text-[17px] font-semibold leading-snug text-ink group-hover:text-ulab-deep">{job.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{job.company}</p>
          {job.excerpt && <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-soft/90">{job.excerpt}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location}</span>
            {job.salary && <span className="inline-flex items-center gap-1"><Wallet size={13} />{job.salary}</span>}
          </div>
          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between border-t border-mist/70 pt-3.5 text-xs">
              <span className="text-ink-soft">{job.posted ? timeAgo(job.posted) : ""}</span>
              <span className="font-semibold text-ulab">
                {job.source === "Sample" ? "Search on Bdjobs" : `Apply on ${job.source}`}
              </span>
            </div>
          </div>
        </Card>
      </a>
    </HoverLift>
  );
}

export function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-mist/80 bg-surface p-5">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton mt-4 h-5 w-4/5" />
          <div className="skeleton mt-2 h-4 w-1/2" />
          <div className="skeleton mt-6 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
