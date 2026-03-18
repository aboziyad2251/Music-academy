import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Verify admin
  const supabaseUser = createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run all queries in parallel
  const [
    profilesRes,
    coursesRes,
    enrollmentsRes,
    lessonProgressRes,
    lessonsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, is_active, created_at"),
    supabase.from("courses").select("id, title, status, price"),
    supabase.from("enrollments").select("id, student_id, course_id, enrolled_at, course:course_id(price, title), student:student_id(full_name)"),
    supabase.from("lesson_progress").select("id, completed"),
    supabase.from("lessons").select("id"),
  ]);

  const profiles = profilesRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const lessonProgress = lessonProgressRes.data ?? [];
  const lessons = lessonsRes.data ?? [];

  // ── Metric Cards ──
  const activeUsers = profiles.filter((p: any) => p.is_active).length;
  const publishedCourses = courses.filter((c: any) => c.status === "published").length;
  const totalRevenue = enrollments.reduce((sum: number, e: any) => sum + (Number(e.course?.price) || 0), 0);
  const completedProgress = lessonProgress.filter((p: any) => p.completed).length;
  const avgCompletion = lessons.length > 0 && activeUsers > 0
    ? Math.round((completedProgress / (lessons.length * Math.max(activeUsers, 1))) * 100)
    : 0;

  // ── Weekly New Users (last 6 weeks) ──
  const now = new Date();
  const weeklyNewUsers: { week: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - 6);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = profiles.filter((p: any) => {
      const d = new Date(p.created_at);
      return d >= weekStart && d <= weekEnd;
    }).length;
    weeklyNewUsers.push({ week: label, count });
  }

  // ── Monthly Revenue (last 6 months) ──
  const monthlyRevenue: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const amount = enrollments
      .filter((e: any) => {
        const ed = new Date(e.enrolled_at);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      })
      .reduce((sum: number, e: any) => sum + (Number(e.course?.price) || 0), 0);
    monthlyRevenue.push({ month: label, amount });
  }

  // ── Top 5 Courses by Enrollment ──
  const courseEnrollCount: Record<string, { title: string; count: number }> = {};
  for (const e of enrollments) {
    const id = e.course_id;
    const title = (e.course as any)?.title ?? "Unknown";
    if (!courseEnrollCount[id]) courseEnrollCount[id] = { title, count: 0 };
    courseEnrollCount[id].count++;
  }
  const topCourses = Object.values(courseEnrollCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({ title: c.title, enrolled: c.count }));

  // ── Recent Transactions (last 10 enrollments) ──
  const recentTransactions = enrollments
    .filter((e: any) => (e.course as any)?.price > 0)
    .sort((a: any, b: any) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
    .slice(0, 10)
    .map((e: any) => ({
      student: (e.student as any)?.full_name ?? "Unknown",
      course: (e.course as any)?.title ?? "Unknown",
      amount: Number((e.course as any)?.price) || 0,
      date: new Date(e.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "completed",
    }));

  return NextResponse.json({
    metrics: {
      totalRevenue,
      activeUsers,
      publishedCourses,
      avgCompletion,
    },
    weeklyNewUsers,
    monthlyRevenue,
    topCourses,
    recentTransactions,
  });
}
