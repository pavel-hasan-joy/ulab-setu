import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const secret = searchParams.get("secret");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  // 1. Authorize preview request
  let authorized = false;

  // Secret match
  if (process.env.CMS_PREVIEW_SECRET && secret === process.env.CMS_PREVIEW_SECRET) {
    authorized = true;
  } else {
    // Alternatively check if session user has CMS view capability
    const user = await getCurrentUser();
    if (user) {
      const cmsRole = await getEffectiveCmsRole(user.id);
      if (hasCmsCapability(cmsRole, "cms:content:view")) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized preview access" }, { status: 401 });
  }

  // 2. Verify page exists
  const page = await db.cmsContent.findUnique({
    where: { slug },
    select: { id: true, contentType: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // 3. Enable Draft Mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to preview target
  if (page.contentType === "PAGE") {
    redirect(`/p/${slug}`);
  } else if (page.contentType === "NEWS" || page.contentType === "ANNOUNCEMENT") {
    redirect(`/news/${slug}`);
  } else if (page.contentType === "EVENT") {
    redirect(`/events/${slug}`);
  }

  redirect(`/admin/cms/preview/${page.id}`);
}

