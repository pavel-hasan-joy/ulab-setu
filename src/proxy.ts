import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decrypt, homeFor } from "@/lib/session";
import { getClientIpFromHeaders } from "@/lib/rate-limit";

const areas = {
  "/student": "STUDENT",
  "/alumni": "ALUMNI",
  "/teacher": "TEACHER",
  "/admin": "ADMIN",
} as const;

// Malicious automated scrapers, brute-force tools, and vulnerability scanners
const BLOCKED_BOT_USER_AGENTS = [
  /curl\//i,
  /python-requests/i,
  /aiohttp/i,
  /httpx/i,
  /Go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /wget\//i,
  /scrapy/i,
  /masscan/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /zgrab/i,
];

// Aggressive AI and data-mining crawlers to exclude from internal/auth pages
const AI_SCRAPER_USER_AGENTS = [
  /gptbot/i,
  /ccbot/i,
  /claudebot/i,
  /anthropic-ai/i,
  /bytespider/i,
  /perplexitybot/i,
];

// In-memory sliding window for Edge IP rate limiting
const edgeIpRequests = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE_AUTH = 35;
const WINDOW_MS = 60 * 1000;

function setSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";
  const clientIp = getClientIpFromHeaders(req.headers);

  // 1. Block Malicious Scraping / Exploitation Bots on Sensitive Endpoints
  const isSensitivePath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api");

  if (isSensitivePath) {
    // Check for known attack tooling User-Agents
    for (const pattern of BLOCKED_BOT_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return setSecurityHeaders(
          new NextResponse(
            JSON.stringify({
              error: "Access Denied: Automated bot or scraping tool detected.",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }
    }

    // Check for missing or blank user-agent (allow internal Vercel cron)
    if (!userAgent.trim() && !pathname.startsWith("/api/cron")) {
      return setSecurityHeaders(
        new NextResponse(
          JSON.stringify({ error: "Access Denied: Valid browser User-Agent required." }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }
  }

  // 2. Block AI Content Miners from crawling Private & Institutional Areas
  const isPrivateZone =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/alumni") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/api");

  if (isPrivateZone) {
    for (const pattern of AI_SCRAPER_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return setSecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: "Access Denied for AI web crawlers." }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }
    }
  }

  // 3. Edge IP Rate Limiter on Authentication Endpoints (Brute-Force & Denial of Service Defense)
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    const now = Date.now();
    const timestamps = (edgeIpRequests.get(clientIp) || []).filter((ts) => now - ts < WINDOW_MS);

    if (timestamps.length >= MAX_REQUESTS_PER_MINUTE_AUTH) {
      return setSecurityHeaders(
        new NextResponse(
          "<html><body style='font-family:sans-serif;text-align:center;padding:50px;'><h2>429 - Too Many Requests</h2><p>Excessive request rate detected from your IP address. Please wait a minute before retrying.</p></body></html>",
          {
            status: 429,
            headers: {
              "Content-Type": "text/html",
              "Retry-After": "60",
            },
          }
        )
      );
    }

    timestamps.push(now);
    edgeIpRequests.set(clientIp, timestamps);
  }

  // 4. Session & Role Verification Logic
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  // Signed-in users skip the auth pages.
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return setSecurityHeaders(NextResponse.redirect(new URL(homeFor(session.role), req.url)));
  }

  const area = Object.entries(areas).find(([prefix]) => pathname.startsWith(prefix));
  if (!area) {
    return setSecurityHeaders(NextResponse.next());
  }

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return setSecurityHeaders(NextResponse.redirect(url));
  }
  if (session.role !== area[1]) {
    return setSecurityHeaders(NextResponse.redirect(new URL(homeFor(session.role), req.url)));
  }

  return setSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/student/:path*",
    "/alumni/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/api/:path*",
  ],
};
