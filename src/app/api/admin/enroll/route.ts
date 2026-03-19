import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEnrollmentEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
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

  const { studentId, courseId } = await req.json();
  if (!studentId || !courseId) {
    return NextResponse.json({ error: "studentId and courseId are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Student is already enrolled in this course" }, { status: 409 });
  }

  const { error } = await admin.from("enrollments").insert({
    student_id: studentId,
    course_id: courseId,
    enrolled_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: course } = await admin
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .single();

  await admin.from("notifications").insert({
    user_id: studentId,
    message: `You have been enrolled in "${course?.title ?? "a course"}" by the admin.`,
    link: `/student/courses/${courseId}`,
  });

  // Send enrollment email (fire and forget)
  const { data: studentProfile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", studentId)
    .single();

  if (studentProfile?.email) {
    sendEnrollmentEmail(
      studentProfile.email,
      studentProfile.full_name ?? "Student",
      course?.title ?? "the course",
      `${process.env.NEXT_PUBLIC_APP_URL}/student/courses/${courseId}`
    ).catch(err => console.error("Admin enrollment email error:", err));
  }

  return NextResponse.json({ success: true });
}
