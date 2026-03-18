"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Star,
  Flame,
  Trophy,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  Award,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressStats {
  lessonsCompleted: number;
  practiceHours: number;
  maqamLevel: string;
  pointsEarned: number;
  dayStreak: number;
  unlockedMaqamat: string[];
  recentActivity: { action: string; date: string }[];
}

interface CourseProgress {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: string | null;
}

export default function StudentProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [statsRes, coursesRes] = await Promise.all([
        fetch("/api/student/progress"),
        fetch("/api/student/courses/enrolled"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: "Lessons Completed",
      value: stats?.lessonsCompleted ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-800/40",
    },
    {
      label: "Practice Hours",
      value: `${stats?.practiceHours ?? 0}h`,
      icon: Clock,
      color: "text-indigo-400",
      bg: "bg-indigo-950/40 border-indigo-800/40",
    },
    {
      label: "Day Streak",
      value: `${stats?.dayStreak ?? 0}🔥`,
      icon: Flame,
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-800/40",
    },
    {
      label: "Points Earned",
      value: (stats?.pointsEarned ?? 0).toLocaleString(),
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-950/40 border-yellow-800/40",
    },
  ];

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">My Progress</h1>
        <p className="text-slate-400 mt-1 text-sm">Track your learning journey across all courses.</p>
      </div>

      {/* Level badge */}
      {stats?.maqamLevel && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-indigo-950/60 border border-amber-800/30">
          <Trophy className="h-8 w-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Current Level</p>
            <p className="text-2xl font-extrabold text-amber-300">{stats.maqamLevel}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <s.icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <p className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course Progress */}
      {courses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            Course Progress
          </h2>
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl bg-slate-900 border border-slate-800 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{course.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {course.completedLessons} / {course.totalLessons} lessons
                      </p>
                    </div>
                  </div>

                  {course.progressPct === 100 ? (
                    <Link
                      href={`/student/courses/${course.id}/certificate`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex-shrink-0 transition-colors"
                    >
                      <Award className="h-3.5 w-3.5" /> Certificate
                    </Link>
                  ) : course.nextLessonId ? (
                    <Link
                      href={`/student/courses/${course.id}/lessons/${course.nextLessonId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex-shrink-0 transition-colors"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Continue
                    </Link>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span className={`font-bold ${course.progressPct === 100 ? "text-amber-400" : "text-white"}`}>
                      {course.progressPct}%
                    </span>
                  </div>
                  <Progress
                    value={course.progressPct}
                    className="h-2 bg-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlocked Maqamat */}
      {stats && stats.unlockedMaqamat.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Unlocked Maqamat</h2>
          <div className="flex flex-wrap gap-2">
            {stats.unlockedMaqamat.map((m) => (
              <span
                key={m}
                className="px-4 py-2 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 font-bold text-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.recentActivity.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          <div className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-slate-300">{a.action}</p>
                <p className="text-xs text-slate-500 flex-shrink-0 ms-4">
                  {new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No courses yet</p>
          <p className="text-sm mt-1">
            <Link href="/student/courses" className="text-indigo-400 hover:text-indigo-300 underline">
              Browse courses
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}
    </div>
  );
}
