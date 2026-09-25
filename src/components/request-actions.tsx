"use client";

import { useTransition } from "react";
import { respondConnection } from "@/app/actions/network";
import { Button } from "./ui";

export function RequestActions({ connectionId }: { connectionId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button className="py-2" disabled={pending} onClick={() => start(() => respondConnection(connectionId, true))}>Accept</Button>
      <Button variant="ghost" className="py-2" disabled={pending} onClick={() => start(() => respondConnection(connectionId, false))}>Decline</Button>
    </div>
  );
}
