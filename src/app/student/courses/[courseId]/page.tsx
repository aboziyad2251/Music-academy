"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PlayCircle,
  CheckCircle2,
  Lock,
  User,
  Clock,
  ArrowLeft,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchCourseDetails() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: courseData } = await supabase
        .from("courses")
        .select("*, teacher:teacher_id(full_name, bio, avatar_url)")
        .eq("id", params.courseId)
        .single();

      if (courseData) setCourse(courseData);

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", params.courseId)
        .eq("student_id", session.user.id)
        .single();

      const enrolled = !!enrollmentData;
      setIsEnrolled(enrolled);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", params.courseId)
        .order("position", { ascending: true });

      if (lessonsData) setLessons(lessonsData);

      const { count: totalEnrolled } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", params.courseId);

      setEnrollmentCount(totalEnrolled ?? 0);

      if (enrolled) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("student_id", session.user.id)
          .eq("completed", true);

        if (progressData) {
          setProgress(new Set(progressData.map((p: any) => p.lesson_id)));
        }
      }

      setLoading(false);
    }

    fetchCourseDetails();
  }, [params.courseId, supabase]);

  const handleEnroll = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: params.courseId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
        <Button
          variant="ghost"
          className="mt-4 text-slate-400 hover:text-white"
          onClick={() => router.push("/student/courses")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>
      </div>
    );
  }

  const completedCount = progress.size;
  const totalLessons = lessons.length;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Back */}
      <Link
        href="/student/courses"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white capitalize">
                {course.category}
              </Badge>
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-300 capitalize"
              >
                {course.level}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              {course.title}
            </h1>
            <p className="text-slate-400 leading-relaxed">
              {course.description ?? "No description provided for this course."}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-5 mt-5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                4.8
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {enrollmentCount ?? "..."} students
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {totalLessons} lessons
              </span>
            </div>
          </div>

          {/* Instructor */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="text-base font-bold text-white mb-4">Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {course.teacher?.avatar_url ? (
                  <Image
                    src={course.teacher.avatar_url}
                    alt="Teacher"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {course.teacher?.full_name ?? "Unknown Instructor"}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {course.teacher?.bio ?? "Expert music instructor with years of teaching experience."}
                </p>
              </div>
            </div>
          </div>

          {/* Lesson List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Course Syllabus</h2>
              {isEnrolled && totalLessons > 0 && (
                <span className="text-xs text-slate-500">
                  {completedCount}/{totalLessons} completed
                </span>
              )}
            </div>

            {lessons.length > 0 ? (
              <div className="space-y-2">
                {lessons.map((lesson, idx) => {
                  const isCompleted = progress.has(lesson.id);
                  const isAccessible = isEnrolled;

                  return isAccessible ? (
                    <Link
                      key={lesson.id}
                      href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-700 hover:bg-slate-800/80 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-emerald-950 border border-emerald-700"
                              : "bg-slate-800 border border-slate-700 group-hover:border-indigo-600"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200 group-hover:text-white text-sm">
                            {idx + 1}. {lesson.title}
                          </h4>
                          {lesson.duration_min && (
                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {lesson.duration_min} min
                            </p>
                          )}
                        </div>
                      </div>
                      {isCompleted && (
                        <Badge className="bg-emerald-900 text-emerald-300 border-0 text-xs">
                          Done
                        </Badge>
                      )}
                    </Link>
                  ) : (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                          <Lock className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        <h4 className="font-medium text-slate-500 text-sm">
                          {idx + 1}. {lesson.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-600 italic text-sm py-8 text-center">
                Lessons are being prepared.
              </p>
            )}
          </div>
        </div>

        {/* ── Sticky Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            {/* Thumbnail */}
            <div className="aspect-video w-full bg-slate-800 flex items-center justify-center relative overflow-hidden">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                />
              ) : (
                <PlayCircle className="h-14 w-14 text-slate-600" />
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Price */}
              <div className="text-center">
                <span className="text-4xl font-extrabold text-white">
                  ${course.price ?? 0}
                </span>
              </div>

              {/* CTA */}
              {isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-950 border border-emerald-800 p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <p className="font-medium text-emerald-300 text-sm">
                      You&apos;re enrolled!
                    </p>
                  </div>
                  {lessons.length > 0 && (
                    <Link
                      href={`/student/courses/${course.id}/lessons/${lessons[0]?.id}`}
                    >
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11">
                        Continue Learning
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={checkoutLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-base"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Enroll Now"
                  )}
                </Button>
              )}

              {/* Details */}
              <ul className="space-y-2.5 text-sm border-t border-slate-800 pt-5">
                {[
                  { label: "Access", value: "Lifetime" },
                  { label: "Category", value: course.category, capitalize: true },
                  { label: "Level", value: course.level, capitalize: true },
                  { label: "Lessons", value: `${totalLessons} lessons` },
                ].map(({ label, value, capitalize }) => (
                  <li key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span
                      className={`font-medium text-slate-200 ${capitalize ? "capitalize" : ""}`}
                    >
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
