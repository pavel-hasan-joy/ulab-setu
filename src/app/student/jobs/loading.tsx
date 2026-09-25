import { JobGridSkeleton } from "@/components/job-cards";

export default function Loading() {
  return (
    <div>
      <div className="skeleton h-10 w-40" />
      <div className="skeleton mt-3 mb-8 h-5 w-96 max-w-full" />
      <JobGridSkeleton />
    </div>
  );
}
