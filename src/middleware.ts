import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Public routes (API Auth, Stripe Webhooks, etc)
  if (pathname.startsWith("/api/stripe") || pathname.startsWith("/api/auth")) {
    return res;
  }

  // Allow unauthenticated users to access the login page
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return res;
  }

  // Protect AI API routes, must return JSON instead of redirect
  if (pathname.startsWith("/api/ai")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // All other routes listed require at least a session
  const isProtectedPath = 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/teacher") || 
    pathname.startsWith("/student") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses");

  if (!isProtectedPath) {
    return res;
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check roles for path-based authorization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "student";

  // /admin/* → only role 'admin' allowed
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // /teacher/* → roles 'teacher' OR 'admin' allowed
  if (pathname.startsWith("/teacher")) {
    if (role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // /student/* → roles 'student', 'teacher', OR 'admin' allowed
  if (pathname.startsWith("/student")) {
    if (role !== "student" && role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return res;
}

// Specify matcher to avoid running middleware on static resources
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
