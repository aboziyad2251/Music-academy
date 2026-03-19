import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET — fetch current student's profile + earned certificates + stats
export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRes, enrollmentsRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email, bio, avatar_url, role").eq("id", user.id).single(),
    supabase.from("enrollments").select("course_id, enrolled_at, course:course_id(id, title, category, level, teacher:teacher_id(full_name))").eq("student_id", user.id),
    supabase.from("lesson_progress").select("lesson_id, completed").eq("student_id", user.id).eq("completed", true),
  ]);

  const profile = profileRes.data;
  const enrollments = enrollmentsRes.data ?? [];
  const completedLessonIds = new Set((progressRes.data ?? []).map((r: any) => r.lesson_id));

  // For each enrolled course, check if all lessons are completed (= certificate earned)
  const courseDetails = await Promise.all(
    enrollments.map(async (e: any) => {
      const courseId = e.course_id;
      const { count: total } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId);

      const { data: lessonIds } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId);

      const ids = (lessonIds ?? []).map((l: any) => l.id);
      const completedCount = ids.filter((id: string) => completedLessonIds.has(id)).length;
      const isComplete = total !== null && total > 0 && completedCount === total;

      const course: any = e.course;
      return {
        id: courseId,
        title: course?.title ?? "Course",
        category: course?.category ?? null,
        level: course?.level ?? null,
        teacherName: (course?.teacher as any)?.full_name ?? null,
        enrolledAt: e.enrolled_at,
        completedLessons: completedCount,
        totalLessons: total ?? 0,
        progressPct: total ? Math.round((completedCount / total) * 100) : 0,
        certificateEarned: isComplete,
      };
    })
  );

  const certificates = courseDetails.filter((c) => c.certificateEarned);

  return NextResponse.json({
    profile: {
      full_name: profile?.full_name ?? "",
      email: profile?.email ?? user.email ?? "",
      bio: profile?.bio ?? "",
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? "student",
    },
    stats: {
      coursesEnrolled: enrollments.length,
      lessonsCompleted: completedLessonIds.size,
      certificatesEarned: certificates.length,
    },
    courses: courseDetails,
    certificates,
  });
}

// PATCH — update name, bio, avatar_url
export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, bio, avatar_url } = body;

  const updates: Record<string, string> = {};
  if (typeof full_name === "string" && full_name.trim()) updates.full_name = full_name.trim();
  if (typeof bio === "string") updates.bio = bio.trim();
  if (typeof avatar_url === "string") updates.avatar_url = avatar_url.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
