import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Award, CheckCircle2, Star, Music } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/student/PrintButton";

export default async function CertificatePage({
  params,
}: {
  params: { courseId: string };
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("enrolled_at")
    .eq("course_id", params.courseId)
    .eq("student_id", user.id)
    .single();

  if (!enrollment) redirect(`/student/courses/${params.courseId}`);

  // Get course + teacher
  const { data: course } = await supabase
    .from("courses")
    .select("title, category, level, teacher:teacher_id(full_name)")
    .eq("id", params.courseId)
    .single();

  if (!course) redirect("/student/courses");

  // Get total lessons
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", params.courseId);

  // Get completed lessons
  const { count: completedLessons } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("completed", true)
    .in(
      "lesson_id",
      (
        await supabase
          .from("lessons")
          .select("id")
          .eq("course_id", params.courseId)
      ).data?.map((l: any) => l.id) ?? []
    );

  // Must have completed all lessons
  if (!totalLessons || completedLessons !== totalLessons) {
    redirect(`/student/courses/${params.courseId}`);
  }

  // Get student profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Completion date = latest lesson_progress updated_at
  const { data: lastProgress } = await supabase
    .from("lesson_progress")
    .select("updated_at")
    .eq("student_id", user.id)
    .eq("completed", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const completionDate = lastProgress?.updated_at
    ? new Date(lastProgress.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const teacherName = (course.teacher as any)?.full_name ?? "The Instructor";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
      {/* Back link */}
      <Link
        href={`/student/courses/${params.courseId}`}
        className="self-start mb-8 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
      >
        ← Back to Course
      </Link>

      {/* Certificate card */}
      <div className="w-full max-w-2xl relative">
        {/* Outer border decoration */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 via-transparent to-amber-700/20 blur-xl" />

        <div className="relative rounded-3xl bg-slate-900 border-2 border-amber-600/60 shadow-2xl shadow-amber-900/30 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

          <div className="px-8 py-10 md:px-14 md:py-14 text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center">
                  <Award className="h-10 w-10 text-amber-400" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Academy name */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-amber-500/70 text-xs font-bold uppercase tracking-[0.2em]">
                <Music className="h-3 w-3" />
                <span>Academy of the Maqam</span>
                <Music className="h-3 w-3" />
              </div>
              <p className="text-slate-500 text-sm">Certificate of Completion</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-600/40" />
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-600/40" />
            </div>

            {/* Student name */}
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">This certifies that</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {profile?.full_name ?? "Student"}
              </h1>
              <p className="text-slate-400 text-sm">has successfully completed</p>
            </div>

            {/* Course name */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 px-6 py-4 space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                {course.title}
              </h2>
              <p className="text-sm text-slate-500 capitalize">
                {course.category} · {course.level} level · {totalLessons} lessons
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-600/40" />
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-600/40" />
            </div>

            {/* Footer row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-slate-600 text-xs uppercase tracking-wider mb-1">Instructor</p>
                <p className="font-bold text-slate-200">{teacherName}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-xs uppercase tracking-wider mb-1">Completed On</p>
                <p className="font-bold text-slate-200">{completionDate}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-xs uppercase tracking-wider mb-1">Lessons</p>
                <p className="font-bold text-emerald-400">{totalLessons} / {totalLessons}</p>
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col items-center gap-3 print:hidden">
        <PrintButton />
        <p className="text-xs text-slate-600">
          Opens your browser&apos;s print dialog — choose &quot;Save as PDF&quot; as the destination
        </p>
      </div>
    </div>
  );
}
