import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const draft = await draftMode();
  draft.disable();

  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/";

  // Prevent open redirect
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}

