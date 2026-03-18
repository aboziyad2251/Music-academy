import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = user.id;

  // Get enrolled course IDs
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", studentId);

  if (!enrollments || enrollments.length === 0) return NextResponse.json([]);

  const courseIds = enrollments.map((e: any) => e.course_id);

  // Get lessons in those courses
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, course_id, title, course:course_id(title)")
    .in("course_id", courseIds);

  if (!lessons || lessons.length === 0) return NextResponse.json([]);

  const lessonIds = lessons.map((l: any) => l.id);
  const lessonMap: Record<string, any> = {};
  lessons.forEach((l: any) => { lessonMap[l.id] = l; });

  // Get assignments for those lessons
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, description, max_score, due_date, lesson_id, created_at")
    .in("lesson_id", lessonIds)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (!assignments || assignments.length === 0) return NextResponse.json([]);

  const assignmentIds = assignments.map((a: any) => a.id);

  // Get submissions for this student
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, assignment_id, score, feedback, submitted_at")
    .eq("student_id", studentId)
    .in("assignment_id", assignmentIds);

  const submissionMap: Record<string, any> = {};
  (submissions ?? []).forEach((s: any) => { submissionMap[s.assignment_id] = s; });

  const result = assignments.map((a: any) => {
    const lesson = lessonMap[a.lesson_id];
    const submission = submissionMap[a.id] ?? null;

    let status: "pending" | "submitted" | "graded" = "pending";
    if (submission) {
      status = submission.score !== null ? "graded" : "submitted";
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      max_score: a.max_score,
      due_date: a.due_date,
      lesson_id: a.lesson_id,
      lesson_title: lesson?.title ?? "Lesson",
      course_id: lesson?.course_id ?? null,
      course_title: (lesson?.course as any)?.title ?? "Course",
      status,
      submission: submission
        ? { id: submission.id, score: submission.score, feedback: submission.feedback, submitted_at: submission.submitted_at }
        : null,
    };
  });

  return NextResponse.json(result);
}
