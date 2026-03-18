import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = user.id;

  // Fetch completed lessons count
  const { count: lessonsCompleted } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("completed", true);

  // Fetch total practice time from completed lessons' durations
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson:lesson_id(duration_min)")
    .eq("student_id", studentId)
    .eq("completed", true);

  const practiceHours = Math.round(
    ((progressRows ?? []).reduce((acc: number, row: any) => acc + (row.lesson?.duration_min ?? 0), 0) / 60) * 10
  ) / 10;

  // Points = 100 per completed lesson
  const pointsEarned = (lessonsCompleted ?? 0) * 100;

  // Maqam level based on lessons completed
  let maqamLevel = "مبتدئ";
  if ((lessonsCompleted ?? 0) >= 30) maqamLevel = "محترف";
  else if ((lessonsCompleted ?? 0) >= 15) maqamLevel = "متوسط";

  // Day streak: count distinct days with lesson progress activity
  const { data: recentProgress } = await supabase
    .from("lesson_progress")
    .select("updated_at")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(30);

  let dayStreak = 0;
  if (recentProgress && recentProgress.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = [...new Set(recentProgress.map(r => new Date(r.updated_at).toDateString()))];
    for (let i = 0; i < uniqueDays.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (uniqueDays.includes(d.toDateString())) {
        dayStreak++;
      } else {
        break;
      }
    }
  }

  // Unlocked maqamat (1 per 5 completed lessons, cycled through list)
  const MAQAM_NAMES = ["راست", "بياتي", "حجاز", "صبا", "كرد"];
  const unlockedCount = Math.min(Math.floor((lessonsCompleted ?? 0) / 2), MAQAM_NAMES.length);
  const unlockedMaqamat = MAQAM_NAMES.slice(0, unlockedCount);

  // Recent activity from lesson_progress with lesson titles
  const { data: activityRows } = await supabase
    .from("lesson_progress")
    .select("updated_at, completed, lesson:lesson_id(title)")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const recentActivity = (activityRows ?? []).map((row: any) => ({
    action: row.completed
      ? `أكمل درس: ${row.lesson?.title ?? "درس"}`
      : `يتابع درس: ${row.lesson?.title ?? "درس"}`,
    date: row.updated_at,
  }));

  return NextResponse.json({
    lessonsCompleted: lessonsCompleted ?? 0,
    practiceHours,
    maqamLevel,
    pointsEarned,
    dayStreak,
    unlockedMaqamat,
    recentActivity,
  });
}
