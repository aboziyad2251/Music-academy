import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await req.json();
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    const admin = createAdminClient();

    // Check already enrolled
    const { data: existing } = await admin
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .single();

    if (existing) return NextResponse.json({ enrolled: true });

    // Get course title for notification
    const { data: course } = await admin
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    // Enroll
    const { error } = await admin.from("enrollments").insert({
      course_id: courseId,
      student_id: user.id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send notification
    await admin.from("notifications").insert({
      user_id: user.id,
      message: `You are now enrolled in "${course?.title ?? "the course"}".`,
      link: `/student/courses/${courseId}`,
    });

    return NextResponse.json({ enrolled: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
