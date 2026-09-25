"use client";

import { useTransition } from "react";
import { setApplicationStatus } from "@/app/actions/jobs";
import { Button } from "@/components/ui";

export function ApplicantActions({ applicationId, status }: { applicationId: string; status: string }) {
  const [pending, start] = useTransition();
  const set = (s: "SHORTLISTED" | "REJECTED" | "APPLIED") => start(() => setApplicationStatus(applicationId, s));
  if (status !== "APPLIED") {
    return <Button variant="ghost" className="py-2" disabled={pending} onClick={() => set("APPLIED")}>Undo</Button>;
  }
  return (
    <div className="flex gap-2">
      <Button className="bg-sage py-2 hover:bg-[#357a5b]" disabled={pending} onClick={() => set("SHORTLISTED")}>Shortlist</Button>
      <Button variant="ghost" className="py-2" disabled={pending} onClick={() => set("REJECTED")}>Not a fit</Button>
    </div>
  );
}
