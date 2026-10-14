import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTuitionById } from "@/lib/tuitions";
import { TuitionDetailView } from "@/components/tuition/tuition-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tuition = await getTuitionById(id);
  if (!tuition) return { title: "Tuition Not Found" };
  return {
    title: `${tuition.title} | Tuition Portal`,
  };
}

export default async function AlumniTuitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("ALUMNI");
  const tuition = await getTuitionById(id);

  if (!tuition) {
    notFound();
  }

  return (
    <TuitionDetailView
      tuition={tuition}
      currentUserId={user.id}
      basePath="/alumni"
    />
  );
}
