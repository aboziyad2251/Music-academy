import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/resend";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (code) {
    const supabase = createServerClient();
    
    try {
      // Exchange code for Supabase session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
      }

      const userId = data.user?.id;
      const userEmail = data.user?.email;
      const userName = data.user?.user_metadata?.full_name || "Student";
      
      if (userId) {
        // Fetch user's profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, created_at")
          .eq("id", userId)
          .single();
          
        if (profileError) {
          console.error("Profile fetch error:", profileError);
          // Fallback to student dashboard if profile isn't ready
          return NextResponse.redirect(`${appUrl}/dashboard`);
        }
        
        // If created recently (within last 60 seconds), treat as new signup
        const profileCreatedAt = new Date(profile.created_at).getTime();
        const now = new Date().getTime();
        if (userEmail && now - profileCreatedAt < 60000) {
          // Fire and forget, don't await email
          sendWelcomeEmail(userEmail, userName).catch(console.error);
        }

        // Redirect based on role
        if (profile.role === "admin") {
          return NextResponse.redirect(`${appUrl}/admin/dashboard`);
        } else if (profile.role === "teacher") {
          return NextResponse.redirect(`${appUrl}/teacher/dashboard`);
        } else {
          // Default to student dashboard
          return NextResponse.redirect(`${appUrl}/dashboard`); // Assuming (student) is the primary dashboard
        }
      }
    } catch (err) {
      console.error("Exception in auth callback:", err);
      return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
    }
  }

  // If no code is present, redirect to login with error
  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
}
