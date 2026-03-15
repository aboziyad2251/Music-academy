import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/quiz?courseId=xxx  — list quizzes for a course
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, description, passing_score, created_at, quiz_questions(count)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quizzes: data ?? [] });
}

// POST /api/quiz  — create a quiz with questions
export async function POST(req: NextRequest) {
  const supabaseUser = createServerClient();
  const { data: { session } } = await supabaseUser.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  // Verify teacher owns this course
  const { courseId, title, description, passingScore, questions } = await req.json();
  if (!courseId || !title || !questions?.length) {
    return NextResponse.json({ error: "courseId, title, and at least one question are required" }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id")
    .eq("id", courseId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!course || (course.teacher_id !== session.user.id && profile?.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      passing_score: passingScore ?? 70,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: quizError?.message || "Failed to create quiz" }, { status: 500 });
  }

  // Insert questions
  const questionRows = questions.map((q: any, idx: number) => ({
    quiz_id: quiz.id,
    question: q.question,
    choices: q.choices,
    correct_index: q.correctIndex,
    position: idx + 1,
  }));

  const { error: qError } = await supabase.from("quiz_questions").insert(questionRows);
  if (qError) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, quizId: quiz.id });
}
