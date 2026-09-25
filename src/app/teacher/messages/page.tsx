import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { MessagesView } from "@/components/messages-view";

export const metadata: Metadata = { title: "Messages" };

export default async function Messages({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const user = await requireUser("TEACHER");
  return <MessagesView user={user} basePath="/teacher/messages" selected={c} />;
}
