import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add paths that should be publicly accessible
const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_PATHS = ["/login", "/signup", "/auth/error"]; // Added /auth/error as a common public auth path

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public files and specified public paths
  if (
    PUBLIC_FILE.test(pathname) ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next/") || // Explicitly allow Next.js internals
    pathname.startsWith("/api/") // Explicitly allow API routes if not caught by matcher
  ) {
    return NextResponse.next();
  }

  // Find the Supabase auth token cookie
  // Supabase cookies are typically named sb-<project_id>-auth-token
  const cookieStore = req.cookies;
  let supabaseAuthCookie = null;
  for (const [name, value] of cookieStore) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      supabaseAuthCookie = value;
      break;
    }
  }

  const isAuthenticated = !!supabaseAuthCookie;

  if (
    !isAuthenticated &&
    !PUBLIC_PATHS.includes(pathname) &&
    !PUBLIC_FILE.test(pathname)
  ) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    if (pathname !== "/") {
      // Avoid adding redirect for the home page if it's the one being protected
      loginUrl.search = `redirect=${pathname}`;
    }
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/signup, redirect to dashboard or home
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = ""; // Clear any previous search params like ?redirect=
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for specific static files and API routes.
  // Adjusted to be less aggressive and rely more on explicit checks within the middleware.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*\\.js).*) ",
  ],
};
