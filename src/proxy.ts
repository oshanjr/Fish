import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require MANAGER role
const managerOnlyRoutes = [
  "/dashboard/evening-closing",
  "/dashboard/hub-sync",
  "/dashboard/payroll",
];

export default auth((req: NextRequest & { auth: { user: { role: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    // If logged in and trying to access login, redirect to dashboard
    if (session?.user && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes — require authentication
  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check manager-only routes
    const isManagerRoute = managerOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isManagerRoute && session.user?.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
