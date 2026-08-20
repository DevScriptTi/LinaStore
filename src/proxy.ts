import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes: redirect to /login if no active admin session
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in admin away from /login page to /dashboard
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Backward compatibility export if required by runtime
export const middleware = proxy;

export const config = {
  // CRITICAL ROUTING ISOLATION: Only run proxy on /dashboard routes and /login
  matcher: ["/dashboard/:path*", "/login"],
};
