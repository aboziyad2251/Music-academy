import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated admin or teacher
  const supabaseUser = createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch caller's role
  const { data: caller } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!caller || (caller.role !== "admin" && caller.role !== "teacher")) {
    return NextResponse.json({ error: "Only admins and teachers can invite students." }, { status: 403 });
  }

  const { email, courseId, fullName } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // If teacher is inviting, verify the courseId belongs to them
  if (caller.role === "teacher" && courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, teacher_id")
      .eq("id", courseId)
      .single();
    if (!course || course.teacher_id !== user.id) {
      return NextResponse.json({ error: "You can only invite students to your own courses." }, { status: 403 });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Send magic-link invite via Supabase Auth Admin
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/api/auth/callback`,
    data: {
      full_name: fullName || "",
      role: "student",
      invited_by: user.id,
    },
  });

  if (inviteError) {
    // If user already exists, that's okay — we just handle enrollment
    if (!inviteError.message.includes("already been registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  const userId = inviteData?.user?.id;

  if (userId) {
    // Upsert their profile to ensure student role
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName || "",
      role: "student",
      is_active: true,
    });

    // Enroll in course if provided
    if (courseId) {
      const { error: enrollError } = await supabase
        .from("enrollments")
        .upsert({ student_id: userId, course_id: courseId }, { onConflict: "student_id,course_id" });

      if (enrollError) {
        console.error("Enrollment error:", enrollError.message);
        // Don't fail the whole request — invite was still sent
      }
    }
  }

  return NextResponse.json({ success: true });
}
