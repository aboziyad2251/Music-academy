import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  DollarSign,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const STAT_CONFIG = [
  {
    key: "courseCount",
    label: "Total Courses",
    icon: BookOpen,
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-800/40",
  },
  {
    key: "studentCount",
    label: "Total Students",
    icon: Users,
    color: "text-indigo-400",
    bg: "bg-indigo-950/60",
    border: "border-indigo-800/40",
  },
  {
    key: "pendingCount",
    label: "Pending Submissions",
    icon: ClipboardCheck,
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/40",
  },
  {
    key: "revenue",
    label: "Est. Revenue",
    icon: DollarSign,
    color: "text-teal-400",
    bg: "bg-teal-950/60",
    border: "border-teal-800/40",
    prefix: "$" as string | undefined,
  },
];

export default async function TeacherDashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const userId = session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const { count: courseCount } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", userId);

  const { data: teacherCourses } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url, status, price")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });

  const courseIds = teacherCourses?.map((c: any) => c.id) ?? [];

  let studentCount = 0;
  let pendingCount = 0;
  let avgScore: number | null = null;
  let revenue = 0;
  let recentSubmissions: any[] = [];

  if (courseIds.length > 0) {
    const { count: sc } = await supabase
      .from("enrollments")
      .select("student_id", { count: "exact", head: true })
      .in("course_id", courseIds);
    studentCount = sc ?? 0;

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("course_id", courseIds);
    const lessonIds = lessons?.map((l: any) => l.id) ?? [];

    if (lessonIds.length > 0) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .in("lesson_id", lessonIds);
      const assignmentIds = assignments?.map((a: any) => a.id) ?? [];

      if (assignmentIds.length > 0) {
        const { count: pc } = await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .in("assignment_id", assignmentIds)
          .is("score", null);
        pendingCount = pc ?? 0;

        const { data: graded } = await supabase
          .from("submissions")
          .select("score")
          .in("assignment_id", assignmentIds)
          .not("score", "is", null);

        if (graded && graded.length > 0) {
          const sum = graded.reduce((acc: number, s: any) => acc + (s.score ?? 0), 0);
          avgScore = Math.round(sum / graded.length);
        }

        const { data: subs } = await supabase
          .from("submissions")
          .select("id, submitted_at, score, student:student_id(full_name), assignment:assignment_id(title)")
          .in("assignment_id", assignmentIds)
          .order("submitted_at", { ascending: false })
          .limit(5);
        recentSubmissions = subs ?? [];
      }
    }

    const { data: enrolledCourses } = await supabase
      .from("enrollments")
      .select("course_id, courses:course_id(price)")
      .in("course_id", courseIds);

    if (enrolledCourses) {
      revenue = enrolledCourses.reduce(
        (acc: number, e: any) => acc + (e.courses?.price ?? 0),
        0
      );
    }
  }

  const statValues: Record<string, number | string> = {
    courseCount: courseCount ?? 0,
    studentCount,
    pendingCount,
    revenue: revenue.toLocaleString(),
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Teacher";

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome back, {firstName} 🎓
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Here&apos;s an overview of your teaching dashboard.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
          <Link href="/teacher/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Course
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, border, prefix }) => (
          <div key={key} className={`rounded-xl border ${border} ${bg} p-5 space-y-4`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${color} tabular-nums`}>
                {prefix ?? ""}{statValues[key]}
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
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 h-8 text-xs"
              asChild
            >
              <Link href="/teacher/courses">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {teacherCourses && teacherCourses.length > 0 ? (
            <div className="space-y-3">
              {teacherCourses.slice(0, 5).map((course: any) => (
                <Link
                  key={course.id}
                  href={`/teacher/courses/${course.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {course.thumbnail_url ? (
                      <Image 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        fill
                        className="object-cover" 
                      />
                    ) : (
                      <BookOpen className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{course.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">${course.price}</p>
                  </div>
                  <Badge
                    className={
                      course.status === "published"
                        ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }
                  >
                    {course.status ?? "draft"}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-14 text-center">
              <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-4">No courses yet. Create your first course!</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <Link href="/teacher/courses/new">Create Course</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Avg Score */}
          {avgScore !== null && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-950/60 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. Student Score</p>
                <p className="text-3xl font-bold text-amber-400">{avgScore}%</p>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-white text-sm">Recent Submissions</span>
              </div>
              {pendingCount > 0 && (
                <Badge className="bg-amber-600 text-white text-[10px] h-4 px-1.5">
                  {pendingCount} ungraded
                </Badge>
              )}
            </div>
            <div className="p-4 space-y-3">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((sub: any) => (
                  <div key={sub.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-950 border border-indigo-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardCheck className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 leading-tight truncate">
                        {(sub.student as any)?.full_name ?? "Student"}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {(sub.assignment as any)?.title}
                      </p>
                    </div>
                    {sub.score !== null ? (
                      <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">{sub.score}</span>
                    ) : (
                      <span className="text-xs text-amber-400 flex-shrink-0">Pending</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">No submissions yet</p>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="px-4 pb-4">
                <Button
                  variant="ghost"
                  className="w-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9"
                  asChild
                >
                  <Link href="/teacher/grades">
                    Grade submissions <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
