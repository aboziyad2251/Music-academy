import { createServerClient } from "@/lib/supabase/server";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const teacherId = user.id;

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

      const { count: totalLessons } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", e.course_id);

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

  // Per-course analytics
  const courseStats = await Promise.all(
    (courses ?? []).map(async (course: any) => {
      const courseEnrollments = (enrollments ?? []).filter((e: any) => e.course_id === course.id);
      const enrollmentCount = courseEnrollments.length;
      const revenue = enrollmentCount * (course.price ?? 0);

      // Total lessons
      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", course.id);
      const lessonIds = (lessonRows ?? []).map((l: any) => l.id);
      const totalLessons = lessonIds.length;

      // Avg completion rate across enrolled students
      let avgCompletion = 0;
      if (enrollmentCount > 0 && totalLessons > 0) {
        const completionRates = await Promise.all(
          courseEnrollments.map(async (e: any) => {
            const { count } = await supabase
              .from("lesson_progress")
              .select("id", { count: "exact", head: true })
              .eq("student_id", e.student_id)
              .eq("completed", true)
              .in("lesson_id", lessonIds);
            return Math.round(((count ?? 0) / totalLessons) * 100);
          })
        );
        avgCompletion = Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length);
      }

      // Avg quiz score for this course
      let avgQuizScore: number | null = null;
      if (lessonIds.length > 0) {
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id")
          .eq("course_id", course.id);
        const quizIds = (quizzes ?? []).map((q: any) => q.id);
        if (quizIds.length > 0) {
          const { data: submissions } = await supabase
            .from("quiz_submissions")
            .select("score")
            .in("quiz_id", quizIds)
            .not("score", "is", null);
          if (submissions && submissions.length > 0) {
            avgQuizScore = Math.round(
              submissions.reduce((a: number, s: any) => a + (s.score ?? 0), 0) / submissions.length
            );
          }
        }
      }

      return {
        id: course.id,
        title: course.title,
        status: course.status,
        enrollmentCount,
        revenue,
        avgCompletion,
        avgQuizScore,
        totalLessons,
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
      courseStats={courseStats}
    />
  );
}
