import { redirect } from "next/navigation";

export default async function OldAlumniDirectory({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  redirect(`/student/people?tab=alumni${q ? `&q=${encodeURIComponent(q)}` : ""}`);
}
