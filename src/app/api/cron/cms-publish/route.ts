import { NextRequest, NextResponse } from "next/server";
import { processScheduledPublishingAndExpiry } from "@/lib/cms-scheduling";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveCmsRole } from "@/lib/cms-auth";
import { hasCmsCapability } from "@/lib/cms-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCronPublish(req);
}

export async function POST(req: NextRequest) {
  return handleCronPublish(req);
}

async function handleCronPublish(req: NextRequest) {
  // 1. Verify authorization header or Vercel cron header
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  const cronSecret = process.env.CRON_SECRET;

  let isAuthorized = false;
  let actorId: string | undefined = undefined;

  // Check Bearer token matching CRON_SECRET if configured
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else if (isVercelCron) {
    // Vercel Cron automatically attaches x-vercel-cron header in production
    isAuthorized = true;
  } else {
    // Alternatively, allow logged in CMS Administrator or Publisher to trigger via API
    try {
      const user = await getCurrentUser();
      if (user) {
        const cmsRole = await getEffectiveCmsRole(user.id);
        if (hasCmsCapability(cmsRole, "cms:content:schedule") || hasCmsCapability(cmsRole, "cms:content:publish")) {
          isAuthorized = true;
          actorId = user.id;
        }
      }
    } catch {
      // Ignore auth inspection error
    }
  }

  // In development environments without CRON_SECRET configured, allow execution
  if (!isAuthorized && process.env.NODE_ENV !== "production" && !cronSecret) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Valid Bearer token or CMS publishing authorization required." },
      { status: 401 }
    );
  }

  const result = await processScheduledPublishingAndExpiry(actorId);

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

