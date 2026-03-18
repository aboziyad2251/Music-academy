import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/enroll — enroll a user (student or teacher) into a course without payment
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, courseId } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "userId and courseId required" }, { status: 400 });
  }

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient();

  // Check if already enrolled
  const { data: existing } = await adminSupabase
    .from("enrollments")
    .select("id")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  // Insert enrollment
  const { error } = await adminSupabase.from("enrollments").insert({
    student_id: userId,
    course_id: courseId,
    enrolled_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get course title for notification
  const { data: course } = await adminSupabase
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .single();

  // Send notification to the user
  await adminSupabase.from("notifications").insert({
    user_id: userId,
    message: `You have been enrolled in "${course?.title ?? "a course"}" by an admin.`,
    link: `/student/courses/${courseId}`,
  });

  return NextResponse.json({ success: true });
}

// GET /api/admin/enroll?search=xxx — search users for enrollment
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const courseId = req.nextUrl.searchParams.get("courseId") ?? "";

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["student", "teacher"])
    .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    .order("full_name")
    .limit(20);

  // Get already-enrolled user IDs for this course
  let enrolledIds: Set<string> = new Set();
  if (courseId) {
    const { data: enrolled } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("course_id", courseId);
    enrolledIds = new Set((enrolled ?? []).map((e: any) => e.student_id));
  }

  const result = (users ?? []).map((u: any) => ({
    ...u,
    alreadyEnrolled: enrolledIds.has(u.id),
  }));

  return NextResponse.json({ users: result });
}
