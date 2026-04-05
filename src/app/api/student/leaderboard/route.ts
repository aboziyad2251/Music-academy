import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  // Get all enrolled students
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, student:student_id(full_name, avatar_url)")
    .eq("course_id", courseId);

  if (!enrollments || enrollments.length === 0) return NextResponse.json([]);

  // Get all lesson IDs for this course
  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);
  const lessonIds = (lessonRows ?? []).map((l: any) => l.id);
  const totalLessons = lessonIds.length;

  // Get all quiz IDs for this course
  const { data: quizRows } = await supabase
    .from("quizzes")
    .select("id")
    .eq("course_id", courseId);
  const quizIds = (quizRows ?? []).map((q: any) => q.id);

  // Build leaderboard for each student
  const scores = await Promise.all(
    enrollments.map(async (e: any) => {
      const studentId = e.student_id;

      // Completion %
      let completionPct = 0;
      if (totalLessons > 0 && lessonIds.length > 0) {
        const { count } = await supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId)
          .eq("completed", true)
          .in("lesson_id", lessonIds);
        completionPct = Math.round(((count ?? 0) / totalLessons) * 100);
      }

      // Avg quiz score
      let avgQuiz = 0;
      if (quizIds.length > 0) {
        const { data: qSubs } = await supabase
          .from("quiz_submissions")
          .select("score")
          .eq("student_id", studentId)
          .in("quiz_id", quizIds)
          .not("score", "is", null);
        if (qSubs && qSubs.length > 0) {
          avgQuiz = Math.round(
            qSubs.reduce((a: number, s: any) => a + (s.score ?? 0), 0) / qSubs.length
          );
        }
      }

      // Total score: 60% completion + 40% quiz
      const totalScore = Math.round(completionPct * 0.6 + avgQuiz * 0.4);

      return {
        studentId,
        name: (e.student as any)?.full_name ?? "Student",
        avatar_url: (e.student as any)?.avatar_url ?? null,
        completionPct,
        avgQuiz,
        totalScore,
        isCurrentUser: studentId === user.id,
      };
    })
  );

  const ranked = scores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return NextResponse.json(ranked);
}
