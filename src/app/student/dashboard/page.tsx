import { createServerClient } from "@/lib/supabase/server";
import CourseCard from "@/components/student/CourseCard";
import ProgressBar from "@/components/student/ProgressBar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Flame,
  ArrowRight,
  Activity,
  CalendarDays,
  Clock,
} from "lucide-react";

const STAT_CONFIG = [
  {
    key: "enrolledCourses",
    label: "Enrolled Courses",
    icon: BookOpen,
    color: "text-indigo-400",
    bg: "bg-indigo-950/60",
    border: "border-indigo-800/40",
  },
  {
    key: "completedLessons",
    label: "Completed Lessons",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/40",
  },
  {
    key: "pendingAssignments",
    label: "Pending Assignments",
    icon: ClipboardList,
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/40",
  },
  {
    key: "dayStreak",
    label: "Day Streak",
    icon: Flame,
    color: "text-orange-400",
    bg: "bg-orange-950/60",
    border: "border-orange-800/40",
  },
] as const;

export default async function StudentDashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      course_id, enrolled_at,
      course:courses (
        id, title, thumbnail_url, price, category, level,
        teacher:teacher_id(full_name)
      )
    `)
    .eq("student_id", session.user.id)
    .order("enrolled_at", { ascending: false });

  const { data: completedProgress } = await supabase
    .from("lesson_progress")
    .select("id, lesson_id, updated_at")
    .eq("student_id", session.user.id)
    .eq("completed", true)
    .order("updated_at", { ascending: false });

  const courseIds = enrollments?.map((e: any) => e.course_id) ?? [];
  let courseProgressMap: Record<string, { total: number; completed: number }> = {};
  let pendingAssignments: any[] = [];

  if (courseIds.length > 0) {
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, course_id")
      .in("course_id", courseIds);

    const { data: userProgress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", session.user.id)
      .eq("completed", true);

    const completedSet = new Set(userProgress?.map((p: any) => p.lesson_id));

    allLessons?.forEach((lesson: any) => {
      if (!courseProgressMap[lesson.course_id]) {
        courseProgressMap[lesson.course_id] = { total: 0, completed: 0 };
      }
      courseProgressMap[lesson.course_id].total += 1;
      if (completedSet.has(lesson.id)) courseProgressMap[lesson.course_id].completed += 1;
    });

    if (allLessons && allLessons.length > 0) {
      const lessonIds = allLessons.map((l: any) => l.id);
      const { data: allAssignments } = await supabase
        .from("assignments")
        .select("*, lesson:lesson_id(course_id, title)")
        .in("lesson_id", lessonIds)
        .order("due_date", { ascending: true });

      if (allAssignments && allAssignments.length > 0) {
        const { data: submitted } = await supabase
          .from("submissions")
          .select("assignment_id")
          .eq("student_id", session.user.id)
          .in("assignment_id", allAssignments.map((a: any) => a.id));

        const submittedSet = new Set(submitted?.map((s: any) => s.assignment_id) ?? []);
        pendingAssignments = allAssignments.filter((a: any) => !submittedSet.has(a.id));
      }
    }
  }

  let dayStreak = 0;
  if (completedProgress && completedProgress.length > 0) {
    const activityDates = new Set(
      completedProgress.map((p: any) => new Date(p.updated_at).toDateString())
    );
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (activityDates.has(d.toDateString())) {
        dayStreak++;
      } else {
        break;
      }
    }
  }

  const statValues: Record<string, number> = {
    enrolledCourses: enrollments?.length ?? 0,
    completedLessons: completedProgress?.length ?? 0,
    pendingAssignments: pendingAssignments.length,
    dayStreak,
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  return (
    <div className="space-y-8 pb-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Welcome back, {firstName} 🎵
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Here&apos;s an overview of your learning journey.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, border }) => (
          <div key={key} className={`rounded-xl border ${border} ${bg} p-5 space-y-4`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${color} tabular-nums`}>
                {statValues[key]}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3-col grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* My Courses — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">My Courses</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 h-8 text-xs"
              asChild
            >
              <Link href="/student/courses">
                Browse all <ArrowRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {enrollments && enrollments.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {enrollments.slice(0, 4).map((enr: any) => {
                const prog = courseProgressMap[enr.course_id] ?? { total: 0, completed: 0 };
                return (
                  <div
                    key={enr.course_id}
                    className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col"
                  >
                    <CourseCard course={enr.course} isEnrolled />
                    {prog.total > 0 && (
                      <div className="px-4 pb-4 border-t border-slate-800 pt-3">
                        <ProgressBar
                          completedLessons={prog.completed}
                          totalLessons={prog.total}
                          className="[&_.text-slate-600]:text-slate-400 [&_.text-slate-400]:text-slate-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-14 text-center">
              <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-4">
                No courses yet. Start learning today!
              </p>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <Link href="/student/courses">Explore Courses</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Recent Activity */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <span className="font-semibold text-white text-sm">Recent Activity</span>
            </div>
            <div className="p-4 space-y-3">
              {completedProgress && completedProgress.length > 0 ? (
                completedProgress.slice(0, 5).map((cp: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-950 border border-emerald-800/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300 leading-tight">Completed a lesson</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(cp.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">No activity yet</p>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-white text-sm">Upcoming Deadlines</span>
            </div>
            <div className="p-4 space-y-3">
              {pendingAssignments.slice(0, 3).length > 0 ? (
                pendingAssignments.slice(0, 3).map((a: any) => {
                  const due = a.due_date ? new Date(a.due_date) : null;
                  const isOverdue = due && due < new Date();
                  return (
                    <div key={a.id} className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-300 line-clamp-1">
                        {a.title}
                      </p>
                      {due ? (
                        <p
                          className={`text-xs flex items-center gap-1 ${
                            isOverdue ? "text-red-400" : "text-amber-400"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {isOverdue ? "Overdue · " : "Due "}
                          {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600">No due date</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-800 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">All caught up!</p>
                </div>
              )}
            </div>
          </div>

          {pendingAssignments.length > 0 && (
            <Button
              variant="ghost"
              className="w-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9"
              asChild
            >
              <Link href="/student/dashboard">
                View all pending{" "}
                <Badge className="ms-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-1.5 h-4">
                  {pendingAssignments.length}
                </Badge>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
