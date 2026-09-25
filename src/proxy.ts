import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decrypt, homeFor } from "@/lib/session";

const areas = { "/student": "STUDENT", "/alumni": "ALUMNI", "/teacher": "TEACHER", "/admin": "ADMIN" } as const;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  // Signed-in users skip the auth pages.
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }

  const area = Object.entries(areas).find(([prefix]) => pathname.startsWith(prefix));
  if (!area) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (session.role !== area[1]) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/alumni/:path*", "/teacher/:path*", "/admin/:path*", "/login", "/signup"],
};
