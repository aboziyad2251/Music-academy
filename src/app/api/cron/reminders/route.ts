import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendAssignmentReminder } from "@/lib/email/resend";

export async function GET(req: Request) {
  // Simple check to ensure this is only called with the right secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  
  // In production, you would add a CRON_SECRET to your environment variables
  // e.g., if (secret !== process.env.CRON_SECRET) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const supabase = createServerClient();

    // Find assignments due exactly tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    const { data: assignments, error: assignError } = await supabase
      .from("assignments")
      .select("id, title, due_date, lesson_id, lesson:lesson_id(course_id)")
      .gte("due_date", tomorrowStart)
      .lte("due_date", tomorrowEnd);

    if (assignError || !assignments || assignments.length === 0) {
      return NextResponse.json({ message: "No assignments due tomorrow." });
    }

    let emailsSent = 0;

    for (const assignment of assignments) {
      const lessonData: any = assignment.lesson;
      const courseId = Array.isArray(lessonData) ? lessonData[0]?.course_id : lessonData?.course_id;
      if (!courseId) continue;

      // Find all students enrolled in the course who haven't submitted yet
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, student:student_id(email, full_name)")
        .eq("course_id", courseId);

      if (!enrollments) continue;

      // Find existing submissions for this assignment
      const { data: submissions } = await supabase
        .from("submissions")
        .select("student_id")
        .eq("assignment_id", assignment.id);

      const submittedStudentIds = new Set(submissions?.map((s: any) => s.student_id) || []);

      for (const e of enrollments) {
        const studentData: any = e.student;
        const studentEmail = Array.isArray(studentData) ? studentData[0]?.email : studentData?.email;
        
        if (!submittedStudentIds.has(e.student_id) && studentEmail) {
          const link = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/lessons/${assignment.lesson_id}`;
          
          await sendAssignmentReminder(
             studentEmail, 
             assignment.title, 
             link
          );

          // Optionally, add an in-app notification for the reminder too
          await supabase.from("notifications").insert({
            user_id: e.student_id,
            message: `Reminder: Assignment "${assignment.title}" is due tomorrow!`,
            link: `/courses/${courseId}/lessons/${assignment.lesson_id}`
          });
          
          emailsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
