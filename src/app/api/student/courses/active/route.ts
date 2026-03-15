import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = session.user.id;

  // Get the most recently enrolled course that isn't 100% complete
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      course_id,
      enrolled_at,
      course:course_id (
        id,
        title,
        teacher:teacher_id (full_name)
      )
    `)
    .eq("student_id", studentId)
    .order("enrolled_at", { ascending: false })
    .limit(5);

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json(null);
  }

  // For each enrollment find progress pct
  for (const enrollment of enrollments) {
    const courseId = enrollment.course_id;

    // Total lessons in course
    const { count: totalLessons } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (!totalLessons || totalLessons === 0) continue;

    // Completed lessons count
    const { count: completedLessons } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("completed", true)
      .in(
        "lesson_id",
        (
          await supabase
            .from("lessons")
            .select("id")
            .eq("course_id", courseId)
        ).data?.map((l: any) => l.id) ?? []
      );

    const progressPct = Math.round(((completedLessons ?? 0) / totalLessons) * 100);

    // Skip completed courses, prefer in-progress
    if (progressPct === 100 && enrollments.length > 1) continue;

    // Next lesson = first incomplete lesson
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, title, position")
      .eq("course_id", courseId)
      .order("position", { ascending: true });

    const { data: completedRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .eq("completed", true);

    const completedIds = new Set((completedRows ?? []).map((r: any) => r.lesson_id));
    const nextLesson = (allLessons ?? []).find((l: any) => !completedIds.has(l.id));

    const course: any = enrollment.course;
    const teacher: any = course?.teacher;

    return NextResponse.json({
      id: courseId,
      title: course?.title ?? "دورة",
      teacher: teacher?.full_name ?? "المعلم",
      nextLesson: nextLesson?.title ?? "الدرس الأول",
      progressPct,
    });
  }

  // All enrolled courses are complete — return the latest anyway
  const first: any = enrollments[0];
  const course: any = first.course;
  const teacher: any = course?.teacher;
  return NextResponse.json({
    id: first.course_id,
    title: course?.title ?? "دورة",
    teacher: teacher?.full_name ?? "المعلم",
    nextLesson: "مراجعة الدورة",
    progressPct: 100,
  });
}
