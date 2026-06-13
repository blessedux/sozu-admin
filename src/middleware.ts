import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

const AUTH_MOCK = process.env.AUTH_MOCK === "true";

function hasSession(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE)?.value || AUTH_MOCK;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/invest")) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (hasSession(request)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/network")) {
    if (!hasSession(request)) {
      const url = new URL("/", request.url);
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/network/:path*", "/invest/:path*"],
};
