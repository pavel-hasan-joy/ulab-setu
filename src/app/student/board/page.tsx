import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { BoardView } from "@/components/board-view";

export const metadata: Metadata = { title: "Notice board" };

export default async function Board({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const user = await requireUser("STUDENT");
  return <BoardView viewer={user} basePath="/student/board" params={await searchParams} />;
}
