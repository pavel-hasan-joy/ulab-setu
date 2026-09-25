import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Info, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getBangladeshJobs, getRemoteJobs } from "@/lib/external-jobs";
import { jobCategories, jobTypes } from "@/lib/site";
import { AlumniJobCard, ExternalJobCard, JobGridSkeleton } from "@/components/job-cards";
import { JobPortals } from "@/components/job-portals";
import { PageIn, Stagger, StaggerItem } from "@/components/motion";
import { Tabs } from "@/components/tabs";
import { Button, EmptyState, Input, PageHeader, Select } from "@/components/ui";

export const metadata: Metadata = { title: "Jobs" };

type Params = { tab?: string; q?: string; category?: string; type?: string };

export default async function JobsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const tab = params.tab === "bd" || params.tab === "remote" ? params.tab : "alumni";
  const q = params.q?.trim() ?? "";
  const link = (t: string) => `/student/jobs?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <PageIn>
      <PageHeader title="Jobs" description="Openings from ULAB alumni first, then live listings from across Bangladesh and remote teams." />
      <Tabs
        active={tab}
        tabs={[
          { id: "alumni", label: "Alumni jobs", href: link("alumni") },
          { id: "bd", label: "Bangladesh", href: link("bd") },
          { id: "remote", label: "Remote", href: link("remote") },
        ]}
      />

      <form className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input name="q" defaultValue={q} placeholder="Search by title, company or skill" className="pl-10" />
        </div>
        {tab === "alumni" && (
          <>
            <Select name="category" options={jobCategories} placeholder="All categories" defaultValue={params.category ?? ""} className="sm:w-52" />
            <Select name="type" options={jobTypes} placeholder="Any type" defaultValue={params.type ?? ""} className="sm:w-40" />
          </>
        )}
        <Button variant="soft">Search</Button>
      </form>

      <div className="mt-6">
        <Suspense key={`${tab}-${q}-${params.category}-${params.type}`} fallback={<JobGridSkeleton />}>
          {tab === "alumni" && <AlumniJobs q={q} category={params.category} type={params.type} />}
          {tab === "bd" && <BangladeshJobs q={q} />}
          {tab === "remote" && <RemoteJobs q={q} />}
        </Suspense>
      </div>

      <div className="mt-14">
        <JobPortals />
      </div>
    </PageIn>
  );
}

async function AlumniJobs({ q, category, type }: { q: string; category?: string; type?: string }) {
  const jobs = await db.job.findMany({
    where: {
      active: true,
      ...(category && { category }),
      ...(type && { type }),
      ...(q && { OR: [{ title: { contains: q } }, { company: { contains: q } }, { description: { contains: q } }] }),
    },
    include: { postedBy: true },
    orderBy: [{ referral: "desc" }, { createdAt: "desc" }],
  });
  if (!jobs.length) {
    return <EmptyState title="No alumni jobs match that" body="Try a broader search, or check the Bangladesh tab for more openings." />;
  }
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <StaggerItem key={job.id}><AlumniJobCard job={job} href={`/student/jobs/${job.id}`} /></StaggerItem>
      ))}
    </Stagger>
  );
}

async function BangladeshJobs({ q }: { q: string }) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "127.0.0.1";
  const { jobs, sample, error } = await getBangladeshJobs({ keywords: q }, { ip, userAgent: h.get("user-agent") ?? "" });

  return (
    <>
      {sample && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-lilac-wash px-4 py-3 text-sm text-lilac-ink">
          <Info size={16} className="mt-0.5 shrink-0" />
          These are sample listings. Live jobs from Bdjobs and other Bangladeshi sites appear once the Careerjet API key is added.
        </p>
      )}
      {error ? (
        <EmptyState title="Couldn't load Bangladesh jobs right now" body="The job search service didn't respond. Try again in a minute." />
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" body="Try another keyword, like 'marketing' or 'engineer'." />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => <StaggerItem key={job.id}><ExternalJobCard job={job} /></StaggerItem>)}
        </Stagger>
      )}
      {!sample && !error && <p className="mt-6 text-center text-xs text-ink-soft">Jobs by <a href="https://www.careerjet.com.bd" className="underline" target="_blank" rel="noreferrer">Careerjet</a></p>}
    </>
  );
}

async function RemoteJobs({ q }: { q: string }) {
  const { jobs, error } = await getRemoteJobs(q);
  return (
    <>
      {error ? (
        <EmptyState title="Couldn't load remote jobs right now" body="Himalayas didn't respond. Try again in a minute." />
      ) : jobs.length === 0 ? (
        <EmptyState title="No remote jobs found" body="Try a shorter keyword, like 'design' or 'data'." />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => <StaggerItem key={job.id}><ExternalJobCard job={job} /></StaggerItem>)}
        </Stagger>
      )}
      <p className="mt-6 text-center text-xs text-ink-soft">
        Remote jobs open to applicants in Bangladesh, from <a href="https://himalayas.app" className="underline" target="_blank" rel="noreferrer">Himalayas</a>
      </p>
    </>
  );
}
