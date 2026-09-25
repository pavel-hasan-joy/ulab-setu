"use client";

import { useTransition } from "react";
import { setAlumniStatus } from "@/app/actions/profile";
import { Button } from "@/components/ui";

export function ApprovalButtons({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button className="py-2" disabled={pending} onClick={() => start(() => setAlumniStatus(userId, "APPROVED"))}>Approve</Button>
      <Button variant="ghost" className="py-2" disabled={pending} onClick={() => start(() => setAlumniStatus(userId, "REJECTED"))}>Reject</Button>
    </div>
  );
}
