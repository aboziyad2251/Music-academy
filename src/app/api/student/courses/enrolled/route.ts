import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = session.user.id;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, enrolled_at, course:course_id(id, title, thumbnail_url, category, level, teacher:teacher_id(full_name))")
    .eq("student_id", studentId)
    .order("enrolled_at", { ascending: false });

  if (!enrollments || enrollments.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    enrollments.map(async (enrollment: any) => {
      const courseId = enrollment.course_id;
      const course = enrollment.course;

      const { data: lessonIds } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId);

      const ids = (lessonIds ?? []).map((l: any) => l.id);
      const total = ids.length;

      if (total === 0) {
        return { ...course, progressPct: 0, completedLessons: 0, totalLessons: 0, nextLessonId: null };
      }

      const { count: completed } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("completed", true)
        .in("lesson_id", ids);

      const { data: completedRows } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("student_id", studentId)
        .eq("completed", true);

      const completedSet = new Set((completedRows ?? []).map((r: any) => r.lesson_id));

      const { data: orderedLessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      const nextLesson = (orderedLessons ?? []).find((l: any) => !completedSet.has(l.id));

      return {
        ...course,
        progressPct: Math.round(((completed ?? 0) / total) * 100),
        completedLessons: completed ?? 0,
        totalLessons: total,
        nextLessonId: nextLesson?.id ?? null,
      };
    })
  );

  return NextResponse.json(results);
}
