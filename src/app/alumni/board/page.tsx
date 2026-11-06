import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { BoardView } from "@/components/board-view";

export const metadata: Metadata = { title: "Notice board" };

export default async function Board({ searchParams }: { searchParams: Promise<{ kind?: string; noticeId?: string }> }) {
  const user = await requireUser("ALUMNI");
  return <BoardView viewer={user} basePath="/alumni/board" params={await searchParams} />;
}
