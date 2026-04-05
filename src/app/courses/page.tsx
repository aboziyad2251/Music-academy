import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Users, Star, GraduationCap, Music2, Award,
  PlayCircle, CheckCircle, ChevronRight, Globe, Zap, Heart
} from "lucide-react";

export const metadata = {
  title: "أكاديمية المقام — Academy of the Maqam",
  description: "Professional online Arabic music education. Learn Oud, Maqam theory, vocals and more from expert instructors.",
};

export default async function PublicCoursesPage() {
  const supabase = createServerClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, price, category, level, teacher_id, profiles:teacher_id(full_name, avatar_url), enrollments(id), course_reviews(rating)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const enriched = (courses || []).map((c: any) => {
    const ratings: number[] = (c.course_reviews ?? []).map((r: any) => r.rating);
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    return {
      ...c,
      teacherName: c.profiles?.full_name ?? "Instructor",
      teacherAvatar: c.profiles?.avatar_url ?? null,
      enrollmentCount: c.enrollments?.length ?? 0,
      avgRating,
      totalReviews: ratings.length,
    };
  });

  const totalStudents = enriched.reduce((s, c) => s + c.enrollmentCount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Navbar ── */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/courses" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Music2 className="h-4 w-4 text-slate-950" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white text-sm tracking-tight font-amiri">أكاديمية المقام</span>
              <span className="text-[9px] text-amber-400 tracking-widest">ACADEMY OF THE MAQAM</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#courses" className="hover:text-white transition-colors">Courses</a>
            <a href="#features" className="hover:text-white transition-colors">Why Us</a>
            <a href="#instructors" className="hover:text-white transition-colors">Instructors</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-amber-400 mb-6">
            <Zap className="h-3 w-3" />
            The #1 Arabic Music Academy Online
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Master Arabic Music<br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              The Right Way
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Learn authentic Maqam theory, Oud, vocals and more from world-class instructors.
            Structured courses, live feedback, and a community that speaks your language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
            >
              Start Learning Free
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="#courses"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-2xl text-base transition-colors"
            >
              <PlayCircle className="h-4 w-4 text-amber-400" />
              Browse Courses
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { value: `${enriched.length}+`, label: "Courses" },
              { value: `${totalStudents}+`, label: "Students Enrolled" },
              { value: "100%", label: "Online & Self-Paced" },
              { value: "5★", label: "Avg Rating" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-extrabold text-white">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Academy of the Maqam?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to go from beginner to professional musician</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Music2, color: "text-amber-400", bg: "bg-amber-500/10", title: "Authentic Maqam Curriculum", desc: "Courses built around traditional Arabic music theory — not just Western music with Arabic labels." },
              { icon: Globe, color: "text-indigo-400", bg: "bg-indigo-500/10", title: "Arabic & English", desc: "All content available in both languages. Study in the language you think music in." },
              { icon: Award, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Certificates of Completion", desc: "Earn shareable certificates when you finish a course. Add them to your CV or share online." },
              { icon: Zap, color: "text-rose-400", bg: "bg-rose-500/10", title: "AI Music Tutor", desc: "Ask questions about any lesson and get instant, personalized answers from our AI tutor." },
              { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10", title: "Live Q&A in Every Lesson", desc: "Post questions under any lesson and get answers from instructors and fellow students." },
              { icon: CheckCircle, color: "text-teal-400", bg: "bg-teal-500/10", title: "Progress Tracking", desc: "Visual dashboards, streaks, quizzes and leaderboards keep you motivated every step of the way." },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Course Catalog ── */}
      <section id="courses" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">All Courses</h2>
            <p className="text-slate-400">Start with any course — all levels welcome</p>
          </div>

          {enriched.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">No courses published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enriched.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Instructors ── */}
      {enriched.length > 0 && (
        <section id="instructors" className="py-20 px-4 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Meet Your Instructors</h2>
            <p className="text-slate-400 mb-12">Professional musicians and educators dedicated to your growth</p>
            <div className="flex flex-wrap justify-center gap-8">
              {Array.from(
                new Map(enriched.map((c) => [c.teacher_id, { name: c.teacherName, avatar: c.teacherAvatar }])).entries()
              ).map(([id, { name, avatar }]) => (
                <div key={id} className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-amber-500/30 overflow-hidden relative">
                    {avatar ? (
                      <Image src={avatar} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl font-bold text-amber-400">
                        {name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    <p className="text-xs text-slate-500">Music Instructor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-slate-400 mb-8 text-lg">Join thousands of students mastering Arabic music. It&apos;s free to get started.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-10 py-4 rounded-2xl text-base transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
          >
            Create Free Account
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-amber-500 flex items-center justify-center">
              <Music2 className="h-3 w-3 text-slate-950" />
            </div>
            <span className="font-semibold text-white">أكاديمية المقام</span>
          </div>
          <p>© {new Date().getFullYear()} Academy of the Maqam. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/login" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
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
    <Link href={`/login?redirect=/student/courses/${course.id}`}>
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/30 hover:bg-white/[0.05] transition-all group cursor-pointer h-full">
        {/* Thumbnail */}
        <div className="aspect-video bg-slate-800 relative overflow-hidden">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-slate-700" />
            </div>
          )}
          {course.category && (
            <span className="absolute top-3 start-3 text-xs font-medium bg-black/60 backdrop-blur-sm text-slate-300 px-2.5 py-1 rounded-full border border-white/10">
              {course.category}
            </span>
          )}
          {course.price === 0 && (
            <span className="absolute top-3 end-3 text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">
              FREE
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white text-base leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
              {course.title}
            </h3>
            {course.level && (
              <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${levelColor[course.level] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                {course.level}
              </span>
            )}
          </div>

          {course.description && (
            <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">{course.description}</p>
          )}

          {/* Teacher */}
          <div className="flex items-center gap-2 mb-4 mt-auto">
            <div className="h-6 w-6 rounded-full bg-slate-700 overflow-hidden relative flex-shrink-0">
              {course.teacherAvatar ? (
                <Image src={course.teacherAvatar} alt={course.teacherName} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {course.teacherName[0]}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 truncate">{course.teacherName}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Star className={`h-3.5 w-3.5 ${course.avgRating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                {course.avgRating ? (
                  <span className="font-semibold text-amber-400">{course.avgRating}</span>
                ) : "New"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course.enrollmentCount}
              </span>
            </div>
            <span className="text-base font-bold text-white">
              {course.price > 0 ? `$${course.price}` : <span className="text-emerald-400">Free</span>}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
