import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendGradeNotification } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !["teacher", "admin"].includes(session.user.user_metadata?.role || "")) {
      // Need a rigid check on profiles table if metadata isn't reliable
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session?.user.id).single();
      if (!profile || !["teacher", "admin"].includes(profile.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { submissionId, score, feedback } = body;

    if (!submissionId || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Update the submission
    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update({
        score: parseInt(score),
        feedback: feedback ? feedback.trim() : null,
        graded_by: session!.user.id,
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
      message: `Your assignment "${assignmentTitle}" was graded: ${score}`,
      link: link
    });

    // 4. Send Email Notification
    if (studentEmail) {
      // Fire and forget
      sendGradeNotification(studentEmail, assignmentTitle, parseInt(score), feedback || "", `${process.env.NEXT_PUBLIC_APP_URL}${link}`)
        .catch(err => console.error("Email block error:", err));
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error("Grade API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
