import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/quiz/[quizId]  — get quiz with questions (student view hides correct answers)
export async function GET(
  _req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabaseUser = createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, title, description, passing_score, course_id")
    .eq("id", params.quizId)
    .single();

  if (error || !quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question, choices, position")
    .eq("quiz_id", params.quizId)
    .order("position", { ascending: true });

  // Check if student already submitted this quiz
  const { data: submission } = await supabase
    .from("quiz_submissions")
    .select("id, score, passed, answers, submitted_at")
    .eq("quiz_id", params.quizId)
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    quiz,
    questions: questions ?? [],
    submission: submission ?? null,
  });
}
