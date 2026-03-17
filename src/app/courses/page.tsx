import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Users, Star, GraduationCap } from "lucide-react";

export const metadata = {
  title: "Courses | Academy of the Maqam",
  description: "Browse professional online music courses",
};

export default async function PublicCoursesPage() {
  const supabase = createServerClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, price, category, level, teacher_id, profiles:teacher_id(full_name), enrollments(id)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const enriched = (courses || []).map((c: any) => ({
    ...c,
    teacherName: c.profiles?.full_name ?? "Instructor",
    enrollmentCount: c.enrollments?.length ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/courses" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-amber-400" />
            <span className="font-bold text-lg tracking-tight">Academy of the Maqam</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-slate-900 to-slate-950">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Learn Music the <span className="text-amber-400">Professional</span> Way
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Expert-led courses in Maqam theory, Oud, vocals, and more. Learn at your own pace.
        </p>
        <div className="flex justify-center gap-8 text-center text-sm text-slate-400">
          <div><span className="block text-2xl font-bold text-white">{enriched.length}+</span> Courses</div>
          <div><span className="block text-2xl font-bold text-white">{enriched.reduce((s, c) => s + c.enrollmentCount, 0)}+</span> Students</div>
          <div><span className="block text-2xl font-bold text-white">100%</span> Online</div>
        </div>
      </section>

      {/* Course Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {enriched.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No courses published yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-8">All Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enriched.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Academy of the Maqam. All rights reserved.
      </footer>
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  const levelColor: Record<string, string> = {
    beginner: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
    intermediate: "bg-amber-900/50 text-amber-400 border-amber-800",
    advanced: "bg-rose-900/50 text-rose-400 border-rose-800",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-600 transition-colors group">
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-800 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-slate-600" />
          </div>
        )}
        {course.category && (
          <span className="absolute top-3 left-3 text-xs font-medium bg-slate-900/80 text-slate-300 px-2 py-1 rounded-full border border-slate-700">
            {course.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-base leading-snug line-clamp-2">{course.title}</h3>
          {course.level && (
            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${levelColor[course.level] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
              {course.level}
            </span>
          )}
        </div>

        {course.description && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">{course.description}</p>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              {course.teacherName}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.enrollmentCount} students
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              {course.price > 0 ? `$${course.price}` : <span className="text-emerald-400">Free</span>}
            </span>
            <Link
              href={`/login?redirect=/student/courses/${course.id}`}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
