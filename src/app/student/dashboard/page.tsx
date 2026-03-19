"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlayCircle, Clock, BookOpen, Trophy, Flame, ChevronLeft } from "lucide-react";

interface ProgressData {
  lessonsCompleted: number;
  practiceHours: number;
  maqamLevel: string;
  pointsEarned: number;
  dayStreak: number;
  unlockedMaqamat: string[];
  recentActivity: Array<{ action: string; date: string }>;
}

interface ActiveCourseData {
  id: string;
  title: string;
  teacher: string;
  nextLesson: string;
  nextLessonId: string | null;
  progressPct: number;
}

const MAQAM_NODES = ["راست", "بياتي", "حجاز", "صبا", "كرد"];

export default function StudentDashboard() {
  const [userName, setUserName] = useState("طالب");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [course, setCourse] = useState<ActiveCourseData | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Fetch user profile
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        if (data?.full_name) {
          setUserName(data.full_name.split(" ")[0]);
        }
      }
    };

    const fetchMockData = async () => {
      try {
        const [progRes, courseRes, enrolledRes] = await Promise.all([
          fetch("/api/student/progress"),
          fetch("/api/student/courses/active"),
          fetch("/api/student/courses/enrolled"),
        ]);

        if (progRes.ok) setProgress(await progRes.json());
        if (courseRes.ok) setCourse(await courseRes.json());
        if (enrolledRes.ok) setEnrolledCourses(await enrolledRes.json());
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoaded(true);
      }
    };

    fetchUser();
    fetchMockData();
  }, [supabase]);

  if (!loaded || !progress) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--gold)] animate-bounce" />
          <div className="w-3 h-3 rounded-full bg-[var(--gold)] animate-bounce delay-100" />
          <div className="w-3 h-3 rounded-full bg-[var(--gold)] animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center" dir="rtl">
        <div className="h-20 w-20 rounded-full bg-[var(--dark-2)] border-2 border-[var(--gold)]/20 flex items-center justify-center">
          <PlayCircle className="h-10 w-10 text-[var(--gold)]/50" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">مرحباً، {userName}!</h2>
          <p className="text-slate-400">لم تنضم إلى أي دورة بعد. ابدأ رحلتك الموسيقية الآن.</p>
        </div>
        <Link
          href="/student/courses"
          className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-bold py-3 px-8 rounded-xl transition-transform hover:scale-105 shadow-[0_4px_20px_rgba(212,160,23,0.3)]"
        >
          استعرض الدورات
        </Link>
      </div>
    );
  }

  // Arabic Date Formatting
  const currentDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Helper to determine node status
  const getNodeStatus = (maqam: string, index: number) => {
    if (progress.unlockedMaqamat.includes(maqam)) {
      // It's unlocked. Is it the current? We'll make the "current" the LAST unlocked one, or the NEXT locked one.
      // Let's assume the highest index unlocked is "current"
      const highestUnlockedIndex = Math.max(...progress.unlockedMaqamat.map(m => MAQAM_NODES.indexOf(m)));
      if (index === highestUnlockedIndex) return 'current';
      return 'unlocked';
    }
    return 'locked';
  };

  return (
    <div className="space-y-8 pb-8 font-amiri" dir="rtl">
      {/* 1. WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[var(--dark-2)] border border-[var(--dark-3)] p-6 rounded-2xl relative overflow-hidden">
        <svg viewBox="0 0 50 50" className="absolute left-0 top-0 w-48 h-48 opacity-[0.03] pointer-events-none fill-[var(--gold)] -translate-x-10 -translate-y-10">
          <polygon points="25,3 28,19 44,19 31,29 36,45 25,36 14,45 19,29 6,19 22,19" />
        </svg>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً، {userName} 🎵</h1>
          <p className="text-[var(--cream)]/60 text-lg">اليوم: {currentDate}</p>
        </div>
        
        <div className="bg-[var(--dark-3)]/80 border border-[var(--gold)]/20 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-sm z-10 w-fit">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-[var(--cream)]/60 font-sans tracking-wide">النشاط المستمر</p>
            <p className="text-xl font-bold text-white tracking-widest">🔥 سلسلة {progress.dayStreak} يوم</p>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-5 rounded-2xl hover:border-[var(--gold)]/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-[var(--cream)]/70 text-sm">الدروس المكتملة</h3>
          </div>
          <p className="text-3xl font-bold text-white">{progress.lessonsCompleted}</p>
        </div>

        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-5 rounded-2xl hover:border-[var(--gold)]/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-[var(--cream)]/70 text-sm">وقت الممارسة</h3>
          </div>
          <p className="text-3xl font-bold text-white">{progress.practiceHours} <span className="text-base font-normal text-slate-500">ساعة</span></p>
        </div>

        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-5 rounded-2xl hover:border-[var(--gold)]/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-[var(--teal)]/10 p-2.5 rounded-lg border border-[var(--teal)]/20">
              <svg className="w-5 h-5 text-[var(--teal)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-[var(--cream)]/70 text-sm">مستوى المقام</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--teal)]">{progress.maqamLevel}</p>
        </div>

        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-5 rounded-2xl hover:border-[var(--gold)]/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-[var(--gold)]/10 p-2.5 rounded-lg border border-[var(--gold)]/20">
              <Trophy className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <h3 className="text-[var(--cream)]/70 text-sm">النقاط المكتسبة</h3>
          </div>
          <p className="text-3xl font-bold text-white">{progress.pointsEarned.toLocaleString('ar-EG')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* 3. CURRENT COURSE CARD */}
          <div className="bg-[var(--dark-2)] border-2 border-[var(--dark-3)] rounded-2xl overflow-hidden shadow-lg relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--teal)]/10 to-transparent pointer-events-none" />
            
            <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="space-y-4 flex-1">
                <div className="inline-block px-3 py-1 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-full text-[var(--gold)] text-xs font-sans tracking-wide">
                  متابعة التعلم
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{course.title}</h2>
                  <p className="text-slate-400">مع {course.teacher}</p>
                </div>
                
                <div className="bg-[var(--dark-3)]/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-sm text-slate-400 mb-1">الدرس القادم:</p>
                  <p className="text-lg font-semibold text-[var(--cream)]">{course.nextLesson}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 text-xs font-sans tracking-wide">اكتمل {course.progressPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-l from-[var(--teal)] to-[var(--gold)] rounded-full transition-all duration-1000"
                      style={{ width: `${course.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <Link
                  href={
                    course.nextLessonId
                      ? `/student/courses/${course.id}/lessons/${course.nextLessonId}`
                      : `/student/courses/${course.id}`
                  }
                  className="w-full md:w-auto bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-105 shadow-[0_4px_20px_rgba(212,160,23,0.3)]"
                >
                  <PlayCircle className="w-6 h-6" />
                  <span className="text-lg tracking-wide">ابدأ الدرس</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. MAQAM JOURNEY */}
          <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <Star className="text-[var(--gold)] w-5 h-5" />
              رحلة المقامات
            </h2>
            
            <div className="relative flex justify-between items-center px-2 md:px-8">
              {/* Path Line */}
              <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1 bg-slate-800 rounded-full z-0 overflow-hidden">
                <div 
                  className="h-full bg-[var(--gold)] transition-all duration-1000"
                  style={{ width: `${(Math.max(0, Math.max(...progress.unlockedMaqamat.map(m => MAQAM_NODES.indexOf(m)))) / (MAQAM_NODES.length - 1)) * 100}%` }}
                />
              </div>
              
              {/* Nodes */}
              {MAQAM_NODES.map((maqam, index) => {
                const status = getNodeStatus(maqam, index);
                
                return (
                  <div key={maqam} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`
                        w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-4 transition-all duration-500 relative
                        ${status === 'locked' ? 'bg-slate-900 border-slate-800 text-slate-600' : ''}
                        ${status === 'unlocked' ? 'bg-[var(--dark)] border-[var(--gold)] text-[var(--gold)] shadow-[0_0_15px_rgba(212,160,23,0.3)]' : ''}
                        ${status === 'current' ? 'bg-[var(--teal)] border-[var(--teal)] text-[var(--dark)] scale-110 shadow-[0_0_20px_rgba(0,168,150,0.5)]' : ''}
                      `}
                    >
                      {status === 'current' && (
                        <>
                          <div className="absolute inset-0 rounded-full border border-[var(--teal)] animate-ping" style={{ animationDuration: '2s' }} />
                          <div className="absolute inset-[-8px] rounded-full border border-[var(--teal)]/30 animate-ping delay-500" style={{ animationDuration: '2s' }} />
                        </>
                      )}
                      
                      <span className={`text-sm md:text-xl font-bold ${status === 'locked' ? 'opacity-50' : ''}`}>{index + 1}</span>
                    </div>
                    <span className={`mt-3 text-sm md:text-base font-semibold tracking-wide ${status === 'locked' ? 'text-slate-500' : 'text-white'}`}>
                      {maqam}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. RECENT ACTIVITY */}
        <div className="space-y-6">
          <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-[var(--dark-3)] flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">النشاط الأخير</h2>
              <Clock className="w-5 h-5 text-[var(--brand-muted)]" />
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              {progress.recentActivity.map((activity, idx) => {
                const isFirst = idx === 0;
                const actDate = new Date(activity.date);
                const timeStr = new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric', hour12: true }).format(actDate);
                const dateStr = new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric' }).format(actDate);

                return (
                  <div key={idx} className="flex gap-4 relative group">
                    {/* Timeline Line */}
                    {idx !== progress.recentActivity.length - 1 && (
                      <div className="absolute top-8 bottom-[-24px] right-3.5 w-[2px] bg-slate-800" />
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="relative z-10 shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${isFirst ? 'bg-[var(--teal)] border-[var(--teal)] text-[var(--dark)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                         <div className={`w-2 h-2 rounded-full ${isFirst ? 'bg-[var(--dark)]' : 'bg-slate-500'}`} />
                      </div>
                    </div>

                    <div className="pb-1 pt-0.5">
                      <p className={`text-base font-medium leading-snug ${isFirst ? 'text-white' : 'text-slate-300'}`}>
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-sans tracking-wide text-slate-500">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-[var(--dark-3)] bg-[var(--dark-3)]/30">
              <button className="w-full text-center text-sm text-[var(--teal)] hover:text-white transition-colors py-2 flex items-center justify-center gap-1 font-sans tracking-wide">
                عرض كل النشاطات
                <ChevronLeft className="w-4 h-4 rtl:-rotate-180" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MY COURSES PROGRESS */}
      {enrolledCourses.length > 0 && (
        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--dark-3)] flex items-center justify-between">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--teal)]" />
              دوراتي
            </h2>
            <span className="text-xs text-slate-500">{enrolledCourses.length} دورة</span>
          </div>
          <div className="divide-y divide-[var(--dark-3)]">
            {enrolledCourses.map((c: any) => (
              <Link
                key={c.id}
                href={
                  c.nextLessonId
                    ? `/student/courses/${c.id}/lessons/${c.nextLessonId}`
                    : `/student/courses/${c.id}`
                }
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--gold)] transition-colors">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.completedLessons}/{c.totalLessons} دروس مكتملة</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${c.progressPct}%`,
                        background: c.progressPct === 100
                          ? "var(--teal)"
                          : "linear-gradient(to left, var(--teal), var(--gold))",
                      }}
                    />
                  </div>
                </div>

                {/* Percentage */}
                <div className="flex-shrink-0 text-right">
                  {c.progressPct === 100 ? (
                    <span className="text-xs font-bold text-[var(--teal)]">✓ مكتمل</span>
                  ) : (
                    <span className="text-sm font-bold text-white">{c.progressPct}%</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Icon helper function needed locally
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
