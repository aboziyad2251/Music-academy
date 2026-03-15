import { createServerClient } from "@/lib/supabase/server";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const teacherId = session.user.id;

  // Fetch teacher's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, status, price")
    .eq("teacher_id", teacherId);

  const courseIds = (courses ?? []).map((c: any) => c.id);
  const publishedCourses = (courses ?? []).filter((c: any) => c.status === "published").length;

  // Active students (unique enrolled students across teacher's courses)
  const { data: enrollments } = courseIds.length
    ? await supabase
        .from("enrollments")
        .select("student_id, course_id, enrolled_at, student:student_id(full_name)")
        .in("course_id", courseIds)
    : { data: [] };

  const activeStudents = new Set((enrollments ?? []).map((e: any) => e.student_id)).size;

  // Total earnings (sum of course prices × enrollments)
  const totalEarnings = (enrollments ?? []).reduce((acc: number, e: any) => {
    const course = (courses ?? []).find((c: any) => c.id === e.course_id);
    return acc + (course?.price ?? 0);
  }, 0);

  // Pending reviews: ungraded submissions for teacher's courses
  let pendingReviews = 0;
  if (courseIds.length) {
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .is("score", null)
      .in(
        "assignment_id",
        (await supabase
          .from("assignments")
          .select("id")
          .in(
            "lesson_id",
            (await supabase.from("lessons").select("id").in("course_id", courseIds)).data?.map((l: any) => l.id) ?? []
          )).data?.map((a: any) => a.id) ?? []
      );
    pendingReviews = count ?? 0;
  }

  // Build roster: latest 10 enrolled students with progress
  const rosterEnrollments = (enrollments ?? []).slice(0, 10);
  const roster = await Promise.all(
    rosterEnrollments.map(async (e: any) => {
      const course = (courses ?? []).find((c: any) => c.id === e.course_id);

      // Total lessons in course
      const { count: totalLessons } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", e.course_id);

      // Completed lessons for this student in this course
      const lessonIds = totalLessons
        ? (await supabase.from("lessons").select("id").eq("course_id", e.course_id)).data?.map((l: any) => l.id) ?? []
        : [];

      const { count: completedLessons } = lessonIds.length
        ? await supabase
            .from("lesson_progress")
            .select("id", { count: "exact", head: true })
            .eq("student_id", e.student_id)
            .eq("completed", true)
            .in("lesson_id", lessonIds)
        : { count: 0 };

      const progress = totalLessons ? Math.round(((completedLessons ?? 0) / totalLessons) * 100) : 0;

      // Last active: most recent lesson_progress update
      const { data: lastActivity } = await supabase
        .from("lesson_progress")
        .select("updated_at")
        .eq("student_id", e.student_id)
        .in("lesson_id", lessonIds.length ? lessonIds : ["none"])
        .order("updated_at", { ascending: false })
        .limit(1);

      let lastActive = "لم يبدأ بعد";
      if (lastActivity && lastActivity.length > 0) {
        const diff = Date.now() - new Date(lastActivity[0].updated_at).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) lastActive = "منذ قليل";
        else if (hours < 24) lastActive = `منذ ${hours} ساعة`;
        else {
          const days = Math.floor(hours / 24);
          lastActive = days === 1 ? "أمس" : `منذ ${days} أيام`;
        }
      }

      const student: any = e.student;
      return {
        name: student?.full_name ?? "طالب",
        course: course?.title ?? "دورة",
        lastActive,
        progress,
      };
    })
  );

  return (
    <TeacherDashboardClient
      activeStudents={activeStudents}
      publishedCourses={publishedCourses}
      pendingReviews={pendingReviews}
      totalEarnings={totalEarnings}
      roster={roster}
    />
  );
}
