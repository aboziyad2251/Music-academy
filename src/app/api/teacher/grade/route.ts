import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendGradeNotification } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, score, feedback } = body;

    if (!submissionId || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericScore = parseInt(score);
    if (isNaN(numericScore) || numericScore < 0) {
      return NextResponse.json({ error: "Score must be a non-negative number" }, { status: 400 });
    }

    // Validate score does not exceed the assignment's max_score
    const { data: submissionCheck } = await supabase
      .from("submissions")
      .select("assignment:assignment_id(max_score)")
      .eq("id", submissionId)
      .single();

    const maxScore = (submissionCheck?.assignment as any)?.max_score ?? 100;
    if (numericScore > maxScore) {
      return NextResponse.json(
        { error: `Score cannot exceed the maximum score of ${maxScore}` },
        { status: 400 }
      );
    }

    // 1. Update the submission
    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update({
        score: numericScore,
        feedback: feedback ? feedback.trim() : null,
        graded_by: user.id,
      })
      .eq("id", submissionId)
      .select(`
        *,
        student:student_id(email, full_name),
        assignment:assignment_id(
          title, 
          lesson_id,
          lesson:lesson_id(course_id)
        )
      `)
      .single();

    if (updateError || !submission) {
      console.error("Failed to update submission:", updateError);
      return NextResponse.json({ error: "Database error updating submission" }, { status: 500 });
    }

    // 2. Prepare Notification Data
    const studentEmail = submission.student?.email;
    const assignmentTitle = submission.assignment?.title || "Assignment";
    const courseId = submission.assignment?.lesson?.course_id;
    const lessonId = submission.assignment?.lesson_id;
    const link = courseId && lessonId ? `/courses/${courseId}/lessons/${lessonId}` : "/dashboard";

    // 3. Create In-App Notification
    await supabase.from("notifications").insert({
      user_id: submission.student_id,
      message: `Your assignment "${assignmentTitle}" was graded: ${numericScore}`,
      link: link
    });

    // 4. Send Email Notification
    if (studentEmail) {
      // Fire and forget
      sendGradeNotification(studentEmail, assignmentTitle, numericScore, feedback || "", `${process.env.NEXT_PUBLIC_APP_URL}${link}`)
        .catch(err => console.error("Email block error:", err));
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error("Grade API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
