import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PeopleDirectory } from "@/components/people-directory";

export const metadata: Metadata = { title: "People" };

export default async function People({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; department?: string }> }) {
  const user = await requireUser("STUDENT");
  return <PeopleDirectory viewer={user} basePath="/student/people" messagesHref="/student/messages" params={await searchParams} />;
}
