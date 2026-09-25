import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PeopleDirectory } from "@/components/people-directory";

export const metadata: Metadata = { title: "People" };

export default async function People({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; department?: string }> }) {
  const user = await requireUser("ALUMNI");
  return <PeopleDirectory viewer={user} basePath="/alumni/people" messagesHref="/alumni/messages" params={await searchParams} />;
}
