import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/quiz/submit  — student submits quiz answers
export async function POST(req: NextRequest) {
  const supabaseUser = createServerClient();
  const { data: { session } } = await supabaseUser.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await req.json();
  if (!quizId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "quizId and answers array required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Load quiz passing score + title
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("passing_score, title")
    .eq("id", quizId)
    .single();

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Load correct answers
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_index, position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (!questions?.length) return NextResponse.json({ error: "No questions found" }, { status: 400 });

  // Calculate score
  let correct = 0;
  questions.forEach((q: any, idx: number) => {
    if (answers[idx] === q.correct_index) correct++;
  });
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= (quiz.passing_score ?? 70);

  // Save submission
  const { data: submission, error: subError } = await supabase
    .from("quiz_submissions")
    .insert({
      quiz_id: quizId,
      student_id: session.user.id,
      answers,
      score,
      passed,
    })
    .select("id, score, passed")
    .single();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Send in-app notification to student
  await supabase.from("notifications").insert({
    user_id: session.user.id,
    message: passed
      ? `You passed "${quiz.title}" with ${score}%! 🎉`
      : `You scored ${score}% on "${quiz.title}". You need ${quiz.passing_score ?? 70}% to pass. Try again!`,
    link: null,
  });

  return NextResponse.json({
    score,
    passed,
    correct,
    total: questions.length,
    submissionId: submission.id,
  });
}
